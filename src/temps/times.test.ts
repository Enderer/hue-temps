import { describe, expect, test } from 'vitest';
import { getTimes } from './times';
import { calendarDate } from './calendar-date';

describe('getTimes', () => {
  const cases = [
    { label: 'Svalbarði', lat: 77.875, lon: 20.9752 },
    { label: 'Paris', lat: 48.8566, lon: 2.3522 },
    { label: 'North Pole', lat: 90.0, lon: 135.0 },
    { label: 'Boston', lat: 42.3601, lon: -71.0589 },
  ];

  test.each(cases)('$label', ({ label, lat, lon }) => {
    const date = calendarDate(2024, 12, 21);
    const t = getTimes(date, lat, lon);
    expect(typeof t.sunrise.minutes, `${label}: sunrise.minutes should be a number`).toBe('number');
    expect(typeof t.sunset.minutes, `${label}: sunset.minutes should be a number`).toBe('number');
    expect(typeof t.noon.minutes, `${label}: noon.minutes should be a number`).toBe('number');
    expect(typeof t.nadir.minutes, `${label}: nadir.minutes should be a number`).toBe('number');
    expect(typeof t.zone, `${label}: zone should be a string`).toBe('string');
  });

  describe('Svalbard polar extremes', () => {
    const svalbardLat = 78.2232;
    const svalbardLon = 15.6267;

    test('midnight sun in June clamps sunrise early and sunset late', () => {
      const date = calendarDate(2024, 6, 21);
      const t = getTimes(date, svalbardLat, svalbardLon);

      // During midnight sun the sun is always up, so simulate maximum daylight:
      // earliest possible sunrise and latest possible sunset
      expect(t.sunrise.minutes).toBe(4 * 60); // MIN_SUNRISE
      expect(t.sunset.minutes).toBe(21 * 60); // MAX_SUNSET
    });

    test('polar night in December clamps sunrise late and sunset early', () => {
      const date = calendarDate(2024, 12, 21);
      const t = getTimes(date, svalbardLat, svalbardLon);

      // During polar night the sun is never up, so simulate minimum daylight:
      // latest possible sunrise and earliest possible sunset
      expect(t.sunrise.minutes).toBe(10 * 60); // MAX_SUNRISE
      expect(t.sunset.minutes).toBe(15 * 60); // MIN_SUNSET
    });
  });
});
