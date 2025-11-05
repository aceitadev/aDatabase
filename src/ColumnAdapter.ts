export interface ColumnAdapter<T = any, R = any> {
    serialize(object: T): R;
    deserialize(object: R): T;
}

export class NoneAdapter implements ColumnAdapter<any, any> {
    serialize(): any {
        throw new Error("NoneAdapter should not be used.");
    }
    deserialize(): any {
        throw new Error("NoneAdapter should not be used.");
    }
}