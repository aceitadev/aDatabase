import { ColumnAdapter } from "../ColumnAdapter";

export const columnMap = new Map<Function, Map<string, any>>();

export type ColumnOptions = {
    name?: string;
    adapter?: new () => ColumnAdapter;
    unique?: boolean;
    limit?: number;
    type?: any;
    index?: boolean;
    decimal?: boolean | [number, number];
};

export function Column(options: ColumnOptions) {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const cols = getColumnMeta(ctor) || new Map();
        cols.set(propertyKey, { ...options, propertyKey });
        columnMap.set(ctor, cols);
    };
}

export function getColumnMeta(ctor: Function): Map<string, any> | undefined {
    return columnMap.get(ctor);
}