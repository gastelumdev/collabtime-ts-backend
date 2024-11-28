import winston from 'winston';
const { combine, timestamp, json, printf, colorize, align } = winston.format;

class Logger {
    fileLogger: winston.Logger;
    consoleLogger: winston.Logger;
    constructor() {
        this.fileLogger = winston.createLogger({
            level: 'info',
            format: combine(timestamp(), json()),
            transports: [new winston.transports.File({ filename: 'combined.log' })]
        })

        this.consoleLogger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: combine(
                colorize({ all: true }),
                timestamp({
                    format: 'YYYY-MM-DD hh:mm:ss.SSS A',
                }),
                align(),
                printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
            ),
            transports: [new winston.transports.Console()],
        })
    }

    info(message: string) {
        // this.fileLogger.info(message);
        this.consoleLogger.info(message);
    }

    error(message: string) {
        // this.fileLogger.error(message);
        this.consoleLogger.error(message);
    }
}

export default Logger;