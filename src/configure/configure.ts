import axios from 'axios';
import { createLogger, getGroups, getResource } from '../shared';
import { configureSensors } from './configure-sensors';
import { hueMapping } from './hue-mapping';

(async () => {

  const logger = createLogger('configure/index');

  try {
    const user = '7AOkD-P8t7fJ8itlL-Ix2Ls4lVpqz0Yeb27Pj2UE';
    const ipaddress = '192.168.0.44';
    const client = axios.create({ baseURL: `http://${ipaddress}/api/${user}` });

    const links = await getResource<any>('resourcelinks')(client);
    const sensorLinks = [...new Set(hueMapping.map(m => m.sensor))].map(m => `/sensors/${m}`);

    const deletable = links.filter(
      link => link.o.links.some((l: string) => sensorLinks.some(s => s === l))
    );

    // const deletable = links.filter(l => l.e.classid === 6464);
    for (const d of deletable) {
      await client.delete(`/resourcelinks/${d.id}`);
    }

    const rules = await getResource<any>('rules', r => r)(client);
    const deletedRules = rules.filter(
      r => r.o.conditions.some((c: any) => sensorLinks.some(s => c.address.startsWith(s)))
    );
    for (const d of deletedRules) {
      await client.delete(`/rules/${d.id}`);
    }

    // Delete Scenes
    const scenes = await getResource<any>('scenes')(client);
    const deletableScenes = scenes.filter(s => s?.o?.appdata?.data === '6464');
    for (const d of deletableScenes) {
      await client.delete(`/scenes/${d.id}`);
    }

    // Delete Groups
    const groups = await getGroups(client);
    const deleteGroups = groups.filter(g => g.name.startsWith('group-'));
    const groupIds = deleteGroups.map(g => g.id);
    for (const g of groupIds) {
      await client.delete(`/groups/${g}`);
    }

    // await deleteAll('rules')(client);
    // await deleteAll('scenes')(client);
    // await deleteAll('schedules')(client);
    // await deleteAll('resourcelinks')(client);
    await configureSensors(client, hueMapping);

  } catch (err) {
    logger.error(err, 'Error occured configuring lights');
  }
})();
