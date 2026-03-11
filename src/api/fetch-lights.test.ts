import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mapLight } from './fetch-lights.js';

describe('mapLight', () => {
  it('maps light api records to normalized light objects', () => {
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

    const lights = Object.entries(apiResponse).map(([id, o]) => mapLight({ id, o }));

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
  });
});
