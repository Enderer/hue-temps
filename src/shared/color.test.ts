import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { clip, kelvinToMired, kelvinToRGB, miredToKelvin, miredToRGB } from './color.js';

// Expected values produced by the algorithm for representative temperatures
const cases = [
  { kelvin: 2200, expected: { r: 255, g: 146, b: 39 } },
  { kelvin: 3000, expected: { r: 255, g: 177, b: 110 } },
  { kelvin: 4000, expected: { r: 255, g: 206, b: 166 } },
  { kelvin: 5000, expected: { r: 255, g: 228, b: 206 } },
  { kelvin: 6000, expected: { r: 255, g: 246, b: 237 } },
  { kelvin: 7000, expected: { r: 254, g: 249, b: 255 } },
];

describe('kelvinToRGB', () => {
  for (const { kelvin, expected } of cases) {
    it(`maps ${kelvin}K to expected RGB`, () => {
      const rgb = kelvinToRGB(kelvin);
      assert.deepStrictEqual(rgb, expected);
    });
  }

  it('clamps below min Kelvin', () => {
    assert.deepStrictEqual(kelvinToRGB(1000), kelvinToRGB(1900));
  });

  it('clamps above max Kelvin', () => {
    assert.deepStrictEqual(kelvinToRGB(8000), kelvinToRGB(6700));
  });
});

describe('kelvinToMired', () => {
  it('converts bounds and clamps high', () => {
    assert.equal(kelvinToMired(2000), 500);
    assert.equal(kelvinToMired(6500), 153);
    assert.equal(kelvinToMired(10000), 153);
  });
});

describe('miredToKelvin', () => {
  it('converts bounds and clamps low', () => {
    assert.equal(miredToKelvin(500), 2000);
    assert.equal(miredToKelvin(153), 6535);
    assert.equal(miredToKelvin(100), 6700);
    assert.equal(miredToKelvin(1000), 1900);
  });
});

describe('miredToRGB', () => {
  it('matches kelvin conversion for equivalent mired', () => {
    const mired = Math.floor(1_000_000 / 3000); // 333
    const expected = { r: 255, g: 177, b: 110 };
    assert.deepStrictEqual(miredToRGB(mired), expected);
  });
});

describe('clip', () => {
  it('clamps values to bounds', () => {
    assert.equal(clip(1, 2, 4), 2);
    assert.equal(clip(3, 2, 4), 3);
    assert.equal(clip(8, 2, 4), 4);
  });
});
