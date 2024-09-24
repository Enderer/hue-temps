import { DateTime } from 'luxon';
import * as suncalc from 'suncalc';
import { find } from 'geo-tz';
import { TimeOfDay } from '../shared';

export interface Times {
  sunset: TimeOfDay;
  sunrise: TimeOfDay;
  noon: TimeOfDay;
  nadir: TimeOfDay;
  zone: string;
}

const getTime = (date: DateTime, d: Date, z: string): TimeOfDay => {
  const a = DateTime.fromJSDate(d).setZone(z);
  if (!a.isValid) {
    return { minutes: NaN };
  }
  const t = date.set({ hour: a.hour, minute: a.minute });
  const minutes = { minutes: t.hour * 60 + t.minute };
  return minutes;
};

export const getTimes = (
  year: number,
  month: number,
  day: number,
  lat: number,
  lon: number
): Times => {
  const zone = find(lat, lon)[0];
  const d = DateTime.fromObject({ year, month, day }, { zone });
  const times = suncalc.getTimes(d.toJSDate(), lat, lon);
  const MIN_SUNRISE = { minutes: 4 * 60 };
  const MAX_SUNRISE = { minutes: 10 * 60 };
  const MIN_SUNSET = { minutes: 15 * 60 };
  const MAX_SUNSET = { minutes: 21 * 60 };

  const getTime1 = (
    isRise: boolean,
    min: TimeOfDay,
    max: TimeOfDay,
    d1: Date
  ): TimeOfDay => {
    if (Number.isNaN(d1.getTime())) {
      const { altitude } = suncalc.getPosition(d.toJSDate(), lat, lon);
      if (altitude < 0) {
        return isRise ? max : min;
      }
      return isRise ? min : max;
    }
    const t = getTime(d, d1, zone);
    const t1 = Math.max(t.minutes, min.minutes);
    const t2 = Math.min(t1, max.minutes);
    return { minutes: t2 };
  };

  const sunset1 = Number.isNaN(times.goldenHour.getTime())
    ? times.sunset
    : times.goldenHour;
  const sunrise = getTime1(true, MIN_SUNRISE, MAX_SUNRISE, times.sunrise);
  const sunset = getTime1(false, MIN_SUNSET, MAX_SUNSET, sunset1);
  const noon = getTime(d, times.solarNoon, zone);
  const nadir = getTime(d, times.nadir, zone);
  return { sunrise, sunset, noon, nadir, zone };
};
