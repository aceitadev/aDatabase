import { ColumnAdapter } from "../ColumnAdapter";
export declare const columnMap: Map<Function, Map<string, any>>;
export type ColumnOptions = {
    name?: string;
    adapter?: new () => ColumnAdapter;
    unique?: boolean;
    limit?: number;
    type?: any;
    index?: boolean;
    decimal?: boolean | [number, number];
};
export declare function Column(options: ColumnOptions): (target: any, propertyKey: string) => void;
export declare function getColumnMeta(ctor: Function): Map<string, any> | undefined;
