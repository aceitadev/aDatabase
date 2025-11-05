import { QueryBuilder } from "./QueryBuilder";
import { GenericConnection } from "./adapters/IDatabaseAdapter";
type Constructor<T> = {
    new (...args: any[]): T;
};
export declare abstract class ActiveRecord {
    private static idFieldCache;
    private static getIdField;
    save<T extends ActiveRecord>(this: T, tx?: GenericConnection): Promise<T>;
    static find<T extends ActiveRecord>(this: Constructor<T>): QueryBuilder<T>;
    delete(this: ActiveRecord, tx?: GenericConnection): Promise<void>;
}
export {};
