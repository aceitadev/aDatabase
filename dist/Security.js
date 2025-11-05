"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOperator = validateOperator;
exports.getAndValidateColumnName = getAndValidateColumnName;
exports.sanitizeIntValue = sanitizeIntValue;
exports.validateDirectionValue = validateDirectionValue;
const PersistenceException_1 = require("./PersistenceException");
const util_1 = require("./util");
const ALLOWED_OPERATORS = [
    '=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL', 'OR'
];
function validateOperator(operator) {
    if (!ALLOWED_OPERATORS.includes(operator.toUpperCase())) {
        throw new PersistenceException_1.PersistenceException(`Invalid operator used: ${operator}`, null);
    }
    return operator;
}
function getAndValidateColumnName(prop, meta, modelName) {
    if (!meta.has(prop)) {
        throw new PersistenceException_1.PersistenceException(`Property '${prop}' is not a mapped column on model '${modelName}'. It cannot be used in queries.`, null);
    }
    const opts = meta.get(prop);
    return (opts === null || opts === void 0 ? void 0 : opts.name) ? opts.name : (0, util_1.camelToSnake)(prop);
}
function sanitizeIntValue(value) {
    const intValue = parseInt(String(value), 10);
    if (isNaN(intValue) || intValue < 0) {
        throw new PersistenceException_1.PersistenceException(`Invalid value for LIMIT or OFFSET: ${value}`, null);
    }
    return intValue;
}
function validateDirectionValue(direction) {
    const upperDir = direction.toUpperCase();
    if (upperDir !== 'ASC' && upperDir !== 'DESC') {
        throw new PersistenceException_1.PersistenceException(`Invalid ORDER BY direction: ${direction}`, null);
    }
    return upperDir;
}
