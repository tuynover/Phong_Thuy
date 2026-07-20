const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Daily Rotate Transport for all logs (app-YYYY-MM-DD.log)
        const appRotateTransport = new winston.transports.DailyRotateFile({
            filename: path.join(this.logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
            level: 'info'
        });

        // Daily Rotate Transport for Warnings and Errors (errors-YYYY-MM-DD.log)
        const errorRotateTransport = new winston.transports.DailyRotateFile({
            filename: path.join(this.logDir, 'errors-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
            level: 'warn'
        });

        this.winstonLogger = winston.createLogger({
            format: winston.format.printf(({ message }) => message),
            transports: [appRotateTransport, errorRotateTransport]
        });
    }

    // Color helpers using standard ANSI escape codes
    colors = {
        reset: "\x1b[0m",
        dim: "\x1b[90m", // Bright black (gray) - always visible on light/dark terminals
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m"
    };

    getTimestamp() {
        const now = new Date();
        const svTime = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${svTime}.${ms}`;
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
        const winstonLevel = (level === 'ERROR' || level === 'WARN') ? level.toLowerCase() : 'info';
        this.winstonLogger.log({ level: winstonLevel, message: formattedMsg });
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

    debug(message, context = null) {
        if (process.env.NODE_ENV !== 'production') {
            const timestamp = this.getTimestamp();
            const contextStr = this.formatContext(context);
            const plainLog = `[${timestamp}] [DEBUG]${contextStr} ${message}`;
            const coloredLog = `${this.colors.dim}[${timestamp}]${this.colors.reset} ${this.colors.magenta}[DEBUG]${this.colors.reset}${this.colors.cyan}${contextStr}${this.colors.reset} ${message}`;

            console.log(coloredLog);
            this.writeToFiles('DEBUG', plainLog);
        }
    }
}

module.exports = new LoggerService();
