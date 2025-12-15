import { ApiClient } from './client.js';
import { fetchGroups, Group } from './fetch-groups.js';
import { fetchLights, Light } from './fetch-lights.js';
import { fetchSensors, Sensor } from './fetch-sensors.js';

export interface Store {
  lights: StoreFunction<Light>;
  sensors: StoreFunction<Sensor>;
  groups: StoreFunction<Group>;
}

export interface StoreFunction<T> {
  (predicate?: Predicate<T>): Promise<T[]>;
}

export interface Predicate<T> {
  (t: T): boolean;
}

export interface StoreData {
  lights: Promise<Light[]> | undefined;
  sensors: Promise<Sensor[]> | undefined;
  groups: Promise<Group[]> | undefined;
}

export const createStore = (client: ApiClient): Store => {
  const storeData: StoreData = {
    lights: undefined,
    sensors: undefined,
    groups: undefined,
  };

  const resource =
    <T>(prop: string, fetch: () => Promise<T[]>): StoreFunction<T> =>
    async (predicate?: (l: T) => boolean) => {
      const data = storeData as any;
      data[prop] = data[prop] ?? fetch();
      const all = await data[prop];
      const lights = predicate ? all.filter(predicate) : [...all];
      return lights;
    };

  const lights = resource<Light>('lights', () => fetchLights(client));
  const sensors = resource<Sensor>('sensors', () => fetchSensors(client));
  const groups = resource<Group>('groups', () => fetchGroups(client));

  return { lights, sensors, groups };
};
