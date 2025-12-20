import { fetchResource } from './fetch-resource.js';

export interface Group {
  id: string;
  name: string;
  type: string;
  lightIds: string[];
}

export const createFetchGroups = (fetchResourceFn: typeof fetchResource = fetchResource) =>
  fetchResourceFn<Group>('groups', ({ id, o }) => {
    const { name, type, lights: lightIds } = o as any;
    return { id, name, type, lightIds } as Group;
  });

export const fetchGroups = createFetchGroups();
