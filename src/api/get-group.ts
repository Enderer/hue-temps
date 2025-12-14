import { getResource } from './get-resource.js';
import { Group } from './group.js';

export const getGroups = getResource<Group>('groups', ({ id, o }) => {
  const { name, lights: lightIds } = o as any;
  return { id, name, lightIds } as Group;
});
