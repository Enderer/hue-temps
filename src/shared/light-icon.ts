import chalk from 'chalk';
import { Light } from '../api/index.js';
import * as colors from './color.js';

const BULB_CHAR_ON = '██';
const BULB_CHAR_OFF = '▒▒';
const BULB_CHAR_UNREACHABLE = '⧅';

const BULB_COLOR_OFF = { r: 88, g: 88, b: 88 };
const BULB_COLOR_UNREACHABLE = { r: 255, g: 0, b: 0 };

/**
 * Creates a character used to display the light's state in the terminal
 * Shows on and off lights and colored according to the current color temperature.
 */
export const lightIcon = (light: Light): string => {
  if (!light.reachable) {
    const { r, g, b } = BULB_COLOR_UNREACHABLE;
    return chalk.rgb(r, g, b)(BULB_CHAR_UNREACHABLE);
  }
  if (!light.on) {
    const { r, g, b } = BULB_COLOR_OFF;
    return chalk.rgb(r, g, b)(BULB_CHAR_OFF);
  }
  const kelvin = colors.miredToKelvin(light.temp);
  const rgb = colors.kelvinToRGB(kelvin);
  return chalk.rgb(rgb.r, rgb.g, rgb.b)(BULB_CHAR_ON);
};
