const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.appLogPath = path.join(this.logDir, 'app.log');
        this.errorsLogPath = path.join(this.logDir, 'errors.log');
        
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    // Color helpers using standard ANSI escape codes
    colors = {
        reset: "\x1b[0m",
        dim: "\x1b[2m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m"
    };

    getTimestamp() {
        return new Date().toISOString();
    }

    formatContext(context) {
        if (!context) return "";
        let userStr = "";
        let actionStr = "";
        let extraStr = "";

        if (context.user) {
            userStr = ` [User: ${context.user}]`;
        }
        if (context.action) {
            actionStr = ` [Action: ${context.action}]`;
        }
        if (context.ip) {
            extraStr += ` [IP: ${context.ip}]`;
        }
        if (context.duration) {
            extraStr += ` [Duration: ${context.duration}ms]`;
        }

        return `${userStr}${actionStr}${extraStr}`;
    }

    writeToFiles(level, formattedMsg) {
        const fileLine = `${formattedMsg}\n`;
        
        // Write to all-purpose app.log
        fs.appendFile(this.appLogPath, fileLine, (err) => {
            if (err) console.error("Failed to write to app.log:", err.message);
        });

        // Write to errors.log if it is a warning or error
        if (level === 'ERROR' || level === 'WARN') {
            fs.appendFile(this.errorsLogPath, fileLine, (err) => {
                if (err) console.error("Failed to write to errors.log:", err.message);
            });
        }
    }

    info(message, context = null) {
        const timestamp = this.getTimestamp();
        const contextStr = this.formatContext(context);
        const plainLog = `[${timestamp}] [INFO]${contextStr} ${message}`;
        const coloredLog = `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.green}[INFO]${this.colors.reset}${this.colors.cyan}${contextStr}${this.colors.reset} ${message}`;

        console.log(coloredLog);
        this.writeToFiles('INFO', plainLog);
    }

    warn(message, context = null) {
        const timestamp = this.getTimestamp();
        const contextStr = this.formatContext(context);
        const plainLog = `[${timestamp}] [WARN]${contextStr} ${message}`;
        const coloredLog = `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.yellow}[WARN]${this.colors.reset}${this.colors.cyan}${contextStr}${this.colors.reset} ${this.colors.yellow}${message}${this.colors.reset}`;

        console.warn(coloredLog);
        this.writeToFiles('WARN', plainLog);
    }

    error(message, error = null, context = null) {
        const timestamp = this.getTimestamp();
        const contextStr = this.formatContext(context);
        let errorDetails = "";
        
        if (error) {
            errorDetails = error.stack ? `\nStack: ${error.stack}` : ` | Error: ${error.message || error}`;
        }

        const plainLog = `[${timestamp}] [ERROR]${contextStr} ${message}${errorDetails}`;
        const coloredLog = `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.red}[ERROR]${this.colors.reset}${this.colors.cyan}${contextStr}${this.colors.reset} ${this.colors.red}${message}${this.colors.reset}${errorDetails ? '\n' + this.colors.dim + errorDetails + this.colors.reset : ''}`;

        console.error(coloredLog);
        this.writeToFiles('ERROR', plainLog);
    }
}

module.exports = new LoggerService();
