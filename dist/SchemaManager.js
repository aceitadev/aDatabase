"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = void 0;
const Table_1 = require("./decorators/Table");
const Column_1 = require("./decorators/Column");
const Nullable_1 = require("./decorators/Nullable");
const Database_1 = require("./Database");
function camelToSnake(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
class SchemaManager {
    constructor(models) {
        this.changes = new Map();
        this.models = models;
    }
    migrate() {
        return __awaiter(this, void 0, void 0, function* () {
            this.changes.clear();
            for (const model of this.models) {
                const table = (0, Table_1.getTableName)(model);
                if (!table)
                    continue;
                const { columns, indexes, primaryKey } = this.getSchemaFromModel(model);
                const existing = yield this.getExistingColumns(table);
                if (Object.keys(existing).length === 0) {
                    yield this.createTable(table, columns, indexes);
                }
                else {
                    yield this.updateTable(table, columns, indexes, existing, primaryKey);
                }
            }
            this.printMigrationSummary();
        });
    }
    printMigrationSummary() {
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
    createTable(table, columns, indexes) {
        return __awaiter(this, void 0, void 0, function* () {
            const adapter = (0, Database_1.getAdapter)();
            const colsSql = Object.entries(columns).map(([k, v]) => `\`${k}\` ${v}`).join(", ");
            let indexSql = "";
            if (adapter.type === 'mysql' && indexes.length > 0) {
                indexSql = ", " + indexes.map(col => `INDEX \`${col}\` (\`${col}\`)`).join(", ");
            }
            const sql = `CREATE TABLE \`${table}\` (${colsSql}${indexSql});`;
            const conn = yield (0, Database_1.getConnection)();
            try {
                yield (0, Database_1.execute)(sql, [], conn);
                const columnChanges = Object.keys(columns).map(col => `+ ${col} (adicionado)`);
                this.changes.set(table, columnChanges);
            }
            finally {
                conn.release();
            }
            if (adapter.type === 'postgres' && indexes.length > 0) {
                for (const col of indexes) {
                    const indexName = `idx_${table}_${col}`;
                    const indexCreationSql = `CREATE INDEX \`${indexName}\` ON \`${table}\` (\`${col}\`);`;
                    const indexConn = yield (0, Database_1.getConnection)();
                    try {
                        yield (0, Database_1.execute)(indexCreationSql, [], indexConn);
                    }
                    finally {
                        indexConn.release();
                    }
                }
            }
        });
    }
    updateTable(table, desired, indexes, existing, primaryKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const tableChanges = [];
            const conn = yield (0, Database_1.getConnection)();
            try {
                for (const [col, type] of Object.entries(desired)) {
                    if (col === primaryKey) {
                        continue;
                    }
                    if (!existing.hasOwnProperty(col)) {
                        const sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${type};`;
                        yield (0, Database_1.execute)(sql, [], conn);
                        tableChanges.push(`+ ${col} (adicionado)`);
                    }
                    else {
                        const normalize = (t) => {
                            let normalized = t.toLowerCase().replace(/\s/g, '').replace('character varying', 'varchar');
                            normalized = normalized.replace(/^(int|integer|tinyint|smallint|mediumint|bigint)\(\d+\)/, '$1');
                            return normalized;
                        };
                        const existingType = normalize(existing[col]);
                        const desiredType = normalize(type.split(' ')[0]);
                        if (existingType !== desiredType) {
                            const sql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`${col}\` ${type};`;
                            yield (0, Database_1.execute)(sql, [], conn);
                            tableChanges.push(`~ ${col} (tipo alterado: ${existing[col].toUpperCase()} → ${type.split(' ')[0].toUpperCase()})`);
                        }
                    }
                }
                if (tableChanges.length > 0) {
                    this.changes.set(table, tableChanges);
                }
            }
            finally {
                conn.release();
            }
        });
    }
    getSchemaFromModel(model) {
        const columns = {};
        const indexes = [];
        let primaryKey = null;
        const colMeta = (0, Column_1.getColumnMeta)(model);
        const nullableMeta = (0, Nullable_1.getNullableMeta)(model);
        const adapter = (0, Database_1.getAdapter)();
        if (!colMeta) {
            return { columns, indexes, primaryKey };
        }
        for (const [prop, opts] of colMeta.entries()) {
            const colName = (opts === null || opts === void 0 ? void 0 : opts.name) ? opts.name : camelToSnake(prop);
            if (opts.index) {
                indexes.push(colName);
            }
            if (opts === null || opts === void 0 ? void 0 : opts.id) {
                primaryKey = colName;
                const type = opts.type || Number;
                if (adapter.type === 'postgres') {
                    columns[colName] = "SERIAL PRIMARY KEY";
                }
                else {
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
                    // CORREÇÃO: Removido o espaço após a vírgula
                    sqlType = `DECIMAL(${opts.decimal[0]},${opts.decimal[1]})`;
                }
                else {
                    // CORREÇÃO: Removido o espaço após a vírgula
                    sqlType = 'DECIMAL(10,2)';
                }
            }
            else if (type === String && (opts === null || opts === void 0 ? void 0 : opts.limit)) {
                sqlType = `VARCHAR(${opts.limit})`;
            }
            const isNullable = nullableMeta === null || nullableMeta === void 0 ? void 0 : nullableMeta.get(prop);
            sqlType += isNullable ? " NULL" : " NOT NULL";
            if (type === Date && !isNullable) {
                if (adapter.type === 'mysql') {
                    sqlType += " DEFAULT CURRENT_TIMESTAMP";
                    if (colName === 'updated_at') {
                        sqlType += " ON UPDATE CURRENT_TIMESTAMP";
                    }
                }
                else if (adapter.type === 'postgres') {
                    sqlType += " DEFAULT CURRENT_TIMESTAMP";
                }
            }
            if (opts === null || opts === void 0 ? void 0 : opts.unique)
                sqlType += " UNIQUE";
            columns[colName] = sqlType;
        }
        return { columns, indexes, primaryKey };
    }
    getSqlTypeForClass(type) {
        const adapterType = (0, Database_1.getAdapter)().type;
        if (!type)
            return "VARCHAR(255)";
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
                if (type.name === "Array" || type.name === "Object")
                    return "TEXT";
                return "VARCHAR(255)";
        }
    }
    getExistingColumns(table) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield (0, Database_1.getConnection)();
            const adapter = (0, Database_1.getAdapter)();
            const columns = {};
            try {
                let sql;
                if (adapter.type === 'postgres') {
                    sql = `SELECT column_name, udt_name || COALESCE('(' || character_maximum_length || ')', '') as column_type 
                       FROM information_schema.columns 
                       WHERE table_schema = current_schema() AND table_name = $1`;
                }
                else { // mysql
                    sql = `SELECT COLUMN_NAME, COLUMN_TYPE 
                       FROM INFORMATION_SCHEMA.COLUMNS 
                       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`;
                }
                const rows = yield (0, Database_1.query)(sql, [table], conn);
                if (rows.length === 0)
                    return {};
                if (adapter.type === 'postgres') {
                    for (const r of rows) {
                        columns[r.column_name] = r.column_type;
                    }
                }
                else {
                    for (const r of rows) {
                        columns[r.COLUMN_NAME] = r.COLUMN_TYPE;
                    }
                }
            }
            catch (e) {
                return {}; // Table likely does not exist
            }
            finally {
                if (conn)
                    conn.release();
            }
            return columns;
        });
    }
}
exports.SchemaManager = SchemaManager;
