const nullableMap = new Map<Function, Map<string, boolean>>();

export function Nullable(value: boolean = true) {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const nulls = getNullableMeta(ctor) || new Map();
        nulls.set(propertyKey, value);
        nullableMap.set(ctor, nulls);
    };
}

export function getNullableMeta(ctor: Function): Map<string, boolean> | undefined {
    return nullableMap.get(ctor);
}