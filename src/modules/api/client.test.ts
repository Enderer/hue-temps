import assert from 'node:assert/strict';
import got, { Got } from 'got';
import { afterEach, describe, it, vi } from 'vitest';
import { createApiClient, createApiClientProvider } from './client.js';

describe('createApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('configures got and forwards get calls', async () => {
    const fakeResponse: Record<string, { id: number }> = {
      light1: { id: 1 },
    };

    const getStub = vi.fn(async (resource: string) => {
      // Simulate the JSON body got would resolve with
      return { body: fakeResponse };
    });

    const fakeGot = { get: getStub } as unknown as Got;
    const extendSpy = vi.spyOn(got, 'extend').mockImplementation(() => fakeGot);

    const ip = '192.0.2.10';
    const user = 'test-user';
    const client = createApiClient(ip, user);

    const result = await client.get<{ id: number }>('lights');

    assert.equal(extendSpy.mock.calls.length, 1);
    const [extendOptions] = extendSpy.mock.calls[0];
    assert.deepEqual(extendOptions, {
      prefixUrl: `http://${ip}/api/${user}`,
      responseType: 'json',
    });

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0][0], 'lights');
    assert.strictEqual(result, fakeResponse);
  });

  it('sends alert and logs start/end', async () => {
    const putStub = vi.fn(async (resource: string) => {
      assert.equal(resource, 'lights/abc/state');
      return { ok: true } as any;
    });

    const fakeGot = { put: putStub } as unknown as Got;
    const extendSpy = vi.spyOn(got, 'extend').mockImplementation(() => fakeGot);

    const client = createApiClient('192.0.2.10', 'test-user');

    const result = await client.alert('abc');

    assert.equal(result, true);

    assert.equal(extendSpy.mock.calls.length, 1);
    const [extendOptions] = extendSpy.mock.calls[0];
    assert.deepEqual(extendOptions, {
      prefixUrl: 'http://192.0.2.10/api/test-user',
      responseType: 'json',
    });

    assert.equal(putStub.mock.calls.length, 1);
    const callArgs = putStub.mock.calls[0] as unknown[];
    const resource = callArgs[0] as string;
    const options = callArgs[1] as any;
    assert.equal(resource, 'lights/abc/state');
    assert.deepEqual(options, { json: { alert: 'select' } });
  });
});

describe('createApiClientProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the client once and returns a cached instance', async () => {
    const getStub = vi.fn(async (_resource: string) => ({ body: {} }));
    const fakeGot = { get: getStub } as unknown as Got;
    const extendSpy = vi.spyOn(got, 'extend').mockImplementation(() => fakeGot);

    const load = vi.fn(async () => ({ bridge: '192.0.2.10', user: 'test-user', source: 'env' }));
    const connectionLoader = {
      load,
    } as any;

    const provider = createApiClientProvider(connectionLoader);

    const first = await provider();
    const second = await provider();

    assert.equal(load.mock.calls.length, 1);
    assert.equal(extendSpy.mock.calls.length, 1);
    assert.strictEqual(first, second);
  });

  it('throws when no connection info is available', async () => {
    const extendSpy = vi.spyOn(got, 'extend').mockImplementation(() => ({}) as Got);
    const load = vi.fn(async () => undefined);
    const connectionLoader = {
      load,
    } as any;

    const provider = createApiClientProvider(connectionLoader);

    await assert.rejects(provider(), /No connection info found for Hue bridge/);
    assert.equal(load.mock.calls.length, 1);
    assert.equal(extendSpy.mock.calls.length, 0);
  });
});
