import { ActiveRecord } from "./ActiveRecord";
export declare class QueryBuilder<T extends ActiveRecord> {
    private model;
    private whereClauses;
    private _limit?;
    private _offset?;
    private _orderBy?;
    private _includes;
    private primaryKey;
    constructor(model: {
        new (): T;
    });
    where(field: keyof T | string, operator: string, value: any): this;
    include(...models: (new (...args: any[]) => any)[]): this;
    orderBy(column: keyof T | string, direction?: 'asc' | 'desc'): this;
    limit(count: number): this;
    offset(count: number): this;
    first(): Promise<T | null>;
    count(): Promise<number>;
    get(): Promise<T[]>;
    private getColumnName;
    private mapRowsToEntities;
}
