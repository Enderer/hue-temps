import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import winston from 'winston';
import { configureLogging, createLogger } from './logger.js';

describe('logger', () => {
  const createTempDir = () => {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'huetemps-logger-'));
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows configureLogging to be called more than once', () => {
    const tempRoot = createTempDir();

    configureLogging({
      level: 'info',
      filePath: path.join(tempRoot, 'one.log'),
      maxSize: '10m',
      maxFiles: '5',
    });

    configureLogging({
      level: 'debug',
      filePath: path.join(tempRoot, 'two.log'),
      maxSize: '20m',
      maxFiles: '10',
    });

    const logger = createLogger('logger.test');
    assert.doesNotThrow(() => logger.info('configured twice'));
  });

  it('creates missing log directory', () => {
    const tempRoot = createTempDir();
    const filePath = path.join(tempRoot, 'nested', 'app.log');
    const logDir = path.dirname(filePath);

    configureLogging({
      level: 'debug',
      filePath,
      maxSize: '20m',
      maxFiles: '10',
    });

    assert.equal(fs.existsSync(logDir), true);
  });

  it('does not recreate directory when log directory already exists', () => {
    const tempRoot = createTempDir();
    const logDir = path.join(tempRoot, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const filePath = path.join(logDir, 'app.log');

    let mkdirCallsForLogDir = 0;
    const nativeMkdirSync = fs.mkdirSync;
    vi.spyOn(fs, 'mkdirSync').mockImplementation(
      (p: fs.PathLike, options?: fs.MakeDirectoryOptions | fs.Mode | null) => {
        if (path.resolve(String(p)) === path.resolve(logDir)) {
          mkdirCallsForLogDir += 1;
        }
        return nativeMkdirSync(p, options as any);
      },
    );

    configureLogging({
      level: 'info',
      filePath,
      maxSize: '10m',
      maxFiles: '5',
    });

    assert.equal(mkdirCallsForLogDir, 0);
  });

  it('returns module loggers with all level methods', () => {
    const tempRoot = createTempDir();
    configureLogging({
      level: 'info',
      filePath: path.join(tempRoot, 'app.log'),
      maxSize: '10m',
      maxFiles: '5',
    });

    const logger = createLogger('api.client');
    assert.doesNotThrow(() => logger.debug('first'));
    assert.doesNotThrow(() => logger.info('second'));
    assert.doesNotThrow(() => logger.warn('third'));
    assert.doesNotThrow(() => logger.error('fourth'));
  });

  it('formats log line without module tag when module is null', () => {
    const tempRoot = createTempDir();
    let loggerOptions: winston.LoggerOptions | undefined;

    vi.spyOn(winston.Logger.prototype, 'configure').mockImplementation(function (
      this: winston.Logger,
      options: winston.LoggerOptions,
    ) {
      loggerOptions = options;
      return this;
    });

    configureLogging({
      level: 'info',
      filePath: path.join(tempRoot, 'app.log'),
      maxSize: '10m',
      maxFiles: '5',
    });

    const transports = loggerOptions?.transports as Array<Record<string, unknown>> | undefined;
    assert.ok(Array.isArray(transports));
    assert.ok(transports.length > 0);

    const format = transports[0].format as {
      transform: (info: Record<string, unknown>) => Record<string, unknown>;
    };
    const transformed = format.transform({
      timestamp: '2026-03-10 00:00:00',
      level: 'info',
      message: 'hello',
      module: null,
    });
    const rendered = (transformed as any)[Symbol.for('message')] as string;

    assert.ok(rendered.includes('INFO'));
    assert.equal(rendered.includes('[]'), false);
    assert.ok(rendered.endsWith(' hello'));
  });
});
