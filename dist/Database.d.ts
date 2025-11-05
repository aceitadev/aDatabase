import { IDatabaseAdapter, GenericConnection } from './adapters/IDatabaseAdapter';
type DbType = 'mysql' | 'postgres';
export declare function init(dbType: DbType, config: any): void;
export declare function getAdapter(): IDatabaseAdapter;
export declare function query(sql: string, params?: any[], connection?: GenericConnection): Promise<any[]>;
export declare function execute(sql: string, params?: any[], connection?: GenericConnection): Promise<{
    insertId?: number;
    affectedRows?: number;
}>;
export declare function getConnection(): Promise<GenericConnection>;
export declare function closePool(): Promise<void>;
export {};
