import { ApiClient } from './client.js';

/** A Resource returned from the Hue api */
export interface Resource {
  id: string;
}

/** Function that maps a resource returned from the api to an object */
export interface ResourceMapper<T extends Resource, O> {
  (g: { id: string; o: O }): T;
}

/** Function that filters resources that should be returned */
export interface ResourceFilter<T> {
  (g: T): boolean;
}

/**
 * Creates a function that returns all objects of a given entity type
 * @param entity Name of the entity to retrieve
 * @param resource Name of the type of resource to return
 * @param mapper Mapper function to build the returned object from api response
 */
export const getResource = <T extends Resource, O = unknown>(
  resource: string,
  mapper: ResourceMapper<T, O> = defaultMapper,
  filter?: ResourceFilter<T>,
) => {
  return async (client: ApiClient): Promise<T[]> => {
    const response = await client.get<Record<string, O>>(`/${resource}`);
    const body = response.body;
    const objects = Object.entries(body).map(([id, o]) => ({ id, o }));
    const resources = objects.map((entry) => mapper(entry));
    const f = filter ?? defaultFilter;
    return resources.filter(f);
  };
};

const defaultMapper = <T extends Resource, O>({ id }: { id: string; o: O }): T => ({ id }) as T;

const defaultFilter = <T>(_: T): boolean => true;
