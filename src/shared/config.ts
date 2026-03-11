import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { LoggingOptions, LogLevel } from './logger.js';

const ZONE_NAME_DEFAULT = 'Hue Temps';
const ENV_BRIDGE = 'HUETEMPS_BRIDGE';
const ENV_USER = 'HUETEMPS_USER';
const KEYSTORE_SERVICE = 'com.huetemps.cli';
const KEYSTORE_PROFILE = 'home';
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_LOG_MAX_SIZE = '10m';
const DEFAULT_LOG_MAX_FILES = '5';

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

/**
 * Loads the configuration from a YAML file, applying defaults and
 * resolving paths as needed.
 * @param configPath - Path to the YAML config file
 */
export const loadConfig = (configPath: string): HueTempsConfig => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  // Load and parse the config file
  const fileContents = fs.readFileSync(configPath, 'utf8');
  const parsed: RawConfig = YAML.parse(fileContents) ?? {};
  const configDir = path.dirname(path.resolve(configPath));

  // Resolve logging config
  const loggingConfig = parsed.logging ?? {};
  const file = loggingConfig.file ?? defaultLogFilePath();
  const filePath = path.isAbsolute(file) ? file : path.join(configDir, file);
  const level = (loggingConfig.level ?? DEFAULT_LOG_LEVEL) as LogLevel;
  const maxSize = loggingConfig.maxSize ?? DEFAULT_LOG_MAX_SIZE;
  const maxFiles = loggingConfig.maxFiles ?? DEFAULT_LOG_MAX_FILES;
  const logging = { level, filePath, maxSize, maxFiles };

  const config = {
    zoneName: parsed.zoneName ?? ZONE_NAME_DEFAULT,
    logging,
    envBridge: ENV_BRIDGE,
    envUser: ENV_USER,
    keystoreService: KEYSTORE_SERVICE,
    keystoreProfile: KEYSTORE_PROFILE,
  };

  return config;
};

/**
 * Determines the default log file path based on the operating system.
 */
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
