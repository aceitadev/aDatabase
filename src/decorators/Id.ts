import { columnMap } from "./Column";

export function Id() {
    return function (target: any, propertyKey: string) {
        const ctor = target.constructor;
        const cols = columnMap.get(ctor) || new Map();
        cols.set(propertyKey, { id: true, propertyKey }); // Adiciona a propriedade com a flag 'id'
        columnMap.set(ctor, cols);
    };
}
