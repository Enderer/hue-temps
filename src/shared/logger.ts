import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface LoggingOptions {
  level: LogLevel;
  filePath: string;
  maxSize: string | number;
  maxFiles: string | number;
}

let rootLogger: winston.Logger | null = null;

export const defaultLogFilePath = (): string => {
  const appName = 'huetemps';
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Logs', appName, `${appName}.log`);
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Local', appName, 'logs', `${appName}.log`);
    default:
      return path.join(os.homedir(), '.cache', appName, `${appName}.log`);
  }
};

export const configureLogging = (options: LoggingOptions): void => {
  if (rootLogger) {
    throw new Error('Logging has already been configured');
  }

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

  rootLogger = winston.createLogger({
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
  let logger: winston.Logger | undefined;

  const log = (level: LogLevel, message: string): void => {
    if (rootLogger == null) {
      throw new Error('Logging has not been configured');
    }
    if (logger == null) {
      logger = rootLogger.child({ module: moduleName });
    }
    logger.log({ level, message, module: moduleName });
  };

  return {
    debug: (message: string) => log('debug', message),
    info: (message: string) => log('info', message),
    warn: (message: string) => log('warn', message),
    error: (message: string) => log('error', message),
  };
};

/** Test-only helper to inject a fake root logger without configureLogging */
export const __setRootLoggerForTests = (logger: winston.Logger | null): void => {
  rootLogger = logger;
};
