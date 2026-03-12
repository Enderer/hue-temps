import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import YAML from 'yaml';
import { LogLevel } from './logger.js';
import { defaultConfigPath, defaultLogPath, isAbsolutePath } from './os.js';

const ZONE_NAME_DEFAULT = 'Hue Temps';
const ENV_BRIDGE = 'HUETEMPS_BRIDGE';
const ENV_USER = 'HUETEMPS_USER';
const KEYSTORE_SERVICE = 'com.huetemps.cli';
const KEYSTORE_PROFILE = 'home';
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_LOG_MAX_SIZE = '10m';
const DEFAULT_LOG_MAX_FILES = '5';
const APP_ID = 'huetemps';
const APP_DIR_WINDOWS = 'HueTemps';
const CONFIG_FILE_NAME = 'config.yaml';

export interface HueTempsConfig {
  zoneName: string;
  logging: {
    level: LogLevel;
    filePath: string;
    maxSize: string;
    maxFiles: string;
  };
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
    filePath?: string;
    maxSize?: string;
    maxFiles?: string;
  };
};

/**
 * Resolve config path from CLI args.
 */
export const resolveConfigPath = (argv: string[]): string => {
  const program = new Command();
  program.option('-c, --config <path>', 'Path to config file');
  program.allowUnknownOption(true);
  program.parse(argv, { from: 'user' });
  const opts = program.opts();
  const configPath = defaultConfigPath(APP_ID, APP_DIR_WINDOWS, CONFIG_FILE_NAME);
  return opts.config ? (normalizeString(opts.config) ?? configPath) : configPath;
};

/**
 * Load the app configuration.
 * Looks for a YAML file, applies defaults, and resolves paths.
 */
export const loadConfig = (configPath: string): HueTempsConfig => {
  // Create default config using app defaults
  const logFilePath = defaultLogPath(APP_ID, APP_DIR_WINDOWS);
  const defaultConfig: HueTempsConfig = {
    zoneName: ZONE_NAME_DEFAULT,
    logging: {
      level: DEFAULT_LOG_LEVEL,
      filePath: logFilePath,
      maxSize: DEFAULT_LOG_MAX_SIZE,
      maxFiles: DEFAULT_LOG_MAX_FILES,
    },
    envBridge: ENV_BRIDGE,
    envUser: ENV_USER,
    keystoreService: KEYSTORE_SERVICE,
    keystoreProfile: KEYSTORE_PROFILE,
  };

  // Look for a config file and apply overrides if found
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }
  const fileContents = fs.readFileSync(configPath, 'utf8');
  const raw = (YAML.parse(fileContents) ?? {}) as RawConfig;
  const configDir = path.dirname(path.resolve(configPath));
  const rawLogging = raw.logging;
  let logging = defaultConfig.logging;
  if (rawLogging) {
    const rawFilePath = normalizeString(rawLogging.file) ?? normalizeString(rawLogging.filePath);
    const filePath = rawFilePath
      ? isAbsolutePath(rawFilePath)
        ? rawFilePath
        : path.join(configDir, rawFilePath)
      : defaultConfig.logging.filePath;
    logging = {
      level: (normalizeString(rawLogging.level) as LogLevel) ?? defaultConfig.logging.level,
      filePath,
      maxSize: rawLogging.maxSize ?? defaultConfig.logging.maxSize,
      maxFiles: rawLogging.maxFiles ?? defaultConfig.logging.maxFiles,
    };
  }

  const zoneName = normalizeString(raw.zoneName) ?? defaultConfig.zoneName;
  return {
    ...defaultConfig,
    zoneName,
    logging,
  };
};

/**
 * Normalizes a string value to only return valid strings or undefined.
 */
const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
