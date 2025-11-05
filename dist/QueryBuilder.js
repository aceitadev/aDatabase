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
exports.QueryBuilder = void 0;
const Table_1 = require("./decorators/Table");
const Column_1 = require("./decorators/Column");
const Database_1 = require("./Database");
const PersistenceException_1 = require("./PersistenceException");
const BelongsTo_1 = require("./decorators/BelongsTo");
const HasMany_1 = require("./decorators/HasMany");
const HasOne_1 = require("./decorators/HasOne");
function camelToSnake(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.whereClauses = [];
        this._includes = [];
        this.primaryKey = 'id';
        const colMeta = (0, Column_1.getColumnMeta)(this.model);
        if (colMeta) {
            for (const [prop, opts] of colMeta.entries()) {
                if (opts.id) {
                    this.primaryKey = prop;
                    break;
                }
            }
        }
    }
    where(field, operator, value) {
        this.whereClauses.push({ field: field, operator, value, booleanOp: "AND" });
        return this;
    }
    include(...models) {
        this._includes.push(...models);
        return this;
    }
    orderBy(column, direction = 'asc') {
        this._orderBy = { column: column, direction };
        return this;
    }
    limit(count) {
        this._limit = count;
        return this;
    }
    offset(count) {
        this._offset = count;
        return this;
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            this._limit = 1;
            const rows = yield this.get();
            return rows.length > 0 ? rows[0] : null;
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            const table = (0, Table_1.getTableName)(this.model);
            if (!table) {
                throw new PersistenceException_1.PersistenceException("Model has no @Table", null);
            }
            const columnsMeta = (0, Column_1.getColumnMeta)(this.model);
            if (!columnsMeta) {
                throw new PersistenceException_1.PersistenceException("Model has no @Column decorators", null);
            }
            const allowedOperators = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];
            const params = [];
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
                const rows = yield (0, Database_1.query)(sql, params);
                if (rows && rows.length > 0 && rows[0].count !== undefined) {
                    return Number(rows[0].count);
                }
                return 0;
            }
            catch (error) {
                console.error("Failed to execute count query:", error);
                throw new PersistenceException_1.PersistenceException("Failed to count records");
            }
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const table = (0, Table_1.getTableName)(this.model);
            if (!table)
                throw new PersistenceException_1.PersistenceException("Model has no @Table", null);
            const columnsMeta = (0, Column_1.getColumnMeta)(this.model);
            if (!columnsMeta)
                throw new PersistenceException_1.PersistenceException("Model has no @Column decorators", null);
            const params = [];
            const baseAlias = 't1';
            let selectFields = `${baseAlias}.*`;
            let joinClause = '';
            const allRelationMetas = [
                { meta: (0, BelongsTo_1.getBelongsToMeta)(this.model), type: 'BelongsTo' },
                { meta: (0, HasMany_1.getHasManyMeta)(this.model), type: 'HasMany' },
                { meta: (0, HasOne_1.getHasOneMeta)(this.model), type: 'HasOne' }
            ];
            if (this._includes.length > 0) {
                this._includes.forEach((includeModel, index) => {
                    const relationAlias = `t${index + 2}`;
                    let relationInfo = null;
                    for (const { meta, type } of allRelationMetas) {
                        if (meta) {
                            for (const [prop, opts] of meta.entries()) {
                                if (opts.model() === includeModel) {
                                    relationInfo = { prop, opts, type };
                                    break;
                                }
                            }
                        }
                        if (relationInfo)
                            break;
                    }
                    if (relationInfo) {
                        const relatedTable = (0, Table_1.getTableName)(includeModel);
                        const relatedColumnsMeta = (0, Column_1.getColumnMeta)(includeModel);
                        if (!relatedTable || !relatedColumnsMeta)
                            return;
                        for (const prop of relatedColumnsMeta.keys()) {
                            const colName = this.getColumnName(prop, relatedColumnsMeta);
                            selectFields += `, ${relationAlias}.\`${colName}\` AS \`${relationInfo.prop}__${prop}\``;
                        }
                        if (relationInfo.type === 'BelongsTo') {
                            const foreignKey = relationInfo.opts.foreignKey;
                            const foreignKeyCol = this.getColumnName(foreignKey, columnsMeta);
                            joinClause += ` LEFT JOIN \`${relatedTable}\` AS ${relationAlias} ON ${baseAlias}.\`${foreignKeyCol}\` = ${relationAlias}.id`;
                        }
                        else { // HasOne or HasMany
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
                    if (i > 0)
                        sql += ` ${c.booleanOp} `;
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
            const rows = yield (0, Database_1.query)(sql, params);
            return this.mapRowsToEntities(rows);
        });
    }
    getColumnName(prop, meta) {
        const opts = meta.get(prop);
        return (opts === null || opts === void 0 ? void 0 : opts.name) ? opts.name : camelToSnake(prop);
    }
    mapRowsToEntities(rows) {
        const mainEntityMap = new Map();
        const columnsMeta = (0, Column_1.getColumnMeta)(this.model);
        const allRelationMetas = [
            { meta: (0, BelongsTo_1.getBelongsToMeta)(this.model), type: 'BelongsTo' },
            { meta: (0, HasMany_1.getHasManyMeta)(this.model), type: 'HasMany' },
            { meta: (0, HasOne_1.getHasOneMeta)(this.model), type: 'HasOne' }
        ];
        for (const row of rows) {
            const pkValue = row[this.primaryKey];
            if (!mainEntityMap.has(pkValue)) {
                const obj = new this.model();
                for (const [prop, opts] of columnsMeta.entries()) {
                    const colName = this.getColumnName(prop, columnsMeta);
                    if (row.hasOwnProperty(colName)) {
                        obj[prop] = row[colName];
                    }
                }
                mainEntityMap.set(pkValue, obj);
            }
            const mainEntity = mainEntityMap.get(pkValue);
            for (const { meta, type } of allRelationMetas) {
                if (meta) {
                    for (const [relationProp, opts] of meta.entries()) {
                        const prefix = `${relationProp}__`;
                        if (row[`${prefix}id`] === null)
                            continue;
                        const relatedModelCtor = opts.model();
                        const relatedObj = new relatedModelCtor();
                        const relatedColsMeta = (0, Column_1.getColumnMeta)(relatedModelCtor);
                        for (const [prop] of relatedColsMeta.entries()) {
                            relatedObj[prop] = row[`${prefix}${prop}`];
                        }
                        if (type === 'HasMany') {
                            if (!mainEntity[relationProp]) {
                                mainEntity[relationProp] = [];
                            }
                            mainEntity[relationProp].push(relatedObj);
                        }
                        else { // BelongsTo or HasOne
                            mainEntity[relationProp] = relatedObj;
                        }
                    }
                }
            }
        }
        return Array.from(mainEntityMap.values());
    }
}
exports.QueryBuilder = QueryBuilder;
