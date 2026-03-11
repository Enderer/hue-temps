import { createLogger } from '../shared/logger.js';
import { ApiClientProvider } from './client.js';

const logger = createLogger('api.fetchResource');

/** A Resource returned from the Hue api */
export interface Resource {
  id: string;
}

/** Fetches objects of a given entity type */
export interface Fetcher<T> {
  (predicate?: Filter<T>): Promise<T[]>;
}

/** Maps an object returned from API call to a resource */
export interface Mapper<T extends Resource> {
  (g: { id: string; o: unknown }): T;
}

/** Filters resources that should be returned */
export interface Filter<T> {
  (g: T): boolean;
}

/**
 * Creates a function that returns all objects of a given entity type
 * @param entity Name of the entity to retrieve
 * @param resource Name of the type of resource to return
 * @param mapper Mapper function to build the returned object from api response
 */
export const fetch = <T extends Resource, O = unknown>(
  resource: string,
  mapper: Mapper<T> = defaultMapper,
) => {
  return async (provider: ApiClientProvider): Promise<T[]> => {
    logger.debug(`Fetching resources for ${resource}`);
    const client = await provider();
    const response = await client.get<O>(`${resource}`);
    const objects = Object.entries(response).map(([id, o]) => ({ id, o }));
    const resources = objects.map((entry) => mapper(entry));
    logger.info(`Fetched ${resources.length} ${resource}`);
    return resources;
  };
};

const defaultMapper = <T extends Resource, O>({ id }: { id: string; o: O }): T => ({ id }) as T;
