import { Group } from './group';
import { getResource } from './get-resource';

export const getGroups = getResource<Group>('groups', ({ id, o }) => {
  const { name, lights: lightIds } = o;
  return { id, name, lightIds };
});
