import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { ApiClient } from './client.js';
import { createStore } from './store.js';

describe('createStore', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('fetches resources once, caches results, and supports predicates', async () => {
    const responses: Record<string, unknown> = {
      '/lights': {
        body: {
          light1: {
            name: 'Kitchen',
            productname: 'Hue A19',
            state: { on: true, reachable: true, ct: 250 },
            capabilities: { control: { ct: { min: 200, max: 400 } } },
          },
          light2: {
            name: 'Porch',
            productname: 'Hue A19',
            state: { on: false },
            capabilities: { control: { ct: { min: 153, max: 454 } } },
          },
        },
      },
      '/sensors': {
        body: {
          sensor1: { name: 'Motion', productname: 'Hue Motion Sensor' },
        },
      },
      '/groups': {
        body: {
          group1: { name: 'Downstairs', type: 'Zone', lights: ['light1', 'light2'] },
        },
      },
    };

    const getStub = mock.fn(async (resource: string) => {
      const response = responses[resource];
      assert.ok(response, `unexpected resource ${resource}`);
      return response;
    });

    const client = { get: getStub } as unknown as ApiClient;
    const store = createStore(client);

    const lights = await store.lights();
    const sensors = await store.sensors();
    const groups = await store.groups();
    const onLights = await store.lights((l) => l.on);

    assert.deepEqual(lights, [
      {
        id: 'light1',
        name: 'Kitchen',
        productName: 'Hue A19',
        reachable: true,
        on: true,
        temp: 250,
        tempMin: 200,
        tempMax: 400,
      },
      {
        id: 'light2',
        name: 'Porch',
        productName: 'Hue A19',
        reachable: true,
        on: false,
        temp: 370,
        tempMin: 153,
        tempMax: 454,
      },
    ]);

    assert.deepEqual(onLights, [lights[0]]);

    assert.deepEqual(sensors, [
      { id: 'sensor1', name: 'Motion', productName: 'Hue Motion Sensor' },
    ]);

    assert.deepEqual(groups, [
      { id: 'group1', name: 'Downstairs', type: 'Zone', lightIds: ['light1', 'light2'] },
    ]);

    assert.equal(getStub.mock.calls.length, 3);
    assert.deepEqual(
      getStub.mock.calls.map((c) => c.arguments[0]),
      ['/lights', '/sensors', '/groups'],
    );
  });
});
