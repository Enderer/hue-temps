import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { createLogger, defaultLogFilePath, LoggingOptions, LogLevel } from './logger.js';

const logger = createLogger('config');

const ZONE_NAME_DEFAULT = 'Hue Temps';
const ENV_BRIDGE = 'HUETEMPS_BRIDGE';
const ENV_USER = 'HUETEMPS_USER';
const KEYSTORE_SERVICE = 'com.huetemps.cli';
const KEYSTORE_PROFILE = 'home';

export interface HueTempsConfig {
  zoneName: string;
  logging: Required<LoggingOptions>;
  envBridge: string;
  envUser: string;
  keystoreService: string;
  keystoreProfile: string;
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

const resolveLoggingConfig = (
  logging: RawConfig['logging'],
  configDir: string,
): Required<LoggingOptions> => {
  const file = logging?.file ?? defaultLogFilePath();
  const filePath = path.isAbsolute(file) ? file : path.join(configDir, file);
  return {
    level: (logging?.level ?? 'info') as LogLevel,
    filePath,
    maxSize: logging?.maxSize ?? '10m',
    maxFiles: logging?.maxFiles ?? '5',
  };
};

export const loadConfig = (configPath: string): HueTempsConfig => {
  logger.info(`loadConfig - start ${configPath}`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const parsed: RawConfig = YAML.parse(fileContents) ?? {};
  const configDir = path.dirname(path.resolve(configPath));
  const config = {
    zoneName: parsed.zoneName ?? ZONE_NAME_DEFAULT,
    logging: resolveLoggingConfig(parsed.logging, configDir),
    envBridge: ENV_BRIDGE,
    envUser: ENV_USER,
    keystoreService: KEYSTORE_SERVICE,
    keystoreProfile: KEYSTORE_PROFILE,
  };

  logger.debug(`loadConfig - complete`);
  return config;
};
