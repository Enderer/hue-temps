import got, { Got } from 'got';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('api.client');

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

const get = async <T>(g: Got, resource: string): Promise<T> => {
  const response = await g.get<T>(resource);
  return response as T;
};

const alert = async (g: Got, lightId: string): Promise<boolean> => {
  logger.info(`Alert light start ${lightId}`);
  const options = { json: { alert: 'select' } };
  const result = await g.put<void>(`lights/${lightId}/state`, options);
  const { statusCode, statusMessage, body } = result;
  logger.info(`Alert light complete ${lightId}: ${{ statusCode, statusMessage, body }}`);
  return true;
};
