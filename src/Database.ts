import { IDatabaseAdapter, GenericConnection } from './adapters/IDatabaseAdapter';
import { MySQLAdapter } from './adapters/MySQLAdapter';
import { PostgresAdapter } from './adapters/PostgresAdapter';

let adapter: IDatabaseAdapter;

type DbType = 'mysql' | 'postgres';

export function init(dbType: DbType, config: any) {
    if (dbType === 'mysql') {
        adapter = new MySQLAdapter();
    } else if (dbType === 'postgres') {
        adapter = new PostgresAdapter();
    } else {
        throw new Error(`Database type not supported: ${dbType}`);
    }
    adapter.init(config);
}

export function getAdapter(): IDatabaseAdapter {
    if (!adapter) {
        throw new Error("Database not initialized. Call init() first.");
    }
    return adapter;
}

export async function query(sql: string, params: any[] = [], connection?: GenericConnection) {
    return getAdapter().query(sql, params, connection);
}

export async function execute(sql: string, params: any[] = [], connection?: GenericConnection) {
    return getAdapter().execute(sql, params, connection);
}

export async function getConnection(): Promise<GenericConnection> {
    return getAdapter().getConnection();
}

export async function closePool(): Promise<void> {
    return getAdapter().close();
}