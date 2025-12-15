import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import got, { Got } from 'got';
import { createApiClient } from './client.js';

describe('createApiClient', () => {
  afterEach(() => {
    mock.restoreAll();
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
});
