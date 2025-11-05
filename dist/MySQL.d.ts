import mysql, { PoolConnection } from "mysql2/promise";
export type Auth = {
    host: string;
    port?: number;
    database: string;
    user: string;
    password?: string;
};
export type PoolOptions = {
    connectionLimit?: number;
    queueLimit?: number;
    idleTimeout?: number;
    waitForConnections?: boolean;
};
export declare function init(auth: Auth, options?: PoolOptions): void;
export declare function getConnection(): Promise<PoolConnection>;
export declare function query(sql: string, params?: any[]): Promise<mysql.QueryResult>;
export declare function closePool(): Promise<void>;
