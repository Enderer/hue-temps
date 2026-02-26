import got, { Got } from 'got';
import { ConnectionLoader } from '../shared/connection.js';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('api.client');

/**
 * API client for the Hue bridge.
 * Provides methods to interact with the bridge and its resources.
 */
export interface ApiClient {
  alert: (lightId: string) => Promise<boolean>;
  get: <T>(resource: string) => Promise<Record<string, T>>;
  // put: <T, U>(resource: string, data: U) => Promise<T>;
  // post: <T, U>(resource: string, data: U) => Promise<T>;
  // delete: <T>(resource: string) => Promise<T>;
}

export const createApiClient = (ip: string, user: string): ApiClient => {
  const api = got.extend({
    prefixUrl: `http://${ip}/api/${user}`,
    responseType: 'json',
  });

  return {
    alert: (lightId: string) => alert(api, lightId),
    get: (resource) => get(api, resource),
  };
};

const get = async <T>(g: Got, resource: string): Promise<Record<string, T>> => {
  const response = await g.get<Record<string, T>>(resource);
  return response.body;
};

const alert = async (g: Got, lightId: string): Promise<boolean> => {
  logger.info(`Alert light start ${lightId}`);
  const options = { json: { alert: 'select' } };
  const result = await g.put<void>(`lights/${lightId}/state`, options);
  const { statusCode, statusMessage, body } = result;
  logger.info(`Alert light complete ${lightId}: ${{ statusCode, statusMessage, body }}`);
  return true;
};

/**
 * Provider for the API client
 * Loads connection info and creates the client on demand.
 */
export interface ApiClientProvider {
  (): Promise<ApiClient>;
}

export const createApiClientProvider = (connectionLoader: ConnectionLoader): ApiClientProvider => {
  let client: ApiClient | undefined;

  return async () => {
    // Connection already exists, return it
    if (client) return client;

    // Load connection details and create client
    const connection = await connectionLoader.load();
    if (!connection) throw new Error('No connection info found for Hue bridge');
    client = createApiClient(connection.bridge, connection.user);
    return client;
  };
};
