import { ApiClientProvider } from './client.js';
import { Group, mapGroup } from './fetch-groups.js';
import { Light, mapLight } from './fetch-lights.js';
import { fetch, Fetcher, Filter, Mapper, Resource } from './fetch-resource.js';
import { mapSensors as mapSensor, Sensor } from './fetch-sensors.js';

/**
 * Central store to access lights and other resources.
 */
export interface Store {
  lights: Fetcher<Light>;
  sensors: Fetcher<Sensor>;
  groups: Fetcher<Group>;
  apiProvider: ApiClientProvider;
}

export type StoreKey = 'lights' | 'sensors' | 'groups';

export const createStore = (apiProvider: ApiClientProvider): Store => {
  const lights = createResource<Light>(apiProvider, 'lights', mapLight);
  const sensors = createResource<Sensor>(apiProvider, 'sensors', mapSensor);
  const groups = createResource<Group>(apiProvider, 'groups', mapGroup);
  return { lights, sensors, groups, apiProvider };
};

/**
 * Creates a function that returns all objects of a given entity type.
 * Built in caching to avoid fetching the same data multiple times.
 * @param apiProvider Provides client to fetch data from the API
 * @param key Key of the store to fetch ('lights', 'groups', or 'sensors')
 * @param mapper Mapper function to build the returned object from api response
 */
export const createResource = <T extends Resource>(
  apiProvider: ApiClientProvider,
  key: StoreKey,
  mapper: Mapper<T>,
): Fetcher<T> => {
  let promise: Promise<T[]> | undefined;
  const fetcher = fetch(key, mapper);
  return async (predicate?: Filter<T>) => {
    if (promise == null) {
      promise = fetcher(apiProvider);
    }
    const rows = await promise;
    const resource = predicate ? rows.filter(predicate) : [...rows];
    return resource;
  };
};
