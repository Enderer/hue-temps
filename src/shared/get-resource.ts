import { AxiosInstance } from 'axios';

/** A Resource returned from the Hue api */
export interface Resource {
  id: string;
}

/** Function that maps a resource returned from the api to an object */
export interface ResourceMapper<T extends Resource, O> {
  (g: { id: string, o: O }): T
}

/** Function that filters resources that should be returned */
export interface ResourceFilter<T> {
  (g: T): boolean
}

/**
 * Creates a function that returns all objects of a given entity type
 * @param entity Name of the entity to retrieve
 * @param resource Name of the type of resource to return
 * @param mapper Mapper function to build the returned object from api response
 */
export const getResource = <T extends Resource, O = any>(
  resource: string,
  mapper: ResourceMapper<T, O> = defaultMapper,
  filter?: ResourceFilter<T>
) => {
  return async (client: AxiosInstance): Promise<T[]> => {
    const { data } = await client.get(`/${resource}`);
    const objects = Object.entries(data).map(([id, o]) => ({ id, o: o as O }));
    const resources = objects.map(o => mapper(o));
    const f = filter ?? defaultFilter;
    const filteredResources = resources.filter(f);
    return filteredResources;
  };
};

const defaultMapper = <T>(e: unknown): T => e as T;

const defaultFilter = <T>(e: T): boolean => true;
