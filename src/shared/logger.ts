export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type Logger = {
  level: LogLevel;
  debug: (...message: unknown[]) => void;
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
  error: (...message: unknown[]) => void;
};

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isLogLevel = (value: string): value is LogLevel =>
  ['debug', 'info', 'warn', 'error'].includes(value);

const normalizeLevel = (value?: string): LogLevel => {
  if (!value) {
    return 'info';
  }

  return isLogLevel(value.toLowerCase()) ? (value.toLowerCase() as LogLevel) : 'info';
};

const shouldLog = (current: LogLevel, target: LogLevel) =>
  levelPriority[target] >= levelPriority[current];

const format = (level: LogLevel, message: unknown[]) => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}]`, `[${level.toUpperCase()}]`, ...message];
};

export const createLogger = (level?: string): Logger => {
  const currentLevel = normalizeLevel(level ?? process.env.LOG_LEVEL);

  const logAt = (target: LogLevel, message: unknown[]) => {
    if (!shouldLog(currentLevel, target)) {
      return;
    }
    console[target === 'error' ? 'error' : 'log'](...format(target, message));
  };

  return {
    level: currentLevel,
    debug: (...message: unknown[]) => logAt('debug', message),
    info: (...message: unknown[]) => logAt('info', message),
    warn: (...message: unknown[]) => logAt('warn', message),
    error: (...message: unknown[]) => logAt('error', message),
  };
};
