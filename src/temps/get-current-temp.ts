import { Light } from '../shared';

/**
 * Get the current color temperature of a given light
 * @param light Light to return color temp
 * @returns Color temperature in degrees Kelvin
 */
export function getCurrentTemp(light: Light): number | undefined {
  const temp = light?.state?.ct;
  if (temp == null || !(temp >= 0)) { return undefined; }
  const kelvin = 1e6 / temp;
  return kelvin;
}
