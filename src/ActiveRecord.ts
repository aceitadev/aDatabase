import { getConnection, execute } from "./Database";
import { getColumnMeta } from "./decorators/Column";
import { PersistenceException } from "./PersistenceException";
import { QueryBuilder } from "./QueryBuilder";
import { getTableName } from "./decorators/Table";
import { GenericConnection } from "./adapters/IDatabaseAdapter";

type Constructor<T> = { new(...args: any[]): T };

function camelToSnake(s: string) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export abstract class ActiveRecord {

    private static idFieldCache = new Map<Constructor<any>, string>();

    private static async getIdField(ctor: Constructor<any>): Promise<string> {
        if (this.idFieldCache.has(ctor)) {
            return this.idFieldCache.get(ctor)!;
        }

        const columns = getColumnMeta(ctor);
        if (!columns) throw new PersistenceException("Model has no @Column decorators", null);
        for (const [prop, opts] of columns.entries()) {
            if (opts?.id) {
                this.idFieldCache.set(ctor, prop);
                return prop;
            }
        }
        throw new PersistenceException("No @Id field on class", null);
    }

    async save<T extends ActiveRecord>(this: T, tx?: GenericConnection): Promise<T> {
        const ctor = this.constructor as Constructor<T>;
        const table = getTableName(ctor);
        if (!table) throw new PersistenceException("No @Table defined on class", null);

        const columns = getColumnMeta(ctor);
        if (!columns) throw new PersistenceException("No @Column decorators found on class", null);

        const conn = tx ?? await getConnection();

        try {
            const idField = await ActiveRecord.getIdField(ctor);
            const colEntries: { colName: string; value: any }[] = [];

            for (const [prop, opts] of columns.entries()) {
                if (opts?.id) continue;
                if (!this.hasOwnProperty(prop)) continue;

                const value = (this as any)[prop];
                const colName = opts?.name ? opts.name : camelToSnake(prop);
                colEntries.push({ colName, value });
            }

            const idValue = (this as any)[idField];

            if (idValue == null || idValue === 0) {
                const cols = colEntries.map(c => `\`${c.colName}\``).join(", ");
                const placeholders = colEntries.map(() => "?").join(", ");
                const params = colEntries.map(c => c.value === undefined ? null : c.value);
                const sql = `INSERT INTO 
${table}
 (${cols}) VALUES (${placeholders});`;

                const res = await execute(sql, params, conn as GenericConnection);
                if (res.insertId) {
                    (this as any)[idField] = res.insertId;
                }
            } else {
                const setClause = colEntries.map(c => `\`${c.colName}\` = ?`).join(", ");
                const params = [...colEntries.map(c => c.value === undefined ? null : c.value), idValue];
                const idColName = camelToSnake(idField);
                const sql = `UPDATE 
${table}
 SET ${setClause} WHERE 
${idColName}
 = ?;`;

                await execute(sql, params, conn as GenericConnection);
            }
        } catch (e: any) {
            if (e.code === 'ER_DUP_ENTRY') {
                throw new PersistenceException(`Duplicate entry violation: ${e.message}`, e);
            }
            throw new PersistenceException(`Failed to save entity: ${e.message}`, e);
        } finally {
            if (!tx && (conn as any).release) {
                (conn as any).release();
            }
        }

        return this;
    }

    static find<T extends ActiveRecord>(this: Constructor<T>) {
        return new QueryBuilder<T>(this);
    }

    async delete(this: ActiveRecord, tx?: GenericConnection): Promise<void> {
        const ctor = this.constructor as Constructor<ActiveRecord>;
        const table = getTableName(ctor);
        const idField = await ActiveRecord.getIdField(ctor);
        const idValue = (this as any)[idField];
        if (idValue == null) return;

        const conn = tx ?? await getConnection();
        try {
            const idColName = camelToSnake(idField);
            const sql = `DELETE FROM \`${table}\` WHERE \`${idColName}\` = ?`;
            await execute(sql, [idValue], conn as GenericConnection);
        } finally {
            if (!tx && (conn as any).release) {
                (conn as any).release();
            }
        }
    }
}