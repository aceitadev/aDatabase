import { getTableName } from "./decorators/Table";
import { getColumnMeta } from "./decorators/Column";
import { getNullableMeta } from "./decorators/Nullable";
import { getConnection, getAdapter, execute, query } from "./Database";

function camelToSnake(s: string) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export class SchemaManager {
    private models: Function[];
    private changes: Map<string, string[]> = new Map();

    constructor(models: Function[]) {
        this.models = models;
    }

    async migrate() {
        this.changes.clear();

        for (const model of this.models) {
            const table = getTableName(model as Function);
            if (!table) continue;

            const { columns, indexes, primaryKey } = this.getSchemaFromModel(model as any);
            const existing = await this.getExistingColumns(table);

            if (Object.keys(existing).length === 0) {
                await this.createTable(table, columns, indexes);
            } else {
                await this.updateTable(table, columns, indexes, existing, primaryKey);
            }
        }

        this.printMigrationSummary();
    }

    private printMigrationSummary() {
        if (this.changes.size === 0) {
            return;
        }

        console.log("Database Updated:");
        const tableEntries = Array.from(this.changes.entries());

        tableEntries.forEach(([table, changes], tableIndex) => {
            const isLastTable = tableIndex === tableEntries.length - 1;
            const tablePrefix = isLastTable ? "└─" : "├─";

            if (tableIndex > 0) {
                console.log("│");
            }
            console.log(`${tablePrefix} ${table}`);

            changes.forEach((change, changeIndex) => {
                const isLastChange = changeIndex === changes.length - 1;
                const changeLinePrefix = isLastTable ? "   " : "│ ";
                const changeConnector = isLastChange ? "└─" : "├─";
                console.log(`${changeLinePrefix} ${changeConnector} ${change}`);
            });
        });
    }

    private async createTable(table: string, columns: Record<string, string>, indexes: string[]) {
        const adapter = getAdapter();
        const colsSql = Object.entries(columns).map(([k, v]) => `\`${k}\` ${v}`).join(", ");

        let indexSql = "";
        if (adapter.type === 'mysql' && indexes.length > 0) {
            indexSql = ", " + indexes.map(col => `INDEX \`${col}\` (\`${col}\`)`).join(", ");
        }

        const sql = `CREATE TABLE \`${table}\` (${colsSql}${indexSql});`;
        const conn = await getConnection();
        try {
            await execute(sql, [], conn);
            const columnChanges = Object.keys(columns).map(col => `+ ${col} (added)`);
            this.changes.set(table, columnChanges);
        } finally {
            conn.release();
        }

        if (adapter.type === 'postgres' && indexes.length > 0) {
            for (const col of indexes) {
                const indexName = `idx_${table}_${col}`;
                const indexCreationSql = `CREATE INDEX \`${indexName}\` ON \`${table}\` (\`${col}\`);`;
                const indexConn = await getConnection();
                try {
                    await execute(indexCreationSql, [], indexConn);
                } finally {
                    indexConn.release();
                }
            }
        }
    }

    private async updateTable(table: string, desired: Record<string, string>, indexes: string[], existing: Record<string, string>, primaryKey: string | null) {
        const tableChanges: string[] = [];
        const conn = await getConnection();
        try {
            for (const [col, type] of Object.entries(desired)) {
                if (col === primaryKey) {
                    continue;
                }

                if (!existing.hasOwnProperty(col)) {
                    const sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${type};`;
                    await execute(sql, [], conn);
                    tableChanges.push(`+ ${col} (added)`);
                } else {
                    const normalize = (t: string) => {
                        let normalized = t.toLowerCase().replace(/\s/g, '').replace('character varying', 'varchar');
                        normalized = normalized.replace(/^(int|integer|tinyint|smallint|mediumint|bigint)\(\d+\)/, '$1');
                        return normalized;
                    };

                    const existingType = normalize(existing[col]);
                    const desiredType = normalize(type.split(' ')[0]);

                    if (existingType !== desiredType) {
                        const sql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`${col}\` ${type};`;
                        await execute(sql, [], conn);
                        tableChanges.push(`~ ${col} (type changed: ${existing[col].toUpperCase()} → ${type.split(' ')[0].toUpperCase()})`);
                    }
                }
            }

            if (tableChanges.length > 0) {
                this.changes.set(table, tableChanges);
            }
        } finally {
            conn.release();
        }
    }

    private getSchemaFromModel(model: any): { columns: Record<string, string>, indexes: string[], primaryKey: string | null } {
        const columns: Record<string, string> = {};
        const indexes: string[] = [];
        let primaryKey: string | null = null;
        const colMeta = getColumnMeta(model);
        const nullableMeta = getNullableMeta(model);
        const adapter = getAdapter();

        if (!colMeta) {
            return { columns, indexes, primaryKey };
        }

        for (const [prop, opts] of colMeta.entries()) {
            const colName = opts?.name ? opts.name : camelToSnake(prop);

            if (opts.index) {
                indexes.push(colName);
            }

            if (opts?.id) {
                primaryKey = colName;
                const type = opts.type || Number;
                if (adapter.type === 'postgres') {
                    columns[colName] = "SERIAL PRIMARY KEY";
                } else {
                    columns[colName] = this.getSqlTypeForClass(type) + " PRIMARY KEY AUTO_INCREMENT";
                }
                continue;
            }

            const type = opts.type;
            if (!type) {
                continue;
            }

            let sqlType = this.getSqlTypeForClass(type);

            if (type === Number && opts.decimal) {
                if (Array.isArray(opts.decimal) && opts.decimal.length === 2) {
                    sqlType = `DECIMAL(${opts.decimal[0]},${opts.decimal[1]})`;
                } else {
                    sqlType = 'DECIMAL(10,2)';
                }
            } else if (type === String && opts?.limit) {
                sqlType = `VARCHAR(${opts.limit})`;
            }

            const isNullable = nullableMeta?.get(prop);
            sqlType += isNullable ? " NULL" : " NOT NULL";

            if (type === Date && !isNullable) {
                if (adapter.type === 'mysql') {
                    sqlType += " DEFAULT CURRENT_TIMESTAMP";
                    if (colName === 'updated_at') {
                        sqlType += " ON UPDATE CURRENT_TIMESTAMP";
                    }
                } else if (adapter.type === 'postgres') {
                    sqlType += " DEFAULT CURRENT_TIMESTAMP";
                }
            }

            if (opts?.unique) sqlType += " UNIQUE";
            columns[colName] = sqlType;
        }

        return { columns, indexes, primaryKey };
    }

    private getSqlTypeForClass(type: any): string {
        const adapterType = getAdapter().type;
        if (!type) return "VARCHAR(255)";
        switch (type) {
            case Number:
                return adapterType === 'postgres' ? "INTEGER" : "INT";
            case String:
                return "VARCHAR(255)";
            case Boolean:
                return adapterType === 'postgres' ? "BOOLEAN" : "TINYINT(1)";
            case Date:
                return "TIMESTAMP";
            default:
                if (type.name === "Array" || type.name === "Object") return "TEXT";
                return "VARCHAR(255)";
        }
    }

    private async getExistingColumns(table: string): Promise<Record<string, string>> {
        const conn = await getConnection();
        const adapter = getAdapter();
        const columns: Record<string, string> = {};
        try {
            let sql: string;
            if (adapter.type === 'postgres') {
                sql = `SELECT column_name, udt_name || COALESCE('(' || character_maximum_length || ')', '') as column_type 
                       FROM information_schema.columns 
                       WHERE table_schema = current_schema() AND table_name = $1`;
            } else { // mysql
                sql = `SELECT COLUMN_NAME, COLUMN_TYPE 
                       FROM INFORMATION_SCHEMA.COLUMNS 
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`;
            }

            const rows = await query(sql, [table], conn);

            if (rows.length === 0) return {};

            if (adapter.type === 'postgres') {
                for (const r of rows as any[]) {
                    columns[r.column_name] = r.column_type;
                }
            } else {
                for (const r of rows as any[]) {
                    columns[r.COLUMN_NAME] = r.COLUMN_TYPE;
                }
            }
        } catch (e) {
            return {}; // Table likely does not exist
        } finally {
            if (conn) conn.release();
        }
        return columns;
    }
}