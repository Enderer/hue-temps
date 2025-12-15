import chalk from 'chalk';
import { getBorderCharacters, table, TableUserConfig } from 'table';
import { Light, Store } from '../../api/index.js';
import * as colors from '../../shared/color.js';
import { ListTarget } from '../types.js';

const BULB_CHAR_ON = '██';
const BULB_CHAR_OFF = '▒▒';
const BULB_CHAR_UNREACHABLE = '⧅';

const BULB_COLOR_OFF = { r: 88, g: 88, b: 88 };
const BULB_COLOR_UNREACHABLE = { r: 255, g: 0, b: 0 };

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
 * @param client
 * @returns
 */
export const list = (store: Store) => async (target: ListTarget) => {
  console.log(`list command received: ${target}`);
  const outputs: Record<string, string[][]> = {};

  if (target === 'lights' || target === 'all') {
    const lights = await store.lights();
    const data = lights.map((l) => [l.id, getLightIcon(l), l.name, l.productName]);
    data.sort((a, b) => a[2].localeCompare(b[2]));
    outputs['lights'] = data;
  }

  if (target === 'sensors' || target === 'all') {
    const sensors = await store.sensors();
    const data = sensors.map((s) => [s.id, s.name, s.productName]);
    data.sort((a, b) => a[1].localeCompare(b[1]));
    outputs['sensors'] = data;
  }

  if (target === 'groups' || target === 'all') {
    const groups = await store.groups();
    const data = groups.map((g) => [g.id, g.name, g.type ?? '']);
    data.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
    outputs['groups'] = data;
  }

  // Format
  Object.values(outputs)
    .flatMap((o) => o)
    .flatMap((r) => r.forEach((c, i) => (r[i] = c ?? '-')));

  // Print to console
  const border = getBorderCharacters('norc');
  const outConfig: TableUserConfig = {
    singleLine: true,
    border,
    columns: { 0: { width: 3 } },
  };

  const out = Object.entries(outputs).map(([content, data]) => {
    return table(data, { ...outConfig, header: { content } });
  });
  console.log(out.join('\n'));
};
