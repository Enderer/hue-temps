const KELVIN_MIN = 1900;
const KELVIN_MAX = 6700;
const MIRED_MIN = 153;
const MIRED_MAX = 500;

/**
 * Convert color temperature in degrees Kelvin to mired scale
 * @param kelvin Color temp in Kelvin
 */
export const kelvinToMired = (kelvin: number): number => {
  const mired = Math.floor(1e6 / kelvin);
  const clipped = clip(mired, MIRED_MIN, MIRED_MAX);
  return clipped;
};

/**
 * Convert color temperature in mired scale to degrees Kelvin
 * @param mired Color temp in mired scale
 */
export const miredToKelvin = (mired: number): number => {
  const kelvin = Math.floor(1e6 / mired);
  const clipped = clip(kelvin, KELVIN_MIN, KELVIN_MAX);
  return clipped;
};

export const miredToRGB = (mired: number): RGB => {
  const kelvin = miredToKelvin(mired);
  return kelvinToRGB(kelvin);
};

export const clip = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

type RGB = { r: number; g: number; b: number };

const toChannel = (v: number) => clip(Math.round(v), 0, 255);

export const kelvinToRGB = (kelvin: number): RGB => {
  const t = clip(kelvin, KELVIN_MIN, KELVIN_MAX) / 100;
  const r = t <= 66 ? 255 : toChannel(329.698727446 * (t - 60) ** -0.1332047592);
  const g =
    t <= 66
      ? toChannel(99.4708025861 * Math.log(t) - 161.1195681661)
      : toChannel(288.1221695283 * (t - 60) ** -0.0755148492);
  const b =
    t >= 66 ? 255 : t <= 19 ? 0 : toChannel(138.5177312231 * Math.log(t - 10) - 305.0447927307);
  return { r, g, b };
};
