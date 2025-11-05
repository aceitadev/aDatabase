"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = Id;
const Column_1 = require("./Column");
function Id() {
    return function (target, propertyKey) {
        const ctor = target.constructor;
        const cols = Column_1.columnMap.get(ctor) || new Map();
        cols.set(propertyKey, { id: true, propertyKey }); // Adiciona a propriedade com a flag 'id'
        Column_1.columnMap.set(ctor, cols);
    };
}
