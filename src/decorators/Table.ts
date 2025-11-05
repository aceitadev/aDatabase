const tableMap = new Map<Function, string>();

export function Table(name: string) {
    return function (constructor: Function) {
        tableMap.set(constructor, name);
    };
}

export function getTableName(target: Function): string | undefined {
    return tableMap.get(target);
}