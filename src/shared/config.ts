import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { defaultLogFilePath, LoggingOptions, LogLevel } from './logger.js';

export interface HueTempsConfig {
  zoneName?: string;
  logging: Required<LoggingOptions>;
}

type RawConfig = {
  zoneName?: string;
  logging?: {
    level?: LogLevel | string;
    file?: string;
    maxSize?: string | number;
    maxFiles?: string | number;
    console?: boolean;
  };
};

const resolveLogLevel = (value?: LogLevel | string): LogLevel => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : value;
  if (
    normalized === 'debug' ||
    normalized === 'info' ||
    normalized === 'warn' ||
    normalized === 'error'
  ) {
    return normalized;
  }
  return 'info';
};

const resolveLoggingConfig = (
  logging: RawConfig['logging'],
  configDir: string,
): Required<LoggingOptions> => {
  const file = logging?.file ?? defaultLogFilePath();
  const filePath = path.isAbsolute(file) ? file : path.join(configDir, file);
  return {
    level: resolveLogLevel(logging?.level),
    filePath,
    maxSize: logging?.maxSize ?? '10m',
    maxFiles: logging?.maxFiles ?? '5',
  };
};

export const loadConfig = (configPath: string): HueTempsConfig => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const parsed: RawConfig = YAML.parse(fileContents) ?? {};
  const configDir = path.dirname(path.resolve(configPath));

  return {
    zoneName: parsed.zoneName,
    logging: resolveLoggingConfig(parsed.logging, configDir),
  };
};
