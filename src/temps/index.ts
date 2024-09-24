import { find } from 'geo-tz';
import { DateTime } from 'luxon';
import { calendarDate, createClient, createLogger } from '../shared';
import { getTimes } from './get-times';
import { setTemps } from './set-temps';
import { getTargetTemp } from './target-temp';

const DAY_LIGHT = 3900;
const EVENING_LIGHT = 3000;
const NIGHT_LIGHT = 2800;
const LOOKAHEAD = 10 * 60 * 1000;
const DELTA_RATE = 2000 / LOOKAHEAD;
const ZONE_NAME = 'Hue Temps';
const OFFSET = 60;

const logger = createLogger('temps/index');
process
  .on('unhandledRejection', (reason, p) => {
    logger.error(reason, 'Unhandled Rejection at Promise', p);
    process.exit(1);
  })
  .on('uncaughtException', err => {
    logger.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });
(() => {
  logger.info(`Start temps ${new Date().toISOString()}`);
  const user = '7AOkD-P8t7fJ8itlL-Ix2Ls4lVpqz0Yeb27Pj2UE';
  // const key = '35DAD8666E7E936D3B19423ADFF584C7';
  const ipaddress = '192.168.0.44';
  const client = createClient(ipaddress, user);
  const isImmediate = false;
  const lat = 42.3601;
  const long = -71.0589;

  const zone = find(lat, long)[0];
  const nowTime = DateTime.fromJSDate(new Date()).setZone(zone, { keepLocalTime: true });
  const now = calendarDate(
    nowTime.year,
    nowTime.month,
    nowTime.day,
    nowTime.hour,
    nowTime.minute
  );

  const times = getTimes(now.year, now.month, now.day, lat, long);

  const targetTemp = getTargetTemp(
    DAY_LIGHT,
    EVENING_LIGHT,
    NIGHT_LIGHT,
    OFFSET,
    times.sunrise,
    times.sunset
  );

  return setTemps({
    isImmediate,
    deltaRate: DELTA_RATE,
    offset: OFFSET,
    zone: ZONE_NAME,
    client,
    now,
    targetTemp
  });
})().then(results => {
  const success = results.map(({ status, statusText, data }) => ({ status, statusText, data }));
  logger.info(`Success\n${JSON.stringify(success)}`);
}).catch(err => {
  logger.fatal(err);
  process.exit(1);
}).finally(() => {
  logger.info('Job complete');
});
