export interface ColumnAdapter<T = any, R = any> {
    serialize(object: T): R;
    deserialize(object: R): T;
}
export declare class NoneAdapter implements ColumnAdapter<any, any> {
    serialize(): any;
    deserialize(): any;
}
