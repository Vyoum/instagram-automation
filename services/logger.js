const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.logFile = path.join(this.logDir, 'app.log');
        this.memoryLogs = [];
        this.maxMemoryLogs = 100;

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    _write(level, message, meta = null) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
        fs.appendFileSync(this.logFile, logEntry + '\n');
        this.memoryLogs.unshift({ timestamp, level, message, meta });
        if (this.memoryLogs.length > this.maxMemoryLogs) {
            this.memoryLogs.pop();
        }
    }

    info(message, meta) {
        this._write('info', message, meta);
    }

    error(message, meta) {
        this._write('error', message, meta);
    }

    warn(message, meta) {
        this._write('warn', message, meta);
    }

    getLogs() {
        return this.memoryLogs;
    }
}

module.exports = new Logger();
