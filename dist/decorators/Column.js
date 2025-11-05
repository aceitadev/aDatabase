"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnMap = void 0;
exports.Column = Column;
exports.getColumnMeta = getColumnMeta;
exports.columnMap = new Map();
function Column(options) {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const cols = getColumnMeta(ctor) || new Map();
        cols.set(propertyKey, Object.assign(Object.assign({}, options), { propertyKey }));
        exports.columnMap.set(ctor, cols);
    };
}
function getColumnMeta(ctor) {
    return exports.columnMap.get(ctor);
}
