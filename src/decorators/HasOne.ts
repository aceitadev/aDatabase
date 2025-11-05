export const hasOneMap = new Map<Function, Map<string, any>>();

export type HasOneOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};

export function HasOne(options: HasOneOptions) {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const relations = hasOneMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        hasOneMap.set(ctor, relations);
    };
}

export function getHasOneMeta(ctor: Function): Map<string, any> | undefined {
    return hasOneMap.get(ctor);
}