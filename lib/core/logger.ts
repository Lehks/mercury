import winston from 'winston';

const format = winston.format.printf(({ level, message, timestamp }) => {
    return message
        .split(/[\n\r]+/)
        .map(msg => `${timestamp} ${level.toUpperCase().padEnd(5, ' ')} ${msg}`)
        .join('\n');
});

const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), format),
    transports: [new winston.transports.Console()]
});

export = logger;
