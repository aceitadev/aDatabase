import { getTableName } from "./decorators/Table";
import { getColumnMeta } from "./decorators/Column";
import { ActiveRecord } from "./ActiveRecord";
import { query } from "./Database";
import { PersistenceException } from "./PersistenceException";
import { GenericConnection } from "./adapters/IDatabaseAdapter";
import { getBelongsToMeta } from "./decorators/BelongsTo";
import { getHasManyMeta } from "./decorators/HasMany";
import { getHasOneMeta } from "./decorators/HasOne";

type WhereClause = { field: string; operator: string; value: any; booleanOp: "AND" | "OR" };

function camelToSnake(s: string) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export class QueryBuilder<T extends ActiveRecord> {
    private whereClauses: WhereClause[] = [];
    private _limit?: number;
    private _offset?: number;
    private _orderBy?: { column: string, direction: 'asc' | 'desc' };
    private _includes: (new (...args: any[]) => any)[] = [];
    private primaryKey: string = 'id';

    constructor(private model: { new(): T }) {
        const colMeta = getColumnMeta(this.model);
        if (colMeta) {
            for (const [prop, opts] of colMeta.entries()) {
                if (opts.id) {
                    this.primaryKey = prop;
                    break;
                }
            }
        }
    }

    public where(field: keyof T | string, operator: string, value: any): this {
        this.whereClauses.push({ field: field as string, operator, value, booleanOp: "AND" });
        return this;
    }

    public include(...models: (new (...args: any[]) => any)[]): this {
        this._includes.push(...models);
        return this;
    }

    public orderBy(column: keyof T | string, direction: 'asc' | 'desc' = 'asc'): this {
        this._orderBy = { column: column as string, direction };
        return this;
    }

    public limit(count: number): this {
        this._limit = count;
        return this;
    }

    public offset(count: number): this {
        this._offset = count;
        return this;
    }

    public async first(): Promise<T | null> {
        this._limit = 1;
        const rows = await this.get();
        return rows.length > 0 ? rows[0] : null;
    }

    public async count(): Promise<number> {
        const table = getTableName(this.model);
        if (!table) {
            throw new PersistenceException("Model has no @Table", null);
        }

        const columnsMeta = getColumnMeta(this.model);
        if (!columnsMeta) {
            throw new PersistenceException("Model has no @Column decorators", null);
        }

        const allowedOperators = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];
        const params: any[] = [];
        const baseAlias = 't1';

        let sql = `SELECT COUNT(*) as count FROM \`${table}\` AS ${baseAlias}`;

        if (this.whereClauses.length > 0) {
            sql += " WHERE ";
            this.whereClauses.forEach((c, i) => {
                if (!allowedOperators.includes(c.operator.toUpperCase())) {
                    throw new Error(`Invalid operator used: ${c.operator}`);
                }

                if (i > 0) {
                    sql += ` ${c.booleanOp} `;
                }

                const colName = this.getColumnName(c.field, columnsMeta);
                sql += `\`${baseAlias}\`.\`${colName}\` ${c.operator} ?`;
                params.push(c.value);
            });
        }

        try {
            const rows = await query(sql, params);
            if (rows && rows.length > 0 && rows[0].count !== undefined) {
                return Number(rows[0].count);
            }
            return 0;
        } catch (error) {
            console.error("Failed to execute count query:", error);
            throw new PersistenceException("Failed to count records");
        }
    }

    public async get(): Promise<T[]> {
        const table = getTableName(this.model);
        if (!table) throw new PersistenceException("Model has no @Table", null);

        const columnsMeta = getColumnMeta(this.model);
        if (!columnsMeta) throw new PersistenceException("Model has no @Column decorators", null);

        const params: any[] = [];
        const baseAlias = 't1';
        let selectFields = `${baseAlias}.*`;
        let joinClause = '';

        const allRelationMetas = [
            { meta: getBelongsToMeta(this.model), type: 'BelongsTo' },
            { meta: getHasManyMeta(this.model), type: 'HasMany' },
            { meta: getHasOneMeta(this.model), type: 'HasOne' }
        ];

        if (this._includes.length > 0) {
            this._includes.forEach((includeModel, index) => {
                const relationAlias = `t${index + 2}`;
                let relationInfo: { prop: string, opts: any, type: string } | null = null;

                for (const { meta, type } of allRelationMetas) {
                    if (meta) {
                        for (const [prop, opts] of meta.entries()) {
                            if (opts.model() === includeModel) {
                                relationInfo = { prop, opts, type };
                                break;
                            }
                        }
                    }
                    if (relationInfo) break;
                }

                if (relationInfo) {
                    const relatedTable = getTableName(includeModel);
                    const relatedColumnsMeta = getColumnMeta(includeModel);
                    if (!relatedTable || !relatedColumnsMeta) return;

                    for (const prop of relatedColumnsMeta.keys()) {
                        const colName = this.getColumnName(prop, relatedColumnsMeta);
                        selectFields += `, ${relationAlias}.\`${colName}\` AS \`${relationInfo.prop}__${prop}\``;
                    }

                    if (relationInfo.type === 'BelongsTo') {
                        const foreignKey = relationInfo.opts.foreignKey;
                        const foreignKeyCol = this.getColumnName(foreignKey, columnsMeta);
                        joinClause += ` LEFT JOIN \`${relatedTable}\` AS ${relationAlias} ON ${baseAlias}.\`${foreignKeyCol}\` = ${relationAlias}.id`;
                    } else { // HasOne or HasMany
                        const foreignKey = relationInfo.opts.foreignKey;
                        const foreignKeyCol = this.getColumnName(foreignKey, relatedColumnsMeta);
                        joinClause += ` LEFT JOIN \`${relatedTable}\` AS ${relationAlias} ON ${baseAlias}.id = ${relationAlias}.\`${foreignKeyCol}\``;
                    }
                }
            });
        }

        let sql = `SELECT ${selectFields} FROM \`${table}\` AS ${baseAlias}${joinClause}`;

        if (this.whereClauses.length) {
            sql += " WHERE ";
            this.whereClauses.forEach((c, i) => {
                if (i > 0) sql += ` ${c.booleanOp} `;
                const colName = this.getColumnName(c.field, columnsMeta);
                sql += `${baseAlias}.\`${colName}\` ${c.operator} ?`;
                params.push(c.value);
            });
        }

        if (this._orderBy) {
            const colName = this.getColumnName(this._orderBy.column, columnsMeta);
            sql += ` ORDER BY ${baseAlias}.\`${colName}\` ${this._orderBy.direction.toUpperCase()}`;
        }

        if (this._limit) {
            sql += ` LIMIT ${this._limit}`;
        }

        if (this._offset) {
            sql += ` OFFSET ${this._offset}`;
        }

        sql += ";";

        const rows = await query(sql, params);
        return this.mapRowsToEntities(rows as any[]);
    }

    private getColumnName(prop: string, meta: Map<string, any>): string {
        const opts = meta.get(prop);
        return opts?.name ? opts.name : camelToSnake(prop);
    }

    private mapRowsToEntities(rows: any[]): T[] {
        const mainEntityMap = new Map<any, T>();
        const columnsMeta = getColumnMeta(this.model)!;
        const allRelationMetas = [
            { meta: getBelongsToMeta(this.model), type: 'BelongsTo' },
            { meta: getHasManyMeta(this.model), type: 'HasMany' },
            { meta: getHasOneMeta(this.model), type: 'HasOne' }
        ];

        for (const row of rows) {
            const pkValue = row[this.primaryKey];
            if (!mainEntityMap.has(pkValue)) {
                const obj = new this.model();
                for (const [prop, opts] of columnsMeta.entries()) {
                    const colName = this.getColumnName(prop, columnsMeta);
                    if (row.hasOwnProperty(colName)) {
                        (obj as any)[prop] = row[colName];
                    }
                }
                mainEntityMap.set(pkValue, obj);
            }

            const mainEntity = mainEntityMap.get(pkValue)!;

            for (const { meta, type } of allRelationMetas) {
                if (meta) {
                    for (const [relationProp, opts] of meta.entries()) {
                        const prefix = `${relationProp}__`;
                        if (row[`${prefix}id`] === null) continue;

                        const relatedModelCtor = opts.model();
                        const relatedObj = new relatedModelCtor();
                        const relatedColsMeta = getColumnMeta(relatedModelCtor)!;
                        for (const [prop] of relatedColsMeta.entries()) {
                            (relatedObj as any)[prop] = row[`${prefix}${prop}`];
                        }

                        if (type === 'HasMany') {
                            if (!(mainEntity as any)[relationProp]) {
                                (mainEntity as any)[relationProp] = [];
                            }
                            (mainEntity as any)[relationProp].push(relatedObj);
                        } else { // BelongsTo or HasOne
                            (mainEntity as any)[relationProp] = relatedObj;
                        }
                    }
                }
            }
        }
        return Array.from(mainEntityMap.values());
    }
}