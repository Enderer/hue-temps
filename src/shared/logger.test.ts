import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import winston from 'winston';
import {
  __setRootLoggerForTests,
  configureLogging,
  createLogger,
  defaultLogFilePath,
} from './logger.js';

const withMockedPlatform = (platform: NodeJS.Platform, run: () => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', {
    value: platform,
  });

  try {
    run();
  } finally {
    if (descriptor) {
      Object.defineProperty(process, 'platform', descriptor);
    }
  }
};

describe('logger', () => {
  const createTempDir = () => {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'huetemps-logger-'));
  };

  afterEach(() => {
    vi.restoreAllMocks();
    __setRootLoggerForTests(null);
  });

  it('returns platform-specific default log file paths', () => {
    vi.spyOn(os, 'homedir').mockImplementation(() => '/mock-home');

    withMockedPlatform('darwin', () => {
      assert.equal(
        defaultLogFilePath(),
        path.join('/mock-home', 'Library', 'Logs', 'huetemps', 'huetemps.log'),
      );
    });

    withMockedPlatform('win32', () => {
      assert.equal(
        defaultLogFilePath(),
        path.join('/mock-home', 'AppData', 'Local', 'huetemps', 'logs', 'huetemps.log'),
      );
    });

    withMockedPlatform('linux', () => {
      assert.equal(
        defaultLogFilePath(),
        path.join('/mock-home', '.cache', 'huetemps', 'huetemps.log'),
      );
    });
  });

  it('throws when configureLogging is called more than once', () => {
    __setRootLoggerForTests({} as any);

    assert.throws(
      () =>
        configureLogging({
          level: 'info',
          filePath: path.join('logs', 'app.log'),
          maxSize: '10m',
          maxFiles: '5',
        }),
      /already been configured/,
    );
  });

  it('creates missing log directory and configures winston logger', () => {
    const tempRoot = createTempDir();
    const filePath = path.join(tempRoot, 'nested', 'app.log');
    const logDir = path.dirname(filePath);

    const createLoggerSpy = vi
      .spyOn(winston, 'createLogger')
      .mockImplementation(() => ({ child: vi.fn() }) as any);

    configureLogging({
      level: 'debug',
      filePath,
      maxSize: '20m',
      maxFiles: '10',
    });

    assert.equal(fs.existsSync(logDir), true);
    assert.equal(createLoggerSpy.mock.calls.length, 1);

    const [loggerOptions] = createLoggerSpy.mock.calls[0] as [Record<string, unknown>];
    assert.equal(loggerOptions.level, 'debug');
  });

  it('does not recreate directory when log directory already exists', () => {
    const tempRoot = createTempDir();
    const logDir = path.join(tempRoot, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const filePath = path.join(logDir, 'app.log');

    let mkdirCallsForLogDir = 0;
    const nativeMkdirSync = fs.mkdirSync;
    vi.spyOn(fs, 'mkdirSync').mockImplementation(
      (p: fs.PathLike, options?: fs.MakeDirectoryOptions) => {
        if (path.resolve(String(p)) === path.resolve(logDir)) {
          mkdirCallsForLogDir += 1;
        }
        return nativeMkdirSync(p, options as any);
      },
    );

    vi.spyOn(winston, 'createLogger').mockImplementation(() => ({ child: vi.fn() }) as any);

    configureLogging({
      level: 'info',
      filePath,
      maxSize: '10m',
      maxFiles: '5',
    });

    assert.equal(mkdirCallsForLogDir, 0);
  });

  it('formats log lines with and without module name', () => {
    const tempRoot = createTempDir();
    const logDir = path.join(tempRoot, 'logs');
    fs.mkdirSync(logDir, { recursive: true });

    let loggerOptions: Record<string, unknown> | undefined;

    vi.spyOn(winston, 'createLogger').mockImplementation((opts: Record<string, unknown>) => {
      loggerOptions = opts;
      return { child: vi.fn() } as any;
    });

    configureLogging({
      level: 'info',
      filePath: path.join(logDir, 'app.log'),
      maxSize: '10m',
      maxFiles: '5',
    });

    assert.ok(loggerOptions);
    const [transport] = loggerOptions!.transports as unknown[] as Array<Record<string, unknown>>;
    assert.ok(transport);
    const format = transport.format as {
      transform: (info: Record<string, unknown>) => Record<string, unknown>;
    };
    assert.ok(format);

    const withModule = format.transform({
      level: 'info',
      message: 'ok',
      module: 'api',
    });
    const withModuleMessage = (withModule as any)[Symbol.for('message')] as string;
    assert.ok(withModuleMessage.includes('INFO'));
    assert.ok(withModuleMessage.includes('[api] ok'));

    const withoutModule = format.transform({
      level: 'warn',
      message: 'oops',
    });
    const withoutModuleMessage = (withoutModule as any)[Symbol.for('message')] as string;
    assert.ok(withoutModuleMessage.includes('WARN'));
    assert.equal(withoutModuleMessage.includes('[api]'), false);
    assert.ok(withoutModuleMessage.endsWith(' oops'));
  });

  it('throws when creating a logger before logging is configured', () => {
    const logger = createLogger('api.client');
    assert.throws(() => logger.info('hello'), /has not been configured/);
  });

  it('creates one child logger per module logger and reuses it for all levels', () => {
    const child = { log: vi.fn() } as any;
    const root = { child: vi.fn(() => child) } as any;
    __setRootLoggerForTests(root);

    const logger = createLogger('api.client');
    logger.debug('first');
    logger.warn('middle');
    logger.error('second');

    assert.equal(root.child.mock.calls.length, 1);
    assert.deepEqual(root.child.mock.calls[0], [{ module: 'api.client' }]);

    assert.equal(child.log.mock.calls.length, 3);
    assert.deepEqual(child.log.mock.calls[0][0], {
      level: 'debug',
      message: 'first',
      module: 'api.client',
    });
    assert.deepEqual(child.log.mock.calls[1][0], {
      level: 'warn',
      message: 'middle',
      module: 'api.client',
    });
    assert.deepEqual(child.log.mock.calls[2][0], {
      level: 'error',
      message: 'second',
      module: 'api.client',
    });
  });
});
