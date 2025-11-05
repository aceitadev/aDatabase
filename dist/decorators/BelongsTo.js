"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.belongsToMap = void 0;
exports.BelongsTo = BelongsTo;
exports.getBelongsToMeta = getBelongsToMeta;
exports.belongsToMap = new Map();
function BelongsTo(options) {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const relations = exports.belongsToMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        exports.belongsToMap.set(ctor, relations);
    };
}
function getBelongsToMeta(ctor) {
    return exports.belongsToMap.get(ctor);
}
