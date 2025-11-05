import { Pool } from 'pg';
import { IDatabaseAdapter, GenericConnection } from './IDatabaseAdapter';

export class PostgresAdapter implements IDatabaseAdapter {
    public readonly type = 'postgres';
    private pool: Pool | null = null;

    init(config: any): void {
        if (this.pool) {
            console.warn("[aDatabase] Connection pool already initialized.");
            return;
        }
        try {
            this.pool = new Pool({
                connectionString: config.url,
            });
            console.log("[aDatabase] PostgreSQL connection pool initialized.");
        } catch (error) {
            console.error("[aDatabase] PostgreSQL connection pool initialization failed:", error);
            process.exit(1);
        }
    }

    private getPool(): Pool {
        if (!this.pool) {
            throw new Error("PostgreSQL connection pool not initialized.");
        }
        return this.pool;
    }

    private formatSql(sql: string): string {
        let paramIndex = 1;
        return sql.replace(/\?/g, () => `$${paramIndex++}`);
    }

    private quoteIdentifiers(sql: string): string {
        return sql.replace(/`([^`]+)`/g, '"$1"');
    }

    async query(sql: string, params: any[], connection?: GenericConnection): Promise<any[]> {
        const conn = connection ?? this.getPool();
        const pgSql = this.quoteIdentifiers(this.formatSql(sql));
        const result = await conn.query(pgSql, params);
        return result.rows;
    }

    async execute(sql: string, params: any[], connection?: GenericConnection): Promise<{ insertId?: number; affectedRows?: number }> {
        const conn = connection ?? this.getPool();
        let pgSql = this.quoteIdentifiers(this.formatSql(sql));

        if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
            pgSql = pgSql.trim();
            if (pgSql.endsWith(';')) {
                pgSql = pgSql.slice(0, -1);
            }
            pgSql += ' RETURNING id';
        }

        const result = await conn.query(pgSql, params);
        return {
            insertId: result.rows[0]?.id,
            affectedRows: result.rowCount
        };
    }

    async getConnection(): Promise<GenericConnection> {
        return this.getPool().connect();
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}