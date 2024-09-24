import { linearInterpolation } from 'simple-linear-interpolation';
import { isTimeOfDay, TimeOfDay } from '../shared';

export interface TargetTemp {
  /**
   * Returns the desired light color temperature for a given time of day
   * @param time Time of day expressed as number of minutes
   */
  (time: TimeOfDay): number;
}

/**
 * Creates a function that retursn the target color tempurature for lights.
 * Calculates what the desired color temperature for a light should be at a
 * given time of day based on setting desired temperature at sunset and sunrise.
 * @param dayTemp Color temperature for lights during the day
 * @param eveningTemp Color temperature for lights during evening
 * @param nightTemp Color temperature for lights at night
 * @param offset Amount of transition time before and after sunset / sunrise
 * @param sunrise Time of day sunrise occurs
 * @param sunset Time of day sunset occurs
 */
export function getTargetTemp(
  dayTemp: number,
  eveningTemp: number,
  nightTemp: number,
  offset: number,
  sunrise: TimeOfDay,
  sunset: TimeOfDay
): TargetTemp {

  if (!(isTimeOfDay(sunrise))) {
    throw new Error(`Invalid sunrise time ${sunrise}`);
  }
  if (!(isTimeOfDay(sunset))) {
    throw new Error(`Invalid sunset time ${sunset}`);
  }

  const values = [
    [0, nightTemp],
    [sunrise.minutes - offset, nightTemp],
    [sunrise.minutes + offset, dayTemp],
    [sunset.minutes - 2 * offset, dayTemp],
    [sunset.minutes - 1 * offset, eveningTemp],
    [sunset.minutes + 1 * offset, eveningTemp],
    [sunset.minutes + 2 * offset, nightTemp],
    [24 * 60, nightTemp]
  ];
  const points = values.map(([x, y]) => ({ x, y }));
  const calculate = linearInterpolation(points);

  return (now: TimeOfDay) => {
    if (!isTimeOfDay(now)) { throw new Error(`Invalid time ${now}`); }
    const temps1 = calculate({ x: now.minutes });
    const temps2 = Math.floor(temps1);
    return temps2;
  };
}
