import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mapSensors } from './fetch-sensors.js';

describe('mapSensors', () => {
  it('maps sensor api records and renames productname to productName', () => {
    const apiResponse = {
      sensor1: { name: 'Dimmer Switch', productname: 'Hue Dimmer Switch v2' },
      sensor2: { name: 'Motion', productname: 'Hue Motion Sensor' },
    } satisfies Record<string, unknown>;

    const sensors = Object.entries(apiResponse).map(([id, o]) => mapSensors({ id, o }));

    assert.deepEqual(sensors, [
      { id: 'sensor1', name: 'Dimmer Switch', productName: 'Hue Dimmer Switch v2' },
      { id: 'sensor2', name: 'Motion', productName: 'Hue Motion Sensor' },
    ]);
  });
});
