import got, { Got } from 'got';

export interface ApiClient {
  get: <T>(resource: string) => Promise<Record<string, T>>;
  // put: <T, U>(resource: string, data: U) => Promise<T>;
  // post: <T, U>(resource: string, data: U) => Promise<T>;
  // delete: <T>(resource: string) => Promise<T>;
}

export const createApiClient = (ip: string, user: string): ApiClient => {
  const safeHost = sanitizeBridgeHost(ip);
  const safeUser = sanitizeUserToken(user);

  const api = got.extend({
    prefixUrl: `http://${safeHost}/api/${safeUser}`,
    responseType: 'json',
  });

  return {
    get: (resource) => get(api, resource),
  };
};

const get = async <T>(g: Got, resource: string): Promise<T> => {
  const safeResource = sanitizeResource(resource);
  const response = await g.get<T>(safeResource);
  return response as T;
};

const sanitizeBridgeHost = (value: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Bridge IP/host must be a non-empty string');
  }

  const trimmed = value.trim();

  // Disallow schemes or path characters to prevent injection into prefixUrl.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || /[\\/]/.test(trimmed)) {
    throw new Error('Bridge IP/host must not include a scheme or path');
  }

  // Allow IPv4 or hostnames (letters, digits, dots, hyphens).
  if (!/^[a-zA-Z0-9.-]+$/.test(trimmed)) {
    throw new Error('Bridge IP/host contains invalid characters');
  }

  return trimmed;
};

const sanitizeUserToken = (value: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('User token must be a non-empty string');
  }

  const trimmed = value.trim();

  // Limit to a safe token charset, then URI-encode for the path segment.
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new Error('User token contains invalid characters');
  }

  return encodeURIComponent(trimmed);
};

const sanitizeResource = (value: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Resource path must be a non-empty string');
  }

  const trimmed = value.trim();

  // Disallow absolute URLs when prefixUrl is set.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    throw new Error('Resource must be a relative path without a scheme');
  }

  // Normalize slashes and drop any leading slash to appease got prefixUrl.
  const normalized = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normalized === '' || normalized.includes('..')) {
    throw new Error('Invalid resource path');
  }

  // Encode each segment to avoid special characters breaking the URL.
  return normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};
