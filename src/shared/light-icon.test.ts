import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import chalk from 'chalk';
import type { Light } from '../api/index.js';
import * as colors from './color.js';
import { lightIcon } from './light-icon.js';

const makeLight = (overrides: Partial<Light> = {}): Light => ({
  id: 'light-1',
  name: 'Kitchen',
  productName: 'Hue White',
  on: false,
  reachable: true,
  temp: 370,
  tempMin: 153,
  tempMax: 500,
  ...overrides,
});

describe('lightIcon', () => {
  it('renders unreachable icon in red', () => {
    const expected = chalk.rgb(255, 0, 0)('⧅');
    const icon = lightIcon(makeLight({ reachable: false, on: true }));
    assert.equal(icon, expected);
  });

  it('renders off icon in gray when light is reachable but off', () => {
    const expected = chalk.rgb(88, 88, 88)('▒▒');
    const icon = lightIcon(makeLight({ reachable: true, on: false }));
    assert.equal(icon, expected);
  });

  it('renders on icon using mapped temperature color', () => {
    const temp = 250;
    const kelvin = colors.miredToKelvin(temp);
    const rgb = colors.kelvinToRGB(kelvin);
    const expected = chalk.rgb(rgb.r, rgb.g, rgb.b)('██');

    const icon = lightIcon(makeLight({ reachable: true, on: true, temp }));
    assert.equal(icon, expected);
  });
});
