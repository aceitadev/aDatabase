export const hasManyMap = new Map<Function, Map<string, any>>();

export type HasManyOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};

export function HasMany(options: HasManyOptions) {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const relations = hasManyMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        hasManyMap.set(ctor, relations);
    };
}

export function getHasManyMeta(ctor: Function): Map<string, any> | undefined {
    return hasManyMap.get(ctor);
}