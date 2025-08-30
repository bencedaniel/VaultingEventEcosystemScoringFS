import { createLogger, format, transports, addColors } from 'winston';

// Add custom colors for log levels
addColors({
  db: 'magenta',     // <-- magenta szín a db szinthez
  info: 'blue',
  error: 'red',
  warn: 'yellow',
  debug: 'green'
});

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});

export const dblogger = createLogger({
  levels: { db: 0, info: 1, error: 2, warn: 3, debug: 4 }, // db szint hozzáadva
  level: 'db', // alapértelmezett szint: db
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message }) => {
      return `DBLOG: ${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});
