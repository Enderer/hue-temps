import { Argument } from 'commander';
import { getBorderCharacters, table } from 'table';
import { Store } from '../../api/index.js';
import { lightIcon } from '../../shared/light-icon.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('commands.list');

export type ListTarget = 'lights' | 'groups' | 'sensors' | 'temps' | 'all';

export const listTargets: ListTarget[] = ['lights', 'groups', 'sensors', 'temps', 'all'];

const NAME_WIDTH_MAX = 30;

export const init = (store: Store, program: any, zoneName: string) => {
  program
    .command('list')
    .description('List lights, groups, sensors, or temps')
    .addArgument(
      new Argument('[target]', listTargets.join(' | ')).choices(listTargets).default('all'),
    )
    .action(list(zoneName, store));
};

const getMaxWidth = (rows: string[][], col: number, max: number): number => {
  const value = Math.max(0, ...rows.map((row) => row[col].length));
  return Math.min(value, max);
};

/**
 * List command prints out a list of resources.
 * @param zoneName Name of the zone to change temps for
 */
export const list = (zoneName: string, store: Store) => async (target: ListTarget) => {
  logger.info(`Listing target: ${target} (zone: ${zoneName})`);
  const outputs: Record<string, string[][]> = {};

  if (target === 'lights' || target === 'all') {
    logger.debug('List lights');
    const lights = await store.lights();
    const data = lights.map((l) => [l.id, lightIcon(l), l.name, l.productName]);
    data.sort((a, b) => a[2].localeCompare(b[2]));
    outputs['lights'] = data;
  }

  if (target === 'sensors' || target === 'all') {
    logger.debug('List sensors');
    const sensors = await store.sensors();
    const data = sensors.map((s) => [s.id, '', s.name, s.productName]);
    data.sort((a, b) => a[1].localeCompare(b[1]));
    outputs['sensors'] = data;
  }

  if (target === 'groups' || target === 'all') {
    logger.debug('List groups');
    const groups = await store.groups();
    const data = groups.map((g) => [g.id, '', g.name, g.type]);
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
      const data = tempsLights.map((l) => {
        return [l.id, lightIcon(l), l.name, l.productName];
      });
      data.sort((a, b) => a[2].localeCompare(b[2]));
      outputs['temps'] = data;
    } else {
      outputs['temps'] = [];
    }
  }

  // Replace nulls with '-'
  const rows = Object.values(outputs).flat();
  for (const row of rows) {
    for (const [c, cell] of row.entries()) {
      row[c] = cell ?? '-';
    }
  }

  // Print to console
  const border = getBorderCharacters('norc');
  const widthName = getMaxWidth(rows, 2, NAME_WIDTH_MAX);
  const widthDetail = getMaxWidth(rows, 3, NAME_WIDTH_MAX);
  const outConfig = {
    singleLine: true,
    border,
    columns: {
      0: { width: 4 },
      1: { width: 2 },
      2: { width: widthName, truncate: widthName },
      3: { width: widthDetail, truncate: widthDetail },
    },
  };
  const out = Object.entries(outputs).map(([content, data]) => {
    return table(data, { ...outConfig, header: { content } });
  });
  console.log(out.join('\n'));
};
