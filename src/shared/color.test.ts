import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { kelvinToRGB } from './color.js';

// Expected values produced by the algorithm for representative temperatures
const cases = [
  { kelvin: 2200, expected: { r: 255, g: 146, b: 39 } },
  { kelvin: 3000, expected: { r: 255, g: 177, b: 110 } },
  { kelvin: 4000, expected: { r: 255, g: 206, b: 166 } },
  { kelvin: 5000, expected: { r: 255, g: 228, b: 206 } },
];

describe('kelvinToRGB', () => {
  for (const { kelvin, expected } of cases) {
    it(`maps ${kelvin}K to expected RGB`, () => {
      const rgb = kelvinToRGB(kelvin);
      assert.deepStrictEqual(rgb, expected);
    });
  }
});
