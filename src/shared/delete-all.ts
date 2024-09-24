import { AxiosInstance, AxiosResponse } from 'axios';
import { getResource } from '.';

export const deleteAll = (entity: string) => {
  return async (client: AxiosInstance): Promise<AxiosResponse<any>[]> => {
    const entities = await getResource(entity)(client);
    const entityIds = entities.map(e => e.id);
    const deletes = [];
    for (const id of entityIds) {
      const resource = `/${entity}/${id}`;
      const deleteResponse = await client.delete(resource);
      deletes.push(deleteResponse);
    }
    return deletes;
  };
};
