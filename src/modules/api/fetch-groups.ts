import { Mapper } from './fetch-resource.js';

export interface Group {
  id: string;
  name: string;
  type: string;
  lightIds: string[];
}

export const mapGroup: Mapper<Group> = ({ id, o }) => {
  const { name, type, lights: lightIds } = o as any;
  return { id, name, type, lightIds } as Group;
};
