import { AxiosInstance } from 'axios';
import { getResult } from '../shared';
import { getSceneEntries } from './create-scenes';
import { Scenes } from '../shared/scene';

export const createLink = async (
  client: AxiosInstance,
  sensorId: string,
  groupId: string,
  lightIds: string[],
  scenes: Scenes,
  ruleIds: string[]
): Promise<string> => {
  const sceneLinks = getSceneEntries(scenes).map(s => `/scenes/${s.sceneId}`);
  const lightLinks = lightIds.map(l => `/lights/${l}`);
  const ruleLinks = ruleIds.map(r => `/rules/${r}`);
  const link = getResult(await client.post('/resourcelinks', {
    name: `link-sensor-${sensorId}`,
    description: `sensor ${sensorId} behavior`,
    type: 'Link',
    classid: 6464,
    recycle: false,
    links: [
      `/sensors/${sensorId}`,
      `/groups/${groupId}`,
      ...lightLinks,
      ...sceneLinks,
      ...ruleLinks
    ]
  }));

  return link;
};
