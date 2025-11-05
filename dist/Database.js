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
exports.init = init;
exports.getAdapter = getAdapter;
exports.query = query;
exports.execute = execute;
exports.getConnection = getConnection;
exports.closePool = closePool;
const MySQLAdapter_1 = require("./adapters/MySQLAdapter");
const PostgresAdapter_1 = require("./adapters/PostgresAdapter");
let adapter;
function init(dbType, config) {
    if (dbType === 'mysql') {
        adapter = new MySQLAdapter_1.MySQLAdapter();
    }
    else if (dbType === 'postgres') {
        adapter = new PostgresAdapter_1.PostgresAdapter();
    }
    else {
        throw new Error(`Database type not supported: ${dbType}`);
    }
    adapter.init(config);
}
function getAdapter() {
    if (!adapter) {
        throw new Error("Database not initialized. Call init() first.");
    }
    return adapter;
}
function query(sql_1) {
    return __awaiter(this, arguments, void 0, function* (sql, params = [], connection) {
        return getAdapter().query(sql, params, connection);
    });
}
function execute(sql_1) {
    return __awaiter(this, arguments, void 0, function* (sql, params = [], connection) {
        return getAdapter().execute(sql, params, connection);
    });
}
function getConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        return getAdapter().getConnection();
    });
}
function closePool() {
    return __awaiter(this, void 0, void 0, function* () {
        return getAdapter().close();
    });
}
