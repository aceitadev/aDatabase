import { IDatabaseAdapter, GenericConnection } from './IDatabaseAdapter';
export declare class MySQLAdapter implements IDatabaseAdapter {
    readonly type = "mysql";
    private pool;
    init(config: any): void;
    private getPool;
    query(sql: string, params: any[], connection?: GenericConnection): Promise<any[]>;
    execute(sql: string, params: any[], connection?: GenericConnection): Promise<{
        insertId?: number;
        affectedRows?: number;
    }>;
    getConnection(): Promise<GenericConnection>;
    close(): Promise<void>;
}
