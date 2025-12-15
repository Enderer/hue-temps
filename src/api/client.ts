import got, { Got } from 'got';

export interface ApiClient {
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
    get: (resource) => get(api, resource),
  };
};

const get = async <T>(g: Got, resource: string): Promise<T> => {
  const response = await g.get<T>(resource);
  return response as T;
};
