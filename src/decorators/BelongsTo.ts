export const belongsToMap = new Map<Function, Map<string, any>>();

export type BelongsToOptions = {
    model: () => new (...args: any[]) => any;
    foreignKey: string;
};

export function BelongsTo(options: BelongsToOptions) {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const relations = belongsToMap.get(ctor) || new Map();
        relations.set(propertyKey, options);
        belongsToMap.set(ctor, relations);
    };
}

export function getBelongsToMeta(ctor: Function): Map<string, any> | undefined {
    return belongsToMap.get(ctor);
}