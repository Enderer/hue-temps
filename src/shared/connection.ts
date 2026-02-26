import keytar from 'keytar';

export interface Connection {
  bridge: string;
  user: string;
  source: ConnectionSource;
}

export type ConnectionSource = 'env' | 'keystore';

export interface ConnectionOptions {
  envBridge: string;
  envUser: string;
  keystoreService: string;
  keystoreProfile: string;
}

export interface ConnectionLoader {
  load: () => Promise<Connection | undefined>;
  list: () => Promise<Partial<Connection> | undefined>;
  setBridge: (bridge: string) => Promise<void>;
  setUser: (user: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Loads and saves connection info for the Hue bridge.
 * @param options Options for how to load and save connection info
 */
export const createConnectionLoader = (options: ConnectionOptions): ConnectionLoader => {
  const load = async () => loadConnection(options);
  const list = async () => listConnection(options);
  const setBridge = async (v: string) => setConnection(options, 'bridge', v);
  const setUser = async (v: string) => setConnection(options, 'user', v);
  const clear = async () => clearConnection(options);
  return { load, list, setBridge, setUser, clear };
};

/**
 * Load and validate connection info
 */
export const loadConnection = async (
  options: ConnectionOptions,
): Promise<Connection | undefined> => {
  const connection = await listConnection(options);
  const bridge = connection?.bridge;
  const user = connection?.user;
  if (bridge == null && user == null) {
    return undefined;
  }
  if (bridge == null || user == null) {
    throw new Error('Both bridge and user are required for a valid connection.');
  }
  validateBridge(bridge);
  validateUser(user);

  return connection as Connection;
};

/**
 * Return raw saved values for connection info
 */
export const listConnection = async (
  options: ConnectionOptions,
): Promise<Partial<Connection> | undefined> => {
  // Environment variables
  const { envBridge, envUser } = options;
  const envCreds = await loadFromEnv(envBridge, envUser);
  if (envCreds) return envCreds;

  // OS keystore
  const { keystoreService, keystoreProfile } = options;
  const keychainCreds = await loadFromKeystore(keystoreService, keystoreProfile);
  if (keychainCreds) return keychainCreds;

  return undefined;
};

/**
 * Load connection info from the OS keychain
 * @param service Name of the keychain service
 * @param profile Profile name within the keychain
 */
export const loadFromKeystore = async (
  service: string,
  profile: string,
): Promise<Partial<Connection> | undefined> => {
  // Load connection from keystore
  const bridgeAccount = getAccount(profile, 'bridge');
  const bridgeVal = await keytar.getPassword(service, bridgeAccount);
  const userAccount = getAccount(profile, 'user');
  const userVal = await keytar.getPassword(service, userAccount);
  const bridge = bridgeVal?.trim() ?? undefined;
  const user = userVal?.trim() ?? undefined;
  if (bridge == null && user == null) {
    return undefined;
  }
  return { bridge, user, source: 'keystore' };
};

/**
 * Load connection info from environment variables
 * @param envBridge Name of the environment variable for the bridge IP
 * @param envUser Name of the environment variable for the user token
 */
export const loadFromEnv = async (
  envBridge: string,
  envUser: string,
): Promise<Partial<Connection> | undefined> => {
  const bridge = process.env[envBridge]?.trim() ?? undefined;
  const user = process.env[envUser]?.trim() ?? undefined;
  if (bridge == null && user == null) {
    return undefined;
  }
  return { bridge, user, source: 'env' };
};

/**
 * Set connection info to the OS keychain
 * @param options Options for how to save connection info
 * @param bridge IP address of the Hue bridge
 * @param user User token for the Hue bridge API
 */
export const setConnection = async (
  options: ConnectionOptions,
  field: string,
  value: string,
): Promise<void> => {
  const { keystoreService, keystoreProfile } = options;
  field = (field ?? '').trim();
  value = (value ?? '').trim();
  const account = getAccount(keystoreProfile, field);

  if (field === 'bridge') {
    validateBridge(value);
  } else if (field === 'user') {
    validateUser(value);
  } else {
    throw new Error(`Invalid field. Expected 'bridge' or 'user'.`);
  }
  await keytar.setPassword(keystoreService, account, value);
};

/**
 * Delete connection info from the OS keychain
 */
export const clearConnection = async (options: ConnectionOptions): Promise<void> => {
  const { keystoreService, keystoreProfile } = options;
  const bridgeAccount = getAccount(keystoreProfile, 'bridge');
  const userAccount = getAccount(keystoreProfile, 'user');
  await keytar.deletePassword(keystoreService, bridgeAccount);
  await keytar.deletePassword(keystoreService, userAccount);
};

const getAccount = (profile: string, field: string) => `profile:${profile}:connect:${field}`;

const validateBridge = (bridge: string): boolean => {
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  if (!ipv4Regex.test(bridge)) {
    throw new Error(`Invalid bridge IP address. Expected IPv4 format.`);
  }
  return true;
};

const validateUser = (user: string): boolean => {
  const userRegex = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;
  if (!userRegex.test(user)) {
    throw new Error(`Invalid user token.`);
  }
  return true;
};
