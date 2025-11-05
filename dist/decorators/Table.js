"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = Table;
exports.getTableName = getTableName;
const tableMap = new Map();
function Table(name) {
    return function (constructor) {
        tableMap.set(constructor, name);
    };
}
function getTableName(target) {
    return tableMap.get(target);
}
