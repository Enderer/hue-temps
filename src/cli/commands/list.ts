import { getBorderCharacters, table } from 'table';
import { ApiClient } from '../../api/client.js';
import { getGroups, getLights, getSensors } from '../../api/index.js';
import { ListTarget } from '../types.js';

/**
 * List command prints out a list of resources.
 * @param client
 * @returns
 */
export const list = (client: ApiClient) => async (target: ListTarget) => {
  console.log(`list command received: ${target}`);
  const outputs: Record<string, string[][]> = {};

  if (target === 'lights' || target === 'all') {
    const lights = await getLights(client);
    const data = lights.map((l) => [l.id, l.name]);
    outputs['lights'] = data;
  }

  if (target === 'sensors' || target === 'all') {
    const sensors = await getSensors(client);
    const data = sensors.map((s) => [s.id, s.name, s.productName]);
    outputs['sensors'] = data;
  }

  if (target === 'groups' || target === 'all') {
    const groups = await getGroups(client);
    const data = groups.map((g) => [g.id, g.name]);
    outputs['groups'] = data;
  }

  // Format
  Object.values(outputs)
    .flatMap((o) => o)
    .flatMap((r) => r.forEach((c, i) => (r[i] = c ?? '-')));

  // Print to console
  const border = getBorderCharacters('norc');
  const outConfig = { singleLine: true, border, header: { content: 'Lights' } };

  const out = Object.entries(outputs).map(([content, data]) => {
    return table(data, { ...outConfig, header: { content } });
  });
  console.log(out.join('\n'));
};
