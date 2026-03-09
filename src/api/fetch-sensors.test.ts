import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import { configureLogging } from '../shared/logger.js';
import type { ApiClient } from './client.js';
import { fetchSensors } from './fetch-sensors.js';

describe('fetchSensors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches sensors and maps productname to productName', async () => {
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

    const apiResponse = {
      sensor1: { name: 'Dimmer Switch', productname: 'Hue Dimmer Switch v2' },
      sensor2: { name: 'Motion', productname: 'Hue Motion Sensor' },
    } satisfies Record<string, unknown>;

    const getStub = vi.fn(async (resource: string) => {
      assert.equal(resource, 'sensors');
      return apiResponse;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const sensors = await fetchSensors(async () => client);

    assert.deepEqual(sensors, [
      { id: 'sensor1', name: 'Dimmer Switch', productName: 'Hue Dimmer Switch v2' },
      { id: 'sensor2', name: 'Motion', productName: 'Hue Motion Sensor' },
    ]);

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0][0], 'sensors');
  });
});
