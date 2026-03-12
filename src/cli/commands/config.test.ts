import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { afterEach, describe, it, vi } from 'vitest';
import { configTemplate, HueTempsConfig } from '../../shared/config.js';
import { init, initConfig, printConfig } from './config.js';

const mocks = vi.hoisted(() => {
  return {
    configPath: '',
  };
});

vi.mock('../../shared/config.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../shared/config.js')>();
  return {
    ...original,
    getConfigPath: () => mocks.configPath,
  };
});

const createTestConfig = (overrides?: Partial<HueTempsConfig>): HueTempsConfig => ({
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
  ...overrides,
});

describe('config command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a config command with --init option on the program', () => {
    const program = new Command();
    init(program, '/tmp/config.yaml', createTestConfig());

    const cmd = program.commands.find((c) => c.name() === 'config');
    assert.ok(cmd);
    assert.ok(cmd.description().includes('config'));
    const initOption = cmd.options.find((o) => o.long === '--init');
    assert.ok(initOption);
  });

  it('creates config file at the default path when it does not exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'huetemps-config-'));
    mocks.configPath = path.join(tempDir, 'huetemps', 'config.yaml');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    initConfig();

    assert.equal(fs.existsSync(mocks.configPath), true);
    const contents = fs.readFileSync(mocks.configPath, 'utf8');
    assert.equal(contents, configTemplate());
    assert.ok(consoleSpy.mock.calls.some((c) => (c[0] as string).includes('created')));
  });

  it('does not overwrite an existing config file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'huetemps-config-'));
    const configDir = path.join(tempDir, 'huetemps');
    mocks.configPath = path.join(configDir, 'config.yaml');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(mocks.configPath, 'existing content', 'utf8');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    initConfig();

    const contents = fs.readFileSync(mocks.configPath, 'utf8');
    assert.equal(contents, 'existing content');
    assert.ok(consoleSpy.mock.calls.some((c) => (c[0] as string).includes('already exists')));
  });

  it('calls initConfig and printConfig when --init is passed', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'huetemps-config-'));
    mocks.configPath = path.join(tempDir, 'huetemps', 'config.yaml');

    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = new Command();
    program.exitOverride();
    const config = createTestConfig();
    init(program, '/tmp/config.yaml', config);

    await program.parseAsync(['config', '--init'], { from: 'user' });

    assert.equal(fs.existsSync(mocks.configPath), true);
  });

  it('prints resolved config values', () => {
    const config = createTestConfig({ zoneName: 'Living Room' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    printConfig('/tmp/config.yaml', config);

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    assert.ok(output.includes('Configuration'));
    assert.ok(output.includes('/tmp/config.yaml'));
    assert.ok(output.includes('Living Room'));
    assert.ok(output.includes('info'));
    assert.ok(output.includes('/tmp/huetemps.log'));
    assert.ok(output.includes('10m'));
    assert.ok(output.includes('5'));
  });
});
