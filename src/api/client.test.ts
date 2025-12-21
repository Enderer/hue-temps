import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import got, { Got } from 'got';
import { createApiClient } from './client.js';

describe('createApiClient', () => {
  afterEach(async () => {
    mock.restoreAll();
    const loggerModule = await import('../shared/logger.js');
    loggerModule.__setRootLoggerForTests(null);
  });

  it('configures got and forwards get calls', async () => {
    const fakeResponse: Record<string, { id: number }> = {
      light1: { id: 1 },
    };

    const getStub = mock.fn(async (resource: string) => {
      // Simulate the JSON body got would resolve with
      return fakeResponse;
    });

    const fakeGot = { get: getStub } as unknown as Got;
    const extendSpy = mock.method(got, 'extend', () => fakeGot);

    const ip = '192.0.2.10';
    const user = 'test-user';
    const client = createApiClient(ip, user);

    const result = await client.get<{ id: number }>('lights');

    assert.equal(extendSpy.mock.calls.length, 1);
    const [extendOptions] = extendSpy.mock.calls[0].arguments;
    assert.deepEqual(extendOptions, {
      prefixUrl: `http://${ip}/api/${user}`,
      responseType: 'json',
    });

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0].arguments[0], 'lights');
    assert.strictEqual(result, fakeResponse);
  });

  it('sends alert and logs start/end', async () => {
    const childLogger = { log: mock.fn() } as any;
    const rootLogger = { child: mock.fn(() => childLogger) } as any;

    const loggerModule = await import('../shared/logger.js');
    loggerModule.__setRootLoggerForTests(rootLogger);

    const putStub = mock.fn(async (resource: string) => {
      assert.equal(resource, 'lights/abc/state');
      return { ok: true } as any;
    });

    const fakeGot = { put: putStub } as unknown as Got;
    const extendSpy = mock.method(got, 'extend', () => fakeGot);

    const client = createApiClient('192.0.2.10', 'test-user');

    const result = await client.alert('abc');

    assert.equal(result, true);

    assert.equal(extendSpy.mock.calls.length, 1);
    const [extendOptions] = extendSpy.mock.calls[0].arguments;
    assert.deepEqual(extendOptions, {
      prefixUrl: 'http://192.0.2.10/api/test-user',
      responseType: 'json',
    });

    assert.equal(putStub.mock.calls.length, 1);
    const callArgs = putStub.mock.calls[0].arguments as unknown[];
    const resource = callArgs[0] as string;
    const options = callArgs[1] as any;
    assert.equal(resource, 'lights/abc/state');
    assert.deepEqual(options, { json: { alert: 'select' } });

    assert.equal(rootLogger.child.mock.calls.length, 1);
    assert.equal(childLogger.log.mock.calls.length, 2);
  });
});
