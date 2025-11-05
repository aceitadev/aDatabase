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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLAdapter = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
class MySQLAdapter {
    constructor() {
        this.type = 'mysql';
        this.pool = null;
    }
    init(config) {
        var _a;
        if (this.pool) {
            console.warn("[aDatabase] MySQL connection pool already initialized.");
            return;
        }
        try {
            this.pool = promise_1.default.createPool(Object.assign(Object.assign({}, config), { waitForConnections: true, connectionLimit: (_a = config.connectionLimit) !== null && _a !== void 0 ? _a : 10, queueLimit: 0 }));
            console.log("[aDatabase] MySQL connection pool initialized.");
        }
        catch (error) {
            console.error("[aDatabase] MySQL connection pool initialization failed:", error);
            process.exit(1);
        }
    }
    getPool() {
        if (!this.pool) {
            throw new Error("MySQL connection pool not initialized.");
        }
        return this.pool;
    }
    query(sql, params, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = connection !== null && connection !== void 0 ? connection : this.getPool();
            const [rows] = yield conn.query(sql, params);
            return rows;
        });
    }
    execute(sql, params, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = connection !== null && connection !== void 0 ? connection : this.getPool();
            const [result] = yield conn.execute(sql, params);
            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            };
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getPool().getConnection();
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
exports.MySQLAdapter = MySQLAdapter;
