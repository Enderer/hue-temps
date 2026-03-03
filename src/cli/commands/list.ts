import chalk from 'chalk';
import { Argument } from 'commander';
import { getBorderCharacters, table, TableUserConfig } from 'table';
import { Light, Store } from '../../api/index.js';
import * as colors from '../../shared/color.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('commands.list');

export type ListTarget = 'lights' | 'groups' | 'sensors' | 'temps' | 'all';

export const listTargets: ListTarget[] = ['lights', 'groups', 'sensors', 'temps', 'all'];

const BULB_CHAR_ON = '██';
const BULB_CHAR_OFF = '▒▒';
const BULB_CHAR_UNREACHABLE = '⧅';

const BULB_COLOR_OFF = { r: 88, g: 88, b: 88 };
const BULB_COLOR_UNREACHABLE = { r: 255, g: 0, b: 0 };

export const init = (store: Store, program: any, zoneName: string) => {
  program
    .command('list')
    .description('List lights, groups, sensors, or temps')
    .addArgument(
      new Argument('[target]', listTargets.join(' | ')).choices(listTargets).default('all'),
    )
    .action(list(zoneName, store));
};

const getLightIcon = (light: Light): string => {
  if (!light.reachable) {
    const { r, g, b } = BULB_COLOR_UNREACHABLE;
    return chalk.rgb(r, g, b)(BULB_CHAR_UNREACHABLE);
  }
  if (!light.on) {
    const { r, g, b } = BULB_COLOR_OFF;
    return chalk.rgb(r, g, b)(BULB_CHAR_OFF);
  }
  const kelvin = colors.miredToKelvin(light.temp);
  const rgb = colors.kelvinToRGB(kelvin);
  return chalk.rgb(rgb.r, rgb.g, rgb.b)(BULB_CHAR_ON);
};

// for (let mired = 153; mired <= 454; mired += 20) {
//   const kelvin = color.miredToKelvin(mired);
//   const rgb = color.miredToRGB(mired);
//   console.log(
//     chalk.rgb(rgb.r, rgb.g, rgb.b)('███'),
//     `${kelvin} K \t ${mired} \t (${rgb.r}, ${rgb.g}, ${rgb.b})`,
//   );
// }

/**
 * List command prints out a list of resources.
 * @param zoneName Name of the zone to change temps for
 * @returns
 */
export const list = (zoneName: string, store: Store) => async (target: ListTarget) => {
  logger.info(`Listing target: ${target} (zone: ${zoneName})`);
  const outputs: Record<string, string[][]> = {};

  if (target === 'lights' || target === 'all') {
    logger.debug('List lights');
    const lights = await store.lights();
    const data = lights.map((l) => [l.id, getLightIcon(l), l.name, l.productName]);
    data.sort((a, b) => a[2].localeCompare(b[2]));
    outputs['lights'] = data;
  }

  if (target === 'sensors' || target === 'all') {
    logger.debug('List sensors');
    const sensors = await store.sensors();
    const data = sensors.map((s) => [s.id, s.name, s.productName]);
    data.sort((a, b) => a[1].localeCompare(b[1]));
    outputs['sensors'] = data;
  }

  if (target === 'groups' || target === 'all') {
    logger.debug('List groups');
    const groups = await store.groups();
    const data = groups.map((g) => [g.id, g.name, g.type ?? '']);
    data.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
    outputs['groups'] = data;
  }

  if (target === 'temps' || target === 'all') {
    logger.debug('List temps');
    const groups = await store.groups();
    const group = groups.find((g) => g.name === zoneName);
    if (group != null) {
      const lightIds = group.lightIds ?? [];
      const allLights = await store.lights();
      const tempsLights = allLights.filter((l) => lightIds.includes(l.id));
      const data = tempsLights.map((l) => [l.id, getLightIcon(l), l.name, l.productName]);
      data.sort((a, b) => a[2].localeCompare(b[2]));
      outputs['temps'] = data;
    } else {
      outputs['temps'] = [];
    }
  }

  // Normalize empty cells to dashes
  Object.values(outputs).forEach((rows) => {
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell == null) {
          row[cellIndex] = '-';
        }
      });
      rows[rowIndex] = row;
    });
  });

  // Print to console
  const border = getBorderCharacters('norc');
  const outConfig: TableUserConfig = {
    singleLine: true,
    border,
    columns: { 0: { width: 6 } },
  };
  const out = Object.entries(outputs).map(([content, data]) => {
    data = data.length === 0 ? [['(none)']] : data;
    return table(data, { ...outConfig, header: { content } });
  });
  console.log(out.join('\n'));
};
