import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingOptions {
  level: LogLevel;
  filePath: string;
  maxSize: string | number;
  maxFiles: string | number;
}

const rootLogger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ level: 'info' })],
});

export const configureLogging = (options: LoggingOptions): void => {
  const { level, filePath, maxSize, maxFiles } = options;

  const logDir = path.dirname(filePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, module }) => {
      const mod = module ? `[${module}]` : '';
      return `${timestamp} ${level.toUpperCase().padEnd(5)} ${mod} ${message}`;
    }),
  );

  rootLogger.configure({
    level,
    transports: [
      new DailyRotateFile({
        filename: filePath,
        datePattern: 'YYYY-MM-DD',
        maxSize,
        maxFiles,
        format: logFormat,
      }),
    ],
  });
};

export const createLogger = (moduleName: string): Logger => {
  const log = (level: LogLevel, message: string): void => {
    rootLogger.log(level, message, { module: moduleName });
  };

  return {
    debug: (message: string) => log('debug', message),
    info: (message: string) => log('info', message),
    warn: (message: string) => log('warn', message),
    error: (message: string) => log('error', message),
  };
};
