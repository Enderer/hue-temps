/**
 * Convert color temperature in degrees Kelvin to mired scale
 * @param temp Color temp in Kelvin
 * @param min Min allowed mired value
 * @param max Max allowed mired value
 */
export const kelvinToMired = (temp: number, min = 153, max = 500): number => {
  let mired = 1e6 / temp;
  if (!(max == null)) {
    mired = Math.min(mired, max);
  }
  if (!(min == null)) {
    mired = Math.max(mired, min);
  }
  mired = Math.floor(mired);
  return mired;
};
