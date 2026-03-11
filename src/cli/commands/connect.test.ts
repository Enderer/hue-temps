import assert from 'node:assert/strict';
import { Command } from 'commander';
import { afterEach, describe, it, vi } from 'vitest';
import type { ConnectionLoader } from '../../shared/connection.js';
import { connectClear, connectList, connectSet, init } from './connect.js';

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const createLoader = (
  listResult?: { bridge?: string; user?: string; source?: string } | undefined,
) => {
  const load = vi.fn(async () => undefined);
  const list = vi.fn(async () => listResult);
  const setBridge = vi.fn(async (_bridge: string) => {});
  const setUser = vi.fn(async (_user: string) => {});
  const clear = vi.fn(async () => {});

  const loader = {
    load,
    list,
    setBridge,
    setUser,
    clear,
  } as unknown as ConnectionLoader;

  return { loader, load, list, setBridge, setUser, clear };
};

describe('connect command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connectSet bridge saves bridge and lists current connection', async () => {
    const output: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '));
    });

    const { loader, setBridge, setUser, list } = createLoader({
      bridge: '192.0.2.1',
      user: 'test-user',
      source: 'keystore',
    });

    await connectSet(loader, 'bridge')('192.0.2.1');
    await flush();

    assert.equal(setBridge.mock.calls.length, 1);
    assert.equal(setBridge.mock.calls[0][0], '192.0.2.1');
    assert.equal(setUser.mock.calls.length, 0);
    assert.equal(list.mock.calls.length, 1);

    assert.ok(output.includes('Connection bridge saved'));
    assert.ok(output.includes('Current connection info:'));
    assert.ok(output.includes('Bridge: 192.0.2.1'));
    assert.ok(output.includes('User: test-user'));
    assert.ok(output.includes('Source: keystore'));
  });

  it('connectSet user saves user and lists current connection', async () => {
    const output: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '));
    });

    const { loader, setBridge, setUser, list } = createLoader({
      bridge: '192.0.2.2',
      user: 'abc-123',
      source: 'env',
    });

    await connectSet(loader, 'user')('abc-123');
    await flush();

    assert.equal(setUser.mock.calls.length, 1);
    assert.equal(setUser.mock.calls[0][0], 'abc-123');
    assert.equal(setBridge.mock.calls.length, 0);
    assert.equal(list.mock.calls.length, 1);

    assert.ok(output.includes('Connection user saved'));
    assert.ok(output.includes('Current connection info:'));
  });

  it('connectList prints no info found when list returns undefined', async () => {
    const output: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '));
    });

    const { loader, list } = createLoader(undefined);

    await connectList(loader);

    assert.equal(list.mock.calls.length, 1);
    assert.ok(output.includes('Current connection info:'));
    assert.ok(output.includes('No connection info found'));
  });

  it('connectList renders fallback values for missing fields', async () => {
    const output: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '));
    });

    const { loader } = createLoader({ bridge: undefined, user: undefined, source: undefined });

    await connectList(loader);

    assert.ok(output.includes('Bridge: not set'));
    assert.ok(output.includes('User: not set'));
    assert.ok(output.includes('Source: unknown'));
  });

  it('connectClear clears values and lists current connection', async () => {
    const output: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.join(' '));
    });

    const { loader, clear, list } = createLoader({
      bridge: '192.0.2.3',
      user: 'u-1',
      source: 'keystore',
    });

    await connectClear(loader)();
    await flush();

    assert.equal(clear.mock.calls.length, 1);
    assert.equal(list.mock.calls.length, 1);
    assert.ok(output.includes('Connection info cleared from keystore'));
    assert.ok(output.includes('Current connection info:'));
  });

  it('init registers connect command hierarchy', () => {
    const { loader } = createLoader();
    const program = new Command();

    init(loader, program);

    const connect = program.commands.find((cmd) => cmd.name() === 'connect');
    assert.ok(connect);

    const children = connect.commands.map((cmd) => cmd.name());
    assert.deepEqual(children, ['set', 'list', 'clear']);

    const set = connect.commands.find((cmd) => cmd.name() === 'set');
    assert.ok(set);

    const setChildren = set.commands.map((cmd) => cmd.name());
    assert.deepEqual(setChildren, ['bridge', 'user']);
  });
});
