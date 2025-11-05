"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        let formattedMessage = `${Logger.PREFIX} ${message}`;
        switch (level) {
            case 'warn':
                console.warn(`[33m${formattedMessage}[0m`); // Yellow
                break;
            case 'error':
                console.error(`[31m${formattedMessage}[0m`); // Red
                break;
            case 'info':
            default:
                console.log(`[36m${formattedMessage}[0m`); // Cyan
                break;
        }
    }
    static schemaLog(message, details) {
        const PREFIX = `[32m[aDatabase][0m`;
        if (details && details.table && !details.column) {
            if (details.status === 'started') {
                process.stdout.write(`${PREFIX} Synchronizing table '${details.table}'...`);
            }
            else if (details.status === 'created') {
                process.stdout.write(` Done.
`);
            }
        }
        else if (details && details.table && details.column) {
            if (details.status === 'added') {
                console.log(`
${PREFIX} Column '${details.column}' added to table '${details.table}'.`);
            }
        }
        else {
            console.log(`${PREFIX} ${message}`);
        }
    }
}
exports.Logger = Logger;
Logger.PREFIX = "[aDatabase]";
