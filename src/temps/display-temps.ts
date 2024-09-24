import { find } from 'geo-tz';
import { DateTime } from 'luxon';
// import chalk from 'chalk';
import { getTargetTemp } from './target-temp';
import { createLogger, TimeOfDay } from '../shared';
import { getTimes } from './get-times';

const logger = createLogger('display-temps');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require('chalk');

chalk.enabled = true;

const DAY = 3900;
const EVENING = 2900;
const NIGHT = 2600;
const OFFSET = 60;

export const displayTemps = (lat: number, lon: number): void => {
  const zone = find(lat, lon)[0];
  const dateZero = getDate(zone, 2000, 1, 1);

  const toKey = (year: number, month: number, day: number, time: TimeOfDay) => {
    return year * 10 ** 12
      + month * 10 ** 8
      + day * 10 ** 6
      + time.minutes;
  };

  const dateHeader = new Array(12).fill(0)
    .map((_, month) => dateZero.set({ month }));
  const timesHeader = new Array(24).fill(0)
    .map((_, m) => ({ minutes: (m * 60) }));

  const dates = dateHeader.map(dateMonth => {
    const times = getTimes(dateMonth.year, dateMonth.month, dateMonth.day, lat, lon);
    const { sunrise, noon, nadir, sunset } = times;
    const getTarget = getTargetTemp(DAY, EVENING, NIGHT, OFFSET, sunrise, sunset);

    const printTimes = {
      sunrise: Math.floor(sunrise.minutes / 60),
      sunset: Math.floor(sunset.minutes / 60),
      noon: Math.floor(noon.minutes / 60),
      nadir: Math.floor(nadir.minutes / 60)
    };

    const getLabel = (t: TimeOfDay): string | undefined => {
      const t1 = Math.floor(t.minutes / 60);
      switch (t1) {
        case printTimes.sunrise:
          return TimeLabel.Sunrise;
        case printTimes.sunset:
          return TimeLabel.Sunset;
        case printTimes.noon:
          return TimeLabel.Noon;
        case printTimes.nadir:
          return TimeLabel.Nadir;
        default:
          return undefined;
      }
    };

    return timesHeader.map(th => {
      const h = Math.floor(th.minutes / 60);
      const mins = th.minutes % 60;
      const date = dateMonth.set({ hour: h, minute: mins });
      const minutes = th;
      const temp = getTarget(minutes);
      const label = getLabel(minutes);
      const key = toKey(dateMonth.year, dateMonth.month, dateMonth.day, minutes);
      return { key, date, temp, label };
    });
  }).flat();

  const dateLookup = new Map(dates.map(d => [
    d.key,
    { date: d.date, label: d.label, temp: d.temp } as Record
  ]));
  const cols = dateHeader;
  const rows = timesHeader;
  const header = cols.map(col => `${col.toFormat('MMM')}`.padStart(6)).join('');
  logger.info(`    ${header}`);
  rows.forEach(rowObj => {
    const hour = Math.floor(rowObj.minutes / 60);
    const minute = rowObj.minutes % 60;
    const header = DateTime.fromObject({ hour, minute }).toFormat('ha');
    const vals = cols.map(cc => {
      const key = toKey(cc.year, cc.month, cc.day, rowObj);
      const r = dateLookup.get(key);
      return r ? printTemp(r) : '';
      // printTemp(dateLookup(key));
    });
    logger.info(`${header.padStart(4)}${vals.map(v => v).join('')}`);
  });
};

const getDate = (zone: string, year: number, month: number, day: number) => DateTime
  .fromObject({}, { zone })
  .set({ year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 });

export interface Record { date: DateTime; label?: string; temp: number; }

const printTemp = (r: Record) => {
  let temp = r.temp.toFixed(0).padStart(6);
  if (r.label === TimeLabel.Sunrise) {
    temp = chalk.yellow(temp);
  } else if (r.label === TimeLabel.Sunset) {
    temp = chalk.red(temp);
  } else if (r.label === TimeLabel.Noon) {
    temp = chalk.cyan(temp);
  } else if (r.label === TimeLabel.Nadir) {
    temp = chalk.grey(temp);
  }
  return temp;
};

enum TimeLabel {
  Sunrise = 'sunrise',
  Sunset = 'sunset',
  Noon = 'noon',
  Nadir = 'nadir'
}

logger.info('\n\n');
logger.info('##########################################');
logger.info('\n\nNorth Pole');
displayTemps(90.000, 135.000);

logger.info('\n\nSvalbarði');
displayTemps(77.8750, 20.9752);

logger.info('\n\nParis');
displayTemps(48.8566, 2.3522);

logger.info('\n\nBoston');
displayTemps(42.3601, 71.0589);
