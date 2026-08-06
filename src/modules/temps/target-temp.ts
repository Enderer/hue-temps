import { linearInterpolation } from 'simple-linear-interpolation';
import { isTimeOfDay, TimeOfDay } from './calendar-date.js';

/**
 * Creates a function that returns the target color temperature for lights.
 * Target temperature is the color that a light should be set to so that it
 * matches the appropriate color for the time of day at the given location
 * so that it matches the natural color of light in the current location.
 * @param dayTemp Desired color temperature for lights during the day
 * @param eveningTemp Desired color temperature for lights during evening
 * @param nightTemp Desired color temperature for lights at night
 * @param transition Time in minutes to transition temp before/after sunset/sunrise
 * @param sunrise Time of day sunrise occurs
 * @param sunset Time of day sunset occurs
 */
export function getTargetTemp(
  dayTemp: number,
  eveningTemp: number,
  nightTemp: number,
  transition: number,
  sunrise: TimeOfDay,
  sunset: TimeOfDay,
) {
  if (!isTimeOfDay(sunrise)) {
    throw new Error(`Invalid sunrise time ${sunrise}`);
  }
  if (!isTimeOfDay(sunset)) {
    throw new Error(`Invalid sunset time ${sunset}`);
  }

  const values = [
    [0, nightTemp],
    [sunrise.minutes - transition, nightTemp],
    [sunrise.minutes + transition, dayTemp],
    [sunset.minutes - 2 * transition, dayTemp],
    [sunset.minutes - 1 * transition, eveningTemp],
    [sunset.minutes + 1 * transition, eveningTemp],
    [sunset.minutes + 2 * transition, nightTemp],
    [24 * 60, nightTemp],
  ];
  const points = values.map(([x, y]) => ({ x, y }));
  const calculate = linearInterpolation(points);

  return (now: TimeOfDay) => {
    if (!isTimeOfDay(now)) {
      throw new Error(`Invalid time ${now}`);
    }
    const temps1 = calculate({ x: now.minutes });
    const temps2 = Math.floor(temps1);
    return temps2;
  };
}
