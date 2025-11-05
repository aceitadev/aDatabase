export declare const belongsToMap: Map<Function, Map<string, any>>;
export type BelongsToOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};
export declare function BelongsTo(options: BelongsToOptions): (target: any, propertyKey: string) => void;
export declare function getBelongsToMeta(ctor: Function): Map<string, any> | undefined;
