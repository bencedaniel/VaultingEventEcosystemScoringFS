import { createLogger, format, transports, addColors } from 'winston';

// Add custom colors for log levels
addColors({
  db: 'magenta',     // <-- magenta szín a db szinthez
  info: 'green',
  error: 'red',
  warn: 'yellow',
  userManagement: 'cyan bold',
  debug: 'blue'
});


export const logger = createLogger({
  levels: { db: 0, info: 1, error: 2, warn: 3, userManagement: 4, debug: 5 }, // egyedi szintek hozzáadása
  level: 'debug', // alapértelmezett szint: info
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
