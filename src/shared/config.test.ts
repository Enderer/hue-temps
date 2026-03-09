import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import YAML from 'yaml';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when file is missing', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation(() => false);

    assert.throws(() => loadConfig('missing.yml'), /Config file not found/);
    assert.equal(existsSpy.mock.calls.length, 1);
  });

  it('reads yaml and returns config with zone name', () => {
    const configPath = 'config.yml';
    const parsed = { zoneName: 'living-room' };

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((path: string, encoding: string) => {
        assert.equal(path, configPath);
        assert.equal(encoding, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.zoneName, 'living-room');
    assert.equal(result.logging.level, 'info');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });

  it('falls back to default zoneName when YAML.parse yields null', () => {
    const configPath = 'config.yml';

    vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation((path: string, encoding: string) => {
        assert.equal(path, configPath);
        assert.equal(encoding, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => null);

    const result = loadConfig(configPath);

    assert.equal(result.zoneName, 'Hue Temps');
    assert.equal(result.logging.level, 'info');
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
      .mockImplementation((p: string, encoding: string) => {
        assert.equal(p, configPath);
        assert.equal(encoding, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    assert.equal(result.logging.filePath, absoluteLogFile);
    assert.equal(result.logging.level, 'info');
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
      .mockImplementation((p: string, encoding: string) => {
        assert.equal(p, configPath);
        assert.equal(encoding, 'utf8');
        return 'yaml-content';
      });
    const parseSpy = vi.spyOn(YAML, 'parse').mockImplementation(() => parsed);

    const result = loadConfig(configPath);

    const expectedFilePath = path.join(path.resolve('project'), relativeLogFile);
    assert.equal(result.logging.filePath, expectedFilePath);
    assert.equal(result.logging.level, 'info');
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });
});
