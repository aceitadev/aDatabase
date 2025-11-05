export class PersistenceException extends Error {
    constructor(message: string, public cause?: Error | null) {
        super(message);
        if (cause) {
            // preserve stack if present
            this.stack = (this.stack ?? "") + "\nCaused by: " + (cause.stack ?? cause.message);
        }
        Object.setPrototypeOf(this, PersistenceException.prototype);
    }
}