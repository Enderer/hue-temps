import assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, describe, it, mock } from 'node:test';
import YAML from 'yaml';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('throws when file is missing', () => {
    const existsSpy = mock.method(fs, 'existsSync', () => false);

    assert.throws(() => loadConfig('missing.yml'), /Config file not found/);
    assert.equal(existsSpy.mock.calls.length, 1);
  });

  it('reads yaml and returns connect config', () => {
    const configPath = 'config.yml';
    const parsed = { connect: { bridgeIp: '10.0.0.2', user: 'tester' } };

    mock.method(fs, 'existsSync', () => true);
    const readSpy = mock.method(fs, 'readFileSync', (path: string, encoding: string) => {
      assert.equal(path, configPath);
      assert.equal(encoding, 'utf8');
      return 'yaml-content';
    });
    const parseSpy = mock.method(YAML, 'parse', () => parsed);

    const result = loadConfig(configPath);

    assert.deepEqual(result, parsed);
    assert.equal(readSpy.mock.calls.length, 1);
    assert.equal(parseSpy.mock.calls.length, 1);
  });
});
