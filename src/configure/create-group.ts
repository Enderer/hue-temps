import { AxiosInstance } from 'axios';
import { getResult, Group } from '../shared';

export interface CreateGroup {
  (client: AxiosInstance, lightId: string): Promise<Group>;
}

export const createGroup: CreateGroup = async (client, lightId) => {
  const name = `group-light-${lightId}`;
  const lightIds = [lightId];
  const group = { name, type: 'LightGroup', recycle: true, lights: lightIds };
  const id = getResult(await client.post('/groups', group));
  return { id, name, lightIds };
};
