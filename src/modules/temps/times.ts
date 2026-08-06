import { find } from 'geo-tz';
import { DateTime } from 'luxon';
import suncalc from 'suncalc';
import { CalendarDate, TimeOfDay } from './calendar-date.js';

// For locations near the poles, sunrise and sunset can be very early or late.
// To avoid temp changes at unreasonable times, we use min/max sunrise and sunset.
const MIN_SUNRISE = 4 * 60;
const MAX_SUNRISE = 10 * 60;
const MIN_SUNSET = 15 * 60;
const MAX_SUNSET = 21 * 60;

/**
 * Auspicious times for sun position at a given location on a given date.
 */
export interface Times {
  sunset: TimeOfDay;
  sunrise: TimeOfDay;
  noon: TimeOfDay;
  nadir: TimeOfDay;
  zone: string;
}

/**
 * Calculate critical times of day for the sun's position that affect the desired color temperature for lights.
 * @param date Date to calculate times for
 * @param lat Latitude of location to calculate times for
 * @param lon Longitude of location to calculate times for
 */
export const getTimes = (date: CalendarDate, lat: number, lon: number): Times => {
  const zone = find(lat, lon)[0];
  const { year, month, day } = date;
  const d = DateTime.fromObject({ year, month, day }, { zone });
  const times = suncalc.getTimes(d.toJSDate(), lat, lon);
  times.goldenHour = isNaN(times.goldenHour.getTime()) ? times.sunset : times.goldenHour;
  const sunrise = getTimeOfDay(MIN_SUNRISE, MAX_SUNRISE, d, times.sunrise, zone, lat, lon, true);
  const sunset = getTimeOfDay(MIN_SUNSET, MAX_SUNSET, d, times.goldenHour, zone, lat, lon, false);
  const noon = getTimeOfDay(MAX_SUNRISE, MIN_SUNSET, d, times.solarNoon, zone, lat, lon, true);
  const nadir = getTimeOfDay(0, 24 * 60, d, times.nadir, zone, lat, lon, false);
  return { sunrise, sunset, noon, nadir, zone };
};

/**
 * Calculate the time of day for an event
 * Consider min and max times and handling cases where the event doesn't natually occur
 * @param minTime Minimum time allowed for the given time
 * @param maxTime Maximum time allowed for the given time
 * @param dateBase Date to calculate the time for
 * @param dateEvent Date of the event that determines the time
 * @param zone Timezone the location is in
 * @param lat Latitude of the location
 * @param lon Longitude of the location
 * @param isDay Whether the event is a sunrise or sunset event
 */
const getTimeOfDay = (
  minTime: number,
  maxTime: number,
  dateBase: DateTime,
  dateEvent: Date,
  zone: string,
  lat: number,
  lon: number,
  isDay: boolean,
) => {
  const dateE = DateTime.fromJSDate(dateEvent, { zone });
  let minutes = dateE.hour * 60 + dateE.minute;

  // If the event time is invalid (sun doesn't rise or set)
  // use the altitude of the sun to determine if it's day or night
  // and set the time to the min or max accordingly.
  if (isNaN(minutes)) {
    const dateMin = dateBase.set({ hour: Math.floor(minTime / 60), minute: minTime % 60 });
    const { altitude } = suncalc.getPosition(dateMin.toJSDate(), lat, lon);
    const sunIsUp = altitude > 0 ? 1 : 0;
    const startDay = isDay ? 1 : 0;
    const matrix = [
      [minTime, maxTime],
      [maxTime, minTime],
    ];
    minutes = matrix[sunIsUp][startDay];
  }
  // Clamp the time to avoid unreasonable sunrise and sunset values
  minutes = Math.max(minutes, minTime);
  minutes = Math.min(minutes, maxTime);
  return { minutes };
};
