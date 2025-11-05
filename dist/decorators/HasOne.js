"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOneMap = void 0;
exports.HasOne = HasOne;
exports.getHasOneMeta = getHasOneMeta;
exports.hasOneMap = new Map();
function HasOne(options) {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const relations = exports.hasOneMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        exports.hasOneMap.set(ctor, relations);
    };
}
function getHasOneMeta(ctor) {
    return exports.hasOneMap.get(ctor);
}
