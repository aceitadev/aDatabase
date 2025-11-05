export declare const hasOneMap: Map<Function, Map<string, any>>;
export type HasOneOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};
export declare function HasOne(options: HasOneOptions): (target: any, propertyKey: string) => void;
export declare function getHasOneMeta(ctor: Function): Map<string, any> | undefined;
