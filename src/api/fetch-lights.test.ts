import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { ApiClient } from './client.js';
import { fetchLights } from './fetch-lights.js';

describe('fetchLights', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('fetches lights and maps state, capabilities, and defaults', async () => {
    const apiResponse = {
      body: {
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
      },
    } satisfies Record<string, unknown>;

    const getStub = mock.fn(async (resource: string) => {
      assert.equal(resource, 'lights');
      return apiResponse;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const lights = await fetchLights(client);

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
  });
});
