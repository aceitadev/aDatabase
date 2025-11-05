import { IDatabaseAdapter, GenericConnection } from './IDatabaseAdapter';
export declare class PostgresAdapter implements IDatabaseAdapter {
    readonly type = "postgres";
    private pool;
    init(config: any): void;
    private getPool;
    private formatSql;
    private quoteIdentifiers;
    query(sql: string, params: any[], connection?: GenericConnection): Promise<any[]>;
    execute(sql: string, params: any[], connection?: GenericConnection): Promise<{
        insertId?: number;
        affectedRows?: number;
    }>;
    getConnection(): Promise<GenericConnection>;
    close(): Promise<void>;
}
