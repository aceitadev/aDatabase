export declare const hasManyMap: Map<Function, Map<string, any>>;
export type HasManyOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};
export declare function HasMany(options: HasManyOptions): (target: any, propertyKey: string) => void;
export declare function getHasManyMeta(ctor: Function): Map<string, any> | undefined;
