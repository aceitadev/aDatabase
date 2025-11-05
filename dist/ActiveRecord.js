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
exports.ActiveRecord = void 0;
const Database_1 = require("./Database");
const Column_1 = require("./decorators/Column");
const PersistenceException_1 = require("./PersistenceException");
const QueryBuilder_1 = require("./QueryBuilder");
const Table_1 = require("./decorators/Table");
function camelToSnake(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
class ActiveRecord {
    static getIdField(ctor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.idFieldCache.has(ctor)) {
                return this.idFieldCache.get(ctor);
            }
            const columns = (0, Column_1.getColumnMeta)(ctor);
            if (!columns)
                throw new PersistenceException_1.PersistenceException("Model has no @Column decorators", null);
            for (const [prop, opts] of columns.entries()) {
                if (opts === null || opts === void 0 ? void 0 : opts.id) {
                    this.idFieldCache.set(ctor, prop);
                    return prop;
                }
            }
            throw new PersistenceException_1.PersistenceException("No @Id field on class", null);
        });
    }
    save(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctor = this.constructor;
            const table = (0, Table_1.getTableName)(ctor);
            if (!table)
                throw new PersistenceException_1.PersistenceException("No @Table defined on class", null);
            const columns = (0, Column_1.getColumnMeta)(ctor);
            if (!columns)
                throw new PersistenceException_1.PersistenceException("No @Column decorators found on class", null);
            const conn = tx !== null && tx !== void 0 ? tx : yield (0, Database_1.getConnection)();
            try {
                const idField = yield ActiveRecord.getIdField(ctor);
                const colEntries = [];
                for (const [prop, opts] of columns.entries()) {
                    if (opts === null || opts === void 0 ? void 0 : opts.id)
                        continue;
                    if (!this.hasOwnProperty(prop))
                        continue;
                    const value = this[prop];
                    const colName = (opts === null || opts === void 0 ? void 0 : opts.name) ? opts.name : camelToSnake(prop);
                    colEntries.push({ colName, value });
                }
                const idValue = this[idField];
                if (idValue == null || idValue === 0) {
                    const cols = colEntries.map(c => `\`${c.colName}\``).join(", ");
                    const placeholders = colEntries.map(() => "?").join(", ");
                    const params = colEntries.map(c => c.value === undefined ? null : c.value);
                    const sql = `INSERT INTO 
${table}
 (${cols}) VALUES (${placeholders});`;
                    const res = yield (0, Database_1.execute)(sql, params, conn);
                    if (res.insertId) {
                        this[idField] = res.insertId;
                    }
                }
                else {
                    const setClause = colEntries.map(c => `\`${c.colName}\` = ?`).join(", ");
                    const params = [...colEntries.map(c => c.value === undefined ? null : c.value), idValue];
                    const idColName = camelToSnake(idField);
                    const sql = `UPDATE 
${table}
 SET ${setClause} WHERE 
${idColName}
 = ?;`;
                    yield (0, Database_1.execute)(sql, params, conn);
                }
            }
            catch (e) {
                if (e.code === 'ER_DUP_ENTRY') {
                    throw new PersistenceException_1.PersistenceException(`Duplicate entry violation: ${e.message}`, e);
                }
                throw new PersistenceException_1.PersistenceException(`Failed to save entity: ${e.message}`, e);
            }
            finally {
                if (!tx && conn.release) {
                    conn.release();
                }
            }
            return this;
        });
    }
    static find() {
        return new QueryBuilder_1.QueryBuilder(this);
    }
    delete(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctor = this.constructor;
            const table = (0, Table_1.getTableName)(ctor);
            const idField = yield ActiveRecord.getIdField(ctor);
            const idValue = this[idField];
            if (idValue == null)
                return;
            const conn = tx !== null && tx !== void 0 ? tx : yield (0, Database_1.getConnection)();
            try {
                const idColName = camelToSnake(idField);
                const sql = `DELETE FROM \`${table}\` WHERE \`${idColName}\` = ?`;
                yield (0, Database_1.execute)(sql, [idValue], conn);
            }
            finally {
                if (!tx && conn.release) {
                    conn.release();
                }
            }
        });
    }
}
exports.ActiveRecord = ActiveRecord;
ActiveRecord.idFieldCache = new Map();
