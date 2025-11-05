import mysql, { Pool } from 'mysql2/promise';
import { IDatabaseAdapter, GenericConnection } from './IDatabaseAdapter';

export class MySQLAdapter implements IDatabaseAdapter {
    public readonly type = 'mysql';
    private pool: Pool | null = null;

    init(config: any): void {
        if (this.pool) {
            console.warn("[aDatabase] MySQL connection pool already initialized.");
            return;
        }
        try {
            this.pool = mysql.createPool({
                ...config,
                waitForConnections: true,
                connectionLimit: config.connectionLimit ?? 10,
                queueLimit: 0,
            });
            console.log("[aDatabase] MySQL connection pool initialized.");
        } catch (error) {
            console.error("[aDatabase] MySQL connection pool initialization failed:", error);
            process.exit(1);
        }
    }

    private getPool(): Pool {
        if (!this.pool) {
            throw new Error("MySQL connection pool not initialized.");
        }
        return this.pool;
    }

    async query(sql: string, params: any[], connection?: GenericConnection): Promise<any[]> {
        const conn = connection ?? this.getPool();
        const [rows] = await conn.query(sql, params);
        return rows as any[];
    }

    async execute(sql: string, params: any[], connection?: GenericConnection): Promise<{ insertId?: number; affectedRows?: number }> {
        const conn = connection ?? this.getPool();
        const [result]: any = await conn.execute(sql, params);
        return {
            insertId: result.insertId,
            affectedRows: result.affectedRows
        };
    }

    async getConnection(): Promise<GenericConnection> {
        return this.getPool().getConnection();
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}