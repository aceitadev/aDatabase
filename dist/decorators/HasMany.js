"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasManyMap = void 0;
exports.HasMany = HasMany;
exports.getHasManyMeta = getHasManyMeta;
exports.hasManyMap = new Map();
function HasMany(options) {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const relations = exports.hasManyMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        exports.hasManyMap.set(ctor, relations);
    };
}
function getHasManyMeta(ctor) {
    return exports.hasManyMap.get(ctor);
}
