import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import YAML from 'yaml';
import { LogLevel } from './logger.js';
import { defaultConfigPath, defaultLogPath, isAbsolutePath } from './os.js';

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

export interface ResolvedConfigPath {
  configPath: string;
  explicit: boolean;
}

/**
 * Resolve config path from CLI args.
 */
export const resolveConfigPath = (argv: string[]): ResolvedConfigPath => {
  const program = new Command();
  program.option('-c, --config <path>', 'Path to config file');
  program.allowUnknownOption(true);
  program.helpOption(false);
  program.parse(argv, { from: 'user' });
  const opts = program.opts();
  const defaultPath = defaultConfigPath(APP_ID, APP_DIR_WINDOWS, CONFIG_FILE_NAME);
  const explicit = normalizeString(opts.config);
  return {
    configPath: explicit ?? defaultPath,
    explicit: explicit != null,
  };
};

/**
 * Load the app configuration.
 * Looks for a YAML file, applies defaults, and resolves paths.
 * When required is true, throws if the config file does not exist.
 */
export const loadConfig = (configPath: string, required = false): HueTempsConfig => {
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
    if (required) {
      throw new Error(`Config file not found: ${configPath}`);
    }
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
 * Returns the default config file path for the current platform.
 */
export const getConfigPath = (): string => {
  return defaultConfigPath(APP_ID, APP_DIR_WINDOWS, CONFIG_FILE_NAME);
};

/**
 * Returns the default config file content with all values commented out.
 */
export const configTemplate = (): string => {
  const templatePath = path.join(__dirname, 'config.template.yaml');
  return fs.readFileSync(templatePath, 'utf8');
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
