import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import YAML from 'yaml';
import { loadConfig, resolveConfigPath } from './config.js';
import { defaultConfigPath, defaultLogPath } from './os.js';

// Helper to create a default config object (mimics config.ts logic)
const createDefaultConfig = () => {
  const APP_ID = 'huetemps';
  const APP_DIR_WINDOWS = 'HueTemps';
  return {
    zoneName: 'Hue Temps',
    logging: {
      level: 'info',
      filePath: defaultLogPath(APP_ID, APP_DIR_WINDOWS),
      maxSize: '10m',
      maxFiles: '5',
    },
    envBridge: 'HUETEMPS_BRIDGE',
    envUser: 'HUETEMPS_USER',
    keystoreService: 'com.huetemps.cli',
    keystoreProfile: 'home',
  };
};

const defaultConfigFilePath = () => {
  return defaultConfigPath('huetemps', 'HueTemps', 'config.yaml');
};

const defaultLogFilePath = () => {
  return defaultLogPath('huetemps', 'HueTemps');
};

describe('loadConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses defaults when file is missing', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation(() => false);
    const readSpy = vi.spyOn(fs, 'readFileSync');
    const parseSpy = vi.spyOn(YAML, 'parse');

    const result = loadConfig('missing.yml');

    assert.equal(result.zoneName, 'Hue Temps');
    assert.equal(result.logging.level, 'info');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(readSpy.mock.calls.length, 0);
    assert.equal(parseSpy.mock.calls.length, 0);
    assert.equal(existsSpy.mock.calls.length, 1);
  });

  it('reads yaml and returns config with zone name', () => {
    const configPath = 'config.yml';
    const parsed = { zoneName: 'living-room' };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: fs.PathOrFileDescriptor, options: unknown) => {
        assert.equal(filePath, configPath);
        assert.equal(options, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.zoneName, 'living-room');
    assert.equal(result.logging.level, 'info');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });

  it('falls back to default zoneName when YAML.parse yields null', () => {
    const configPath = 'config.yml';

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: fs.PathOrFileDescriptor, options: unknown) => {
        assert.equal(filePath, configPath);
        assert.equal(options, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => null);

    const result = loadConfig(configPath);

    assert.equal(result.zoneName, 'Hue Temps');
    assert.equal(result.logging.level, 'info');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });

  it('uses absolute logging.file path as-is', () => {
    const configPath = 'config.yml';
    const absoluteLogFile = path.resolve('logs', 'huetemps.log');
    const parsed = {
      zoneName: 'living-room',
      logging: { file: absoluteLogFile },
    };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: fs.PathOrFileDescriptor, options: unknown) => {
        assert.equal(filePath, configPath);
        assert.equal(options, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.logging.filePath, absoluteLogFile);
    assert.equal(result.logging.level, 'info');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });

  it('resolves relative logging.file path from the config directory', () => {
    const configPath = path.join('project', 'config.yml');
    const relativeLogFile = path.join('logs', 'huetemps.log');
    const parsed = {
      zoneName: 'living-room',
      logging: { file: relativeLogFile },
    };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: fs.PathOrFileDescriptor, options: unknown) => {
        assert.equal(filePath, configPath);
        assert.equal(options, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    const expectedFilePath = path.join(path.resolve('project'), relativeLogFile);
    assert.equal(result.logging.filePath, expectedFilePath);
    assert.equal(result.logging.level, 'info');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });

  it('merges partial logging values over defaults', () => {
    const configPath = 'config.yml';
    const parsed = {
      logging: { maxFiles: '10' },
    };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(
      (_filePath: fs.PathOrFileDescriptor, _options: unknown) => 'yaml-content',
    );
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.logging.level, 'info');
    assert.equal(result.logging.maxSize, '10m');
    assert.equal(result.logging.maxFiles, '10');
    assert.equal(result.logging.filePath, defaultLogFilePath());
    assert.equal(typeof result.logging.maxFiles, 'string');
  });

  it('accepts filePath key as an alternative to file', () => {
    const configPath = 'config.yml';
    const absoluteLogFile = path.resolve('logs', 'huetemps.log');
    const parsed = {
      logging: { filePath: absoluteLogFile },
    };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => 'yaml-content');
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.logging.filePath, absoluteLogFile);
  });

  it('prefers file over filePath when both are present', () => {
    const configPath = 'config.yml';
    const fileValue = path.resolve('from-file', 'app.log');
    const filePathValue = path.resolve('from-filePath', 'app.log');
    const parsed = {
      logging: { file: fileValue, filePath: filePathValue },
    };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => 'yaml-content');
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.logging.filePath, fileValue);
  });

  it('falls back to default zoneName when value is whitespace-only', () => {
    const parsed = { zoneName: '   ' };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => 'yaml-content');
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig('config.yml');

    assert.equal(result.zoneName, 'Hue Temps');
  });

  it('falls back to default log path when logging.file is whitespace-only', () => {
    const parsed = { logging: { file: '   ' } };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => 'yaml-content');
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig('config.yml');

    assert.equal(result.logging.filePath, defaultLogFilePath());
  });

  it('uses default log path when logging block has no file keys', () => {
    const parsed = { logging: { level: 'debug' } };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => 'yaml-content');
    vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig('config.yml');

    assert.equal(result.logging.level, 'debug');
    assert.equal(result.logging.filePath, defaultLogFilePath());
  });
});

