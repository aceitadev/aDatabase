"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nullable = Nullable;
exports.getNullableMeta = getNullableMeta;
const nullableMap = new Map();
function Nullable(value = true) {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const nulls = getNullableMeta(ctor) || new Map();
        nulls.set(propertyKey, value);
        nullableMap.set(ctor, nulls);
    };
}
function getNullableMeta(ctor) {
    return nullableMap.get(ctor);
}
