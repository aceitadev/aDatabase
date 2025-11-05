export declare class PersistenceException extends Error {
    cause?: (Error | null) | undefined;
    constructor(message: string, cause?: (Error | null) | undefined);
}
