import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import type { ApiClient } from './client.js';

describe('fetchLights', () => {
  afterEach(async () => {
    mock.restoreAll();
    const loggerModule = await import('../shared/logger.js');
    loggerModule.__setRootLoggerForTests(null);
  });

  it('fetches lights', async () => {
    const childLogger = { log: mock.fn() } as any;
    const rootLogger = { child: mock.fn(() => childLogger) } as any;

    const loggerModule = await import('../shared/logger.js');
    loggerModule.__setRootLoggerForTests(rootLogger);

    const { fetchLights } = await import('./fetch-lights.js');

    const apiResponse = {
      light1: {
        name: 'Kitchen',
        productname: 'Hue A19',
        state: { reachable: false, on: true, ct: 200 },
        capabilities: { control: { ct: { min: 153, max: 454 } } },
      },
      light2: {
        name: 'Porch',
        state: {},
        capabilities: {},
      },
    } satisfies Record<string, unknown>;

    const getStub = mock.fn(async (resource: string) => {
      assert.equal(resource, 'lights');
      return apiResponse;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const lights = await fetchLights(async () => client);

    assert.deepEqual(lights, [
      {
        id: 'light1',
        name: 'Kitchen',
        productName: 'Hue A19',
        reachable: false,
        on: true,
        temp: 200,
        tempMin: 153,
        tempMax: 454,
      },
      {
        id: 'light2',
        name: 'Porch',
        productName: '',
        reachable: true,
        on: false,
        temp: 370,
        tempMin: 370,
        tempMax: 370,
      },
    ]);

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0].arguments[0], 'lights');

    assert.equal(rootLogger.child.mock.calls.length, 1);
    assert.equal(childLogger.log.mock.calls.length, 2);

    loggerModule.__setRootLoggerForTests(null);
  });
});
