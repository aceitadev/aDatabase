export declare class Logger {
    private static readonly PREFIX;
    static log(message: string, level?: 'info' | 'warn' | 'error'): void;
    static schemaLog(message: string, details?: {
        table?: string;
        column?: string;
        status?: string;
    }): void;
}
