"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceException = void 0;
class PersistenceException extends Error {
    constructor(message, cause) {
        var _a, _b;
        super(message);
        this.cause = cause;
        if (cause) {
            // preserve stack if present
            this.stack = ((_a = this.stack) !== null && _a !== void 0 ? _a : "") + "\nCaused by: " + ((_b = cause.stack) !== null && _b !== void 0 ? _b : cause.message);
        }
        Object.setPrototypeOf(this, PersistenceException.prototype);
    }
}
exports.PersistenceException = PersistenceException;
