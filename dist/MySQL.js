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
exports.init = init;
exports.getConnection = getConnection;
exports.query = query;
exports.closePool = closePool;
const promise_1 = __importDefault(require("mysql2/promise"));
let pool = null;
function init(auth, options = {}) {
    var _a, _b, _c, _d, _e;
    if (pool) {
        console.warn("[aMySQL] Pool de conexões já foi inicializado. Ignorando nova chamada.");
        return;
    }
    try {
        pool = promise_1.default.createPool({
            host: auth.host,
            port: (_a = auth.port) !== null && _a !== void 0 ? _a : 3306,
            database: auth.database,
            user: auth.user,
            password: auth.password,
            waitForConnections: (_b = options.waitForConnections) !== null && _b !== void 0 ? _b : true,
            connectionLimit: (_c = options.connectionLimit) !== null && _c !== void 0 ? _c : 10,
            queueLimit: (_d = options.queueLimit) !== null && _d !== void 0 ? _d : 0,
            idleTimeout: (_e = options.idleTimeout) !== null && _e !== void 0 ? _e : 60000,
            namedPlaceholders: false
        });
        console.log("[aMySQL] ✅ Pool de conexões inicializado com sucesso.");
    }
    catch (error) {
        console.error("[aMySQL] ❌ Falha catastrófica ao inicializar o pool de conexões:", error);
        process.exit(1);
    }
}
function getPool() {
    if (!pool) {
        throw new Error("[aMySQL] O pool de conexões não foi inicializado. Chame a função init() na inicialização da sua aplicação.");
    }
    return pool;
}
function getConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        return getPool().getConnection();
    });
}
function query(sql_1) {
    return __awaiter(this, arguments, void 0, function* (sql, params = []) {
        const [rows] = yield getPool().query(sql, params);
        return rows;
    });
}
function closePool() {
    return __awaiter(this, void 0, void 0, function* () {
        if (pool) {
            yield pool.end();
            pool = null;
            console.log("[aMySQL] Pool de conexões foi fechado com sucesso.");
        }
    });
}
