/**
 * Calculate the amount of time that a light should take to transition to a new temp
 * @param deltaRate Rate that lights should transition to their target color temp (degrees/ms)
 * @param targetTemp Desired color temp for a light
 * @param currentTemp Current color temp for a light
 * @returns Amount of time (ms) to transition from current to desired temp
 */
export function getTransitionTime(
  deltaRate: number,
  targetTemp: number,
  currentTemp?: number
): number {
  if (currentTemp == null) { return 15 * 60 * 1000; }
  const delta = Math.abs(targetTemp - currentTemp);
  const time = delta / deltaRate;
  return time;
}
