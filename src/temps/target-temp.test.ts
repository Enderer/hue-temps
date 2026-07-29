import { describe, it, expect } from 'vitest';
import { getTargetTemp } from './target-temp';
import { timeOfDay } from './calendar-date';

describe('getTargetTemp', () => {
  const dayTemp = 6000;
  const eveningTemp = 3000;
  const nightTemp = 2000;
  const offset = 30;
  const sunrise = timeOfDay(6, 0); // 6:00 AM
  const sunset = timeOfDay(18, 0); // 6:00 PM
  const getTemp = getTargetTemp(dayTemp, eveningTemp, nightTemp, offset, sunrise, sunset);

  it('returns nightTemp before sunrise - offset', () => {
    expect(getTemp(timeOfDay(5, 0))).toBe(nightTemp);
  });

  it('returns dayTemp after sunrise + offset', () => {
    expect(getTemp(timeOfDay(7, 0))).toBe(dayTemp);
  });

  it('returns eveningTemp after sunset - offset', () => {
    expect(getTemp(timeOfDay(17, 31))).toBe(eveningTemp);
  });

  it('returns nightTemp after sunset + 2*offset', () => {
    expect(getTemp(timeOfDay(19, 0))).toBe(nightTemp);
  });

  it('returns nightTemp at midnight', () => {
    expect(getTemp(timeOfDay(0, 0))).toBe(nightTemp);
  });

  it('throws for invalid time', () => {
    expect(() => getTemp({ minutes: -1 })).toThrow();
  });

  it('throws for invalid sunrise', () => {
    expect(() =>
      getTargetTemp(dayTemp, eveningTemp, nightTemp, offset, { minutes: -1 }, sunset),
    ).toThrow('Invalid sunrise');
    expect(() =>
      getTargetTemp(dayTemp, eveningTemp, nightTemp, offset, { minutes: 1441 }, sunset),
    ).toThrow('Invalid sunrise');
  });

  it('throws for invalid sunset', () => {
    expect(() =>
      getTargetTemp(dayTemp, eveningTemp, nightTemp, offset, sunrise, { minutes: -1 }),
    ).toThrow('Invalid sunset');
    expect(() =>
      getTargetTemp(dayTemp, eveningTemp, nightTemp, offset, sunrise, { minutes: 1441 }),
    ).toThrow('Invalid sunset');
  });
});
