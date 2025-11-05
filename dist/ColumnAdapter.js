"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoneAdapter = void 0;
class NoneAdapter {
    serialize() {
        throw new Error("NoneAdapter should not be used.");
    }
    deserialize() {
        throw new Error("NoneAdapter should not be used.");
    }
}
exports.NoneAdapter = NoneAdapter;
