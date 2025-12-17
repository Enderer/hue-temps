import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import keytar from 'keytar';
import { loadCredentials, loadEnvCredentials, loadKeystoreCredentials } from './credentials.js';

const options = {
  envBridge: 'HUE_BRIDGE',
  envUser: 'HUE_USER',
  keychainService: 'hue',
  keychainProfile: 'default',
};

const originalEnv = {
  bridge: process.env[options.envBridge],
  user: process.env[options.envUser],
};

afterEach(() => {
  // Restore mocks and environment for isolation between tests.
  mock.restoreAll();
  if (originalEnv.bridge === undefined) {
    delete process.env[options.envBridge];
  } else {
    process.env[options.envBridge] = originalEnv.bridge;
  }
  if (originalEnv.user === undefined) {
    delete process.env[options.envUser];
  } else {
    process.env[options.envUser] = originalEnv.user;
  }
});

describe('loadCredentials', () => {
  it('returns env credentials when both variables are set', async () => {
    process.env[options.envBridge] = '10.0.0.1';
    process.env[options.envUser] = 'tester';

    const keytarSpy = mock.method(keytar, 'getPassword');

    const creds = await loadCredentials(options);

    assert.deepEqual(creds, { bridgeIp: '10.0.0.1', user: 'tester', source: 'env' });
    assert.equal(keytarSpy.mock.calls.length, 0);
  });

  it('prefers env credentials over keychain', async () => {
    process.env[options.envBridge] = '10.0.0.9';
    process.env[options.envUser] = 'env-user';

    const keytarSpy = mock.method(keytar, 'getPassword', async () =>
      JSON.stringify({ bridgeIp: '10.0.0.2', user: 'key-user' }),
    );

    const creds = await loadCredentials(options);

    assert.deepEqual(creds, { bridgeIp: '10.0.0.9', user: 'env-user', source: 'env' });
    assert.equal(keytarSpy.mock.calls.length, 0);
  });

  it('falls back to keychain when env vars are missing', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];

    const stored = JSON.stringify({ bridgeIp: '10.0.0.2', user: 'fallback' });
    const keytarSpy = mock.method(
      keytar,
      'getPassword',
      async (service: string, account: string) => {
        assert.equal(service, options.keychainService);
        assert.equal(account, 'profile:default:connect');
        return stored;
      },
    );

    const creds = await loadCredentials(options);

    assert.deepEqual(creds, { bridgeIp: '10.0.0.2', user: 'fallback', source: 'keychain' });
    assert.equal(keytarSpy.mock.calls.length, 1);
  });

  it('returns undefined when neither env nor keychain has credentials', async () => {
    delete process.env[options.envBridge];
    delete process.env[options.envUser];

    mock.method(keytar, 'getPassword', async () => null);

    const creds = await loadCredentials(options);

    assert.equal(creds, undefined);
  });
});

describe('loadEnvCredentials', () => {
  it('trims values and requires both', () => {
    process.env[options.envBridge] = ' 10.0.0.3 ';
    process.env[options.envUser] = ' alice ';

    const creds = loadEnvCredentials(options.envBridge, options.envUser);

    assert.deepEqual(creds, { bridgeIp: '10.0.0.3', user: 'alice', source: 'env' });
  });

  it('returns undefined when either env var is empty', () => {
    process.env[options.envBridge] = '   ';
    process.env[options.envUser] = 'bob';

    const creds = loadEnvCredentials(options.envBridge, options.envUser);

    assert.equal(creds, undefined);
  });

  it('returns undefined when process.env is unavailable', () => {
    // Simulate environments where process.env access can throw or be undefined.
    const originalEnv = process.env as typeof process.env | undefined;
    // @ts-expect-error intentionally override for test
    process.env = undefined;

    const creds = loadEnvCredentials(options.envBridge, options.envUser);

    // Restore original env for other tests
    // @ts-expect-error restoring mocked value
    process.env = originalEnv;

    assert.equal(creds, undefined);
  });
});

describe('loadKeystoreCredentials', () => {
  it('returns credentials when keychain entry is valid', async () => {
    const stored = JSON.stringify({ bridgeIp: '10.0.0.4 ', user: ' carol ' });
    mock.method(keytar, 'getPassword', async (service: string, account: string) => {
      assert.equal(service, options.keychainService);
      assert.equal(account, 'profile:default:connect');
      return stored;
    });

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.deepEqual(creds, { bridgeIp: '10.0.0.4', user: 'carol', source: 'keychain' });
  });

  it('returns undefined when parsed entry lacks fields', async () => {
    mock.method(keytar, 'getPassword', async () => JSON.stringify({ bridgeIp: '10.0.0.5' }));

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.equal(creds, undefined);
  });

  it('returns undefined when parsed entry is null', async () => {
    mock.method(keytar, 'getPassword', async () => JSON.stringify(null));

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.equal(creds, undefined);
  });

  it('returns undefined when parsed entry is an empty object', async () => {
    mock.method(keytar, 'getPassword', async () => JSON.stringify({}));

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.equal(creds, undefined);
  });

  it('returns undefined on malformed JSON', async () => {
    mock.method(keytar, 'getPassword', async () => '{oops');

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.equal(creds, undefined);
  });

  it('returns undefined when keytar throws', async () => {
    mock.method(keytar, 'getPassword', async () => {
      throw new Error('fail');
    });

    const creds = await loadKeystoreCredentials(options.keychainService, options.keychainProfile);

    assert.equal(creds, undefined);
  });
});
