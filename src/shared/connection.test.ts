import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import keytar from 'keytar';
import {
  clearConnection,
  createConnectionLoader,
  listConnection,
  loadConnection,
  loadFromEnv,
  loadFromKeystore,
  setConnection,
} from './connection.js';

const options = {
  envBridge: 'HUE_BRIDGE_TEST',
  envUser: 'HUE_USER_TEST',
  keystoreService: 'huetemps-test',
  keystoreProfile: 'default',
};

const originalEnvBridge = process.env[options.envBridge];
const originalEnvUser = process.env[options.envUser];

const clearTestEnv = () => {
  if (originalEnvBridge == null) {
    delete process.env[options.envBridge];
  } else {
    process.env[options.envBridge] = originalEnvBridge;
  }

  if (originalEnvUser == null) {
    delete process.env[options.envUser];
  } else {
    process.env[options.envUser] = originalEnvUser;
  }
};

describe('connection', () => {
  afterEach(() => {
    mock.restoreAll();
    clearTestEnv();
  });

  it('loadFromEnv trims values and marks source as env', async () => {
    process.env[options.envBridge] = ' 192.0.2.10 ';
    process.env[options.envUser] = ' user-token-1 ';

    const result = await loadFromEnv(options.envBridge, options.envUser);

    assert.deepEqual(result, {
      bridge: '192.0.2.10',
      user: 'user-token-1',
      source: 'env',
    });
  });

  it('loadFromEnv returns undefined when both values are missing', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];

    const result = await loadFromEnv(options.envBridge, options.envUser);

    assert.equal(result, undefined);
  });

  it('loadFromKeystore returns trimmed values and source keystore', async () => {
    const getSpy = mock.method(keytar, 'getPassword', async (_service: string, account: string) => {
      if (account.endsWith('bridge')) return ' 192.0.2.20 ';
      if (account.endsWith('user')) return ' test-user-20 ';
      return null;
    });

    const result = await loadFromKeystore(options.keystoreService, options.keystoreProfile);

    assert.equal(getSpy.mock.calls.length, 2);
    assert.deepEqual(result, {
      bridge: '192.0.2.20',
      user: 'test-user-20',
      source: 'keystore',
    });
  });

  it('loadFromKeystore returns undefined when no values are stored', async () => {
    const getSpy = mock.method(keytar, 'getPassword', async () => null);

    const result = await loadFromKeystore(options.keystoreService, options.keystoreProfile);

    assert.equal(getSpy.mock.calls.length, 2);
    assert.equal(result, undefined);
  });

  it('listConnection prefers env over keystore', async () => {
    process.env[options.envBridge] = '192.0.2.30';
    process.env[options.envUser] = 'user-30';

    const getSpy = mock.method(keytar, 'getPassword', async () => {
      throw new Error('keystore should not be used when env values exist');
    });

    const result = await listConnection(options);

    assert.deepEqual(result, {
      bridge: '192.0.2.30',
      user: 'user-30',
      source: 'env',
    });
    assert.equal(getSpy.mock.calls.length, 0);
  });

  it('listConnection falls back to keystore when env is missing', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];

    const getSpy = mock.method(keytar, 'getPassword', async (_service: string, account: string) => {
      if (account.endsWith('bridge')) return '192.0.2.40';
      if (account.endsWith('user')) return 'user-40';
      return null;
    });

    const result = await listConnection(options);

    assert.equal(getSpy.mock.calls.length, 2);
    assert.deepEqual(result, {
      bridge: '192.0.2.40',
      user: 'user-40',
      source: 'keystore',
    });
  });

  it('loadConnection returns undefined when both values are missing', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];
    mock.method(keytar, 'getPassword', async () => null);

    const result = await loadConnection(options);

    assert.equal(result, undefined);
  });

  it('loadConnection throws when only one of bridge or user is present', async () => {
    process.env[options.envBridge] = '192.0.2.50';
    delete process.env[options.envUser];

    await assert.rejects(loadConnection(options), /Both bridge and user are required/);
  });

  it('loadConnection validates bridge and user formats', async () => {
    process.env[options.envBridge] = 'invalid-bridge';
    process.env[options.envUser] = 'valid-user-1';

    await assert.rejects(loadConnection(options), /Invalid bridge IP address/);

    process.env[options.envBridge] = '192.0.2.60';
    process.env[options.envUser] = 'bad user';

    await assert.rejects(loadConnection(options), /Invalid user token/);
  });

  it('setConnection validates and stores bridge and user', async () => {
    const setSpy = mock.method(keytar, 'setPassword', async () => undefined);

    await setConnection(options, 'bridge', '192.0.2.70');
    await setConnection(options, 'user', 'user-70');

    assert.equal(setSpy.mock.calls.length, 2);
    assert.deepEqual(setSpy.mock.calls[0].arguments, [
      options.keystoreService,
      'profile:default:connect:bridge',
      '192.0.2.70',
    ]);
    assert.deepEqual(setSpy.mock.calls[1].arguments, [
      options.keystoreService,
      'profile:default:connect:user',
      'user-70',
    ]);
  });

  it('setConnection rejects invalid fields and invalid values', async () => {
    const setSpy = mock.method(keytar, 'setPassword', async () => undefined);

    await assert.rejects(setConnection(options, 'other', 'x'), /Invalid field/);
    await assert.rejects(
      setConnection(options, 'bridge', 'not-an-ip'),
      /Invalid bridge IP address/,
    );
    await assert.rejects(setConnection(options, 'user', 'bad user'), /Invalid user token/);

    assert.equal(setSpy.mock.calls.length, 0);
  });

  it('setConnection rejects null field or null value', async () => {
    const setSpy = mock.method(keytar, 'setPassword', async () => undefined);

    await assert.rejects(
      setConnection(options, null as unknown as string, '192.0.2.90'),
      /Invalid field/,
    );
    await assert.rejects(
      setConnection(options, 'bridge', null as unknown as string),
      /Invalid bridge IP address/,
    );

    assert.equal(setSpy.mock.calls.length, 0);
  });

  it('clearConnection deletes bridge and user from keystore', async () => {
    const delSpy = mock.method(keytar, 'deletePassword', async () => true);

    await clearConnection(options);

    assert.equal(delSpy.mock.calls.length, 2);
    assert.deepEqual(delSpy.mock.calls[0].arguments, [
      options.keystoreService,
      'profile:default:connect:bridge',
    ]);
    assert.deepEqual(delSpy.mock.calls[1].arguments, [
      options.keystoreService,
      'profile:default:connect:user',
    ]);
  });

  it('createConnectionLoader exposes wrapper methods', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];

    const getSpy = mock.method(keytar, 'getPassword', async (_service: string, account: string) => {
      if (account.endsWith('bridge')) return '192.0.2.80';
      if (account.endsWith('user')) return 'user-80';
      return null;
    });
    const setSpy = mock.method(keytar, 'setPassword', async () => undefined);
    const delSpy = mock.method(keytar, 'deletePassword', async () => true);

    const loader = createConnectionLoader(options);

    const loaded = await loader.load();
    const listed = await loader.list();
    await loader.setBridge('192.0.2.81');
    await loader.setUser('user-81');
    await loader.clear();

    assert.deepEqual(loaded, {
      bridge: '192.0.2.80',
      user: 'user-80',
      source: 'keystore',
    });
    assert.deepEqual(listed, {
      bridge: '192.0.2.80',
      user: 'user-80',
      source: 'keystore',
    });

    assert.equal(getSpy.mock.calls.length, 4);
    assert.equal(setSpy.mock.calls.length, 2);
    assert.equal(delSpy.mock.calls.length, 2);
  });
});
