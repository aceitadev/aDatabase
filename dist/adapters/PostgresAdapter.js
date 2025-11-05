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
exports.PostgresAdapter = void 0;
const pg_1 = require("pg");
class PostgresAdapter {
    constructor() {
        this.type = 'postgres';
        this.pool = null;
    }
    init(config) {
        if (this.pool) {
            console.warn("[aDatabase] Connection pool already initialized.");
            return;
        }
        try {
            this.pool = new pg_1.Pool({
                connectionString: config.url,
            });
            console.log("[aDatabase] PostgreSQL connection pool initialized.");
        }
        catch (error) {
            console.error("[aDatabase] PostgreSQL connection pool initialization failed:", error);
            process.exit(1);
        }
    }
    getPool() {
        if (!this.pool) {
            throw new Error("PostgreSQL connection pool not initialized.");
        }
        return this.pool;
    }
    formatSql(sql) {
        let paramIndex = 1;
        return sql.replace(/\?/g, () => `$${paramIndex++}`);
    }
    quoteIdentifiers(sql) {
        return sql.replace(/`([^`]+)`/g, '"$1"');
    }
    query(sql, params, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = connection !== null && connection !== void 0 ? connection : this.getPool();
            const pgSql = this.quoteIdentifiers(this.formatSql(sql));
            const result = yield conn.query(pgSql, params);
            return result.rows;
        });
    }
    execute(sql, params, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const conn = connection !== null && connection !== void 0 ? connection : this.getPool();
            let pgSql = this.quoteIdentifiers(this.formatSql(sql));
            if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
                pgSql = pgSql.trim();
                if (pgSql.endsWith(';')) {
                    pgSql = pgSql.slice(0, -1);
                }
                pgSql += ' RETURNING id';
            }
            const result = yield conn.query(pgSql, params);
            return {
                insertId: (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.id,
                affectedRows: result.rowCount
            };
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getPool().connect();
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool) {
                yield this.pool.end();
                this.pool = null;
            }
        });
    }
}
exports.PostgresAdapter = PostgresAdapter;
