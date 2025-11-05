import { PersistenceException } from "./PersistenceException";
import { camelToSnake } from "./util";

const ALLOWED_OPERATORS = [
    '=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL', 'OR'
];

export function validateOperator(operator: string): string {
    if (!ALLOWED_OPERATORS.includes(operator.toUpperCase())) {
        throw new PersistenceException(`Invalid operator used: ${operator}`, null);
    }
    return operator;
}

export function getAndValidateColumnName(prop: string, meta: Map<string, any>, modelName: string): string {
    if (!meta.has(prop)) {
        throw new PersistenceException(`Property '${prop}' is not a mapped column on model '${modelName}'. It cannot be used in queries.`, null);
    }
    const opts = meta.get(prop);
    return opts?.name ? opts.name : camelToSnake(prop);
}

export function sanitizeIntValue(value: any): number {
    const intValue = parseInt(String(value), 10);
    if (isNaN(intValue) || intValue < 0) {
        throw new PersistenceException(`Invalid value for LIMIT or OFFSET: ${value}`, null);
    }
    return intValue;
}

export function validateDirectionValue(direction: string): 'ASC' | 'DESC' {
    const upperDir = direction.toUpperCase();
    if (upperDir !== 'ASC' && upperDir !== 'DESC') {
        throw new PersistenceException(`Invalid ORDER BY direction: ${direction}`, null);
    }
    return upperDir as 'ASC' | 'DESC';
}
