import assert from 'node:assert/strict';
import { afterEach, describe, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockProgram = {
    parseAsync: vi.fn(async (_argv: string[], _opts: { from: string }) => {}),
  };

  const mockConfig = {
    zoneName: 'Hue Temps',
    logging: {
      level: 'info',
      filePath: '/tmp/huetemps.log',
      maxSize: '10m',
      maxFiles: '5',
    },
    envBridge: 'HUETEMPS_BRIDGE',
    envUser: 'HUETEMPS_USER',
    keystoreService: 'com.huetemps.cli',
    keystoreProfile: 'home',
  };

  return {
    mockProgram,
    mockConfig,
    mockLoadConfig: vi.fn((_configPath: string, _required?: boolean) => mockConfig),
    mockResolveConfigPath: vi.fn((_argv: string[]) => ({
      configPath: '/tmp/config.yaml',
      explicit: false,
    })),
    mockConfigureLogging: vi.fn(
      (
        _level: string,
        _filePath: string,
        _maxSize: string | number,
        _maxFiles: string | number,
      ) => {},
    ),
    mockCreateConnectionLoader: vi.fn((_config: unknown) => ({ id: 'loader' })),
    mockCreateApiClientProvider: vi.fn((_loader: unknown) => ({ id: 'provider' })),
    mockCreateStore: vi.fn((_provider: unknown) => ({ id: 'store' })),
    mockCommandsInit: vi.fn(() => mockProgram),
    mockListInit: vi.fn((_store: unknown, _program: unknown, _zoneName: string) => {}),
    mockAlertInit: vi.fn((_store: unknown, _program: unknown) => {}),
    mockConnectInit: vi.fn((_connectionLoader: unknown, _program: unknown) => {}),
    mockConfigInit: vi.fn((_program: unknown, _configPath: string, _config: unknown) => {}),
    mockLoggerInfo: vi.fn((_message: string) => {}),
    mockLoggerError: vi.fn((_message: string) => {}),
  };
});

vi.mock('../shared/config.js', () => ({
  loadConfig: mocks.mockLoadConfig,
  resolveConfigPath: mocks.mockResolveConfigPath,
}));

vi.mock('../shared/logger.js', () => ({
  configureLogging: mocks.mockConfigureLogging,
  createLogger: vi.fn(() => ({ info: mocks.mockLoggerInfo, error: mocks.mockLoggerError })),
}));

vi.mock('../shared/connection.js', () => ({
  createConnectionLoader: mocks.mockCreateConnectionLoader,
}));

vi.mock('../api/index.js', () => ({
  createApiClientProvider: mocks.mockCreateApiClientProvider,
  createStore: mocks.mockCreateStore,
}));

vi.mock('./commands/index.js', () => ({
  init: mocks.mockCommandsInit,
  list: { init: mocks.mockListInit },
  alert: { init: mocks.mockAlertInit },
  connect: { init: mocks.mockConnectInit },
  config: { init: mocks.mockConfigInit },
}));

import { main } from './index.js';

describe('cli main', () => {
  afterEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('continues bootstrapping with config returned by loadConfig', async () => {
    await main(['list']);

    assert.equal(mocks.mockResolveConfigPath.mock.calls.length, 1);
    assert.equal(mocks.mockLoadConfig.mock.calls.length, 1);
    assert.equal(mocks.mockLoadConfig.mock.calls[0][0], '/tmp/config.yaml');
    assert.equal(mocks.mockConfigureLogging.mock.calls.length, 1);
    assert.deepEqual(mocks.mockConfigureLogging.mock.calls[0], [
      'info',
      '/tmp/huetemps.log',
      '10m',
      '5',
    ]);
    assert.equal(mocks.mockCreateConnectionLoader.mock.calls.length, 1);
    assert.equal(mocks.mockCreateApiClientProvider.mock.calls.length, 1);
    assert.equal(mocks.mockCreateStore.mock.calls.length, 1);
    assert.equal(mocks.mockCommandsInit.mock.calls.length, 1);
    assert.equal(mocks.mockListInit.mock.calls.length, 1);
    assert.equal(mocks.mockAlertInit.mock.calls.length, 1);
    assert.equal(mocks.mockConnectInit.mock.calls.length, 1);
    assert.equal(mocks.mockConfigInit.mock.calls.length, 1);
    assert.equal(mocks.mockProgram.parseAsync.mock.calls.length, 1);
    assert.equal(process.exitCode, undefined);
  });
});
