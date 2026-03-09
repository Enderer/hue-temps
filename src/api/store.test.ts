import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import { configureLogging } from '../shared/logger.js';
import { ApiClient } from './client.js';
import { createStore } from './store.js';

describe('createStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches resources once, caches results, and supports predicates', async () => {
    try {
      configureLogging({
        level: 'error',
        filePath: path.join(os.tmpdir(), 'huetemps', 'test.log'),
        maxSize: '1m',
        maxFiles: '1d',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been configured')) {
        throw error;
      }
    }

    const responses: Record<string, unknown> = {
      lights: {
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
      sensors: {
        sensor1: { name: 'Motion', productname: 'Hue Motion Sensor' },
      },
      groups: {
        group1: { name: 'Downstairs', type: 'Zone', lights: ['light1', 'light2'] },
      },
    };

    const getStub = vi.fn(async (resource: string) => {
      const response = responses[resource];
      assert.ok(response, `unexpected resource ${resource}`);
      return response;
    });

    const client = { get: getStub } as unknown as ApiClient;
    const store = createStore(async () => client);

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
      getStub.mock.calls.map((c) => c[0]),
      ['lights', 'sensors', 'groups'],
    );
  });
});
