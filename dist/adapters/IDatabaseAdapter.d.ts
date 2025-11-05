export type GenericConnection = any;
export interface IDatabaseAdapter {
    type: 'mysql' | 'postgres';
    init(config: any): void;
    query(sql: string, params: any[], connection?: GenericConnection): Promise<any[]>;
    execute(sql: string, params: any[], connection?: GenericConnection): Promise<{
        insertId?: number;
        affectedRows?: number;
    }>;
    getConnection(): Promise<GenericConnection>;
    close(): Promise<void>;
}