describe('defaultLogFilePath', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns macOS log path when platform is darwin', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/Users/stephen');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');

    const result = defaultLogFilePath();

    assert.equal(
      result,
      path.join('/Users/stephen', 'Library', 'Logs', 'huetemps', 'huetemps.log'),
    );
  });

  it('returns state log path for non-darwin and non-win32 platforms', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/home/stephen');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');

    const result = defaultLogFilePath();

    assert.equal(
      result,
      path.join('/home/stephen', '.local', 'state', 'huetemps', 'logs', 'huetemps.log'),
    );
  });

  it('returns win32 log path using LOCALAPPDATA', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    vi.stubEnv('LOCALAPPDATA', 'C:\\Users\\stephen\\AppData\\Local');

    const result = defaultLogFilePath();

    assert.equal(
      result,
      path.join('C:\\Users\\stephen\\AppData\\Local', 'HueTemps', 'logs', 'huetemps.log'),
    );
  });

  it('falls back to homedir AppData\\Local when LOCALAPPDATA is unset on win32', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    vi.spyOn(os, 'homedir').mockReturnValue('C:\\Users\\stephen');
    delete process.env.LOCALAPPDATA;

    const result = defaultLogFilePath();

    assert.equal(
      result,
      path.join('C:\\Users\\stephen', 'AppData', 'Local', 'HueTemps', 'logs', 'huetemps.log'),
    );
  });
});

describe('defaultConfigFilePath', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns windows AppData config path on win32', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    vi.stubEnv('APPDATA', 'C:\\Users\\stephen\\AppData\\Roaming');

    const result = defaultConfigFilePath();

    assert.equal(
      result,
      path.join('C:\\Users\\stephen\\AppData\\Roaming', 'HueTemps', 'config.yaml'),
    );
  });

  it('falls back to homedir AppData\\Roaming when APPDATA is unset on win32', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    vi.spyOn(os, 'homedir').mockReturnValue('C:\\Users\\stephen');
    delete process.env.APPDATA;

    const result = defaultConfigFilePath();

    assert.equal(
      result,
      path.join('C:\\Users\\stephen', 'AppData', 'Roaming', 'HueTemps', 'config.yaml'),
    );
  });

  it('returns xdg config path on linux', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    vi.spyOn(os, 'homedir').mockReturnValue('/home/stephen');
    vi.stubEnv('XDG_CONFIG_HOME', '/tmp/xdg-config');

    const result = defaultConfigFilePath();

    assert.equal(result, path.join('/tmp/xdg-config', 'huetemps', 'config.yaml'));
  });

  it('returns macOS Application Support config path on darwin', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    vi.spyOn(os, 'homedir').mockReturnValue('/Users/stephen');

    const result = defaultConfigFilePath();

    assert.equal(
      result,
      path.join('/Users/stephen', 'Library', 'Application Support', 'huetemps', 'config.yaml'),
    );
  });

  it('falls back to ~/.config when XDG_CONFIG_HOME is unset on linux', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    vi.spyOn(os, 'homedir').mockReturnValue('/home/stephen');
    vi.stubEnv('XDG_CONFIG_HOME', '');

    const result = defaultConfigFilePath();

    assert.equal(
      result,
      path.join('/home/stephen', '.config', 'huetemps', 'config.yaml'),
    );
  });
});

describe('resolveConfigPath', () => {
  it('uses --config flag when provided', () => {
    const result = resolveConfigPath(['list', '--config', '/tmp/custom.yaml']);
    assert.equal(result, '/tmp/custom.yaml');
  });

  it('uses -c short flag when provided', () => {
    const result = resolveConfigPath(['list', '-c', '/tmp/custom.yaml']);
    assert.equal(result, '/tmp/custom.yaml');
  });

  it('uses --config=value form when provided', () => {
    const result = resolveConfigPath(['--config=/tmp/custom.yaml']);
    assert.equal(result, '/tmp/custom.yaml');
  });

  it('falls back to default config path when no flag is provided', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    vi.spyOn(os, 'homedir').mockReturnValue('/home/stephen');
    vi.stubEnv('XDG_CONFIG_HOME', '/tmp/xdg-config');

    const result = resolveConfigPath(['list']);

    assert.equal(result, path.join('/tmp/xdg-config', 'huetemps', 'config.yaml'));
  });

  it('falls back to default config path when --config value is whitespace-only', () => {
    const result = resolveConfigPath(['--config', '   ']);

    assert.equal(result, defaultConfigFilePath());
  });

  it('returns default config path for empty argv', () => {
    const result = resolveConfigPath([]);

    assert.equal(result, defaultConfigFilePath());
  });
});

describe('createDefaultConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default runtime config values', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/home/stephen');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');

    const result = createDefaultConfig();

    assert.equal(result.zoneName, 'Hue Temps');
    assert.equal(result.envBridge, 'HUETEMPS_BRIDGE');
    assert.equal(result.envUser, 'HUETEMPS_USER');
    assert.equal(result.keystoreService, 'com.huetemps.cli');
    assert.equal(result.keystoreProfile, 'home');
    assert.equal(result.logging.level, 'info');
    assert.equal(result.logging.maxSize, '10m');
    assert.equal(typeof result.logging.maxFiles, 'string');
    assert.equal(
      result.logging.filePath,
      path.join('/home/stephen', '.local', 'state', 'huetemps', 'logs', 'huetemps.log'),
    );
  });
});
