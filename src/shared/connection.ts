import enquirer from 'enquirer';
import keytar from 'keytar';

export interface Connection {
  bridgeIp: string;
  user: string;
  source: ConnectionSource;
}

export type ConnectionSource = 'env' | 'keychain';

export interface ConnectionOptions {
  envBridge: string;
  envUser: string;
  keystoreService: string;
  keystoreProfile: string;
}

export interface ConnectionLoader {
  load: () => Promise<Connection | undefined>;
  save: (bridgeIp: string, user: string) => Promise<void>;
}

/**
 * Loads and saves connection info for the Hue bridge.
 * @param options Options for how to load and save connection info
 */
export const createConnectionLoader = (options: ConnectionOptions): ConnectionLoader => {
  const save = async (bridge: string, user: string) => saveConnection(options, bridge, user);
  const load = async () => loadConnection(options);
  return { load, save };
};

/**
 * Load connection to the Hue bridge for all possible sources.
 * @param options
 */
export const loadConnection = async (
  options: ConnectionOptions,
): Promise<Connection | undefined> => {
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
): Promise<Connection | undefined> => {
  try {
    const account = `profile:${profile}:connect`;
    const stored = await keytar.getPassword(service, account);
    if (stored == null) {
      return undefined;
    }

    const parsed = JSON.parse(stored);
    const bridgeIp = parsed?.bridgeIp?.trim() ?? '';
    const user = parsed?.user?.trim() ?? '';
    if (!(bridgeIp && user)) {
      return undefined;
    }
    return { bridgeIp, user, source: 'keychain' };
  } catch {
    return undefined;
  }
};

/**
 * Load connection info from environment variables
 * @param envBridge Name of the environment variable for the bridge IP
 * @param envUser Name of the environment variable for the user token
 */
export const loadFromEnv = (envBridge: string, envUser: string): Connection | undefined => {
  try {
    const bridgeIp = process.env[envBridge]?.trim() ?? '';
    const user = process.env[envUser]?.trim() ?? '';
    if (!(bridgeIp && user)) {
      return undefined;
    }
    return { bridgeIp, user, source: 'env' };
  } catch {
    return undefined;
  }
};

export const saveConnection = async (
  options: ConnectionOptions,
  bridgeIp: string,
  user: string,
): Promise<void> => {
  const { keystoreService: keychainService, keystoreProfile: keychainProfile } = options;
  const account = `profile:${keychainProfile}:connect`;
  const payload = JSON.stringify({ bridgeIp, user });
  await keytar.setPassword(keychainService, account, payload);
};

// Prompt for Connection Details
const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const userTokenRegex = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;
const isValidIp = (value: string): boolean => ipv4Regex.test(value);
const isValidUserToken = (value: string): boolean => userTokenRegex.test(value);

export const promptForConnection = async (): Promise<{ bridgeIp: string; user: string }> => {
  while (true) {
    const { Form } = enquirer as unknown as {
      Form: new <T>(opts: any) => { run: () => Promise<T> };
    };
    const form = new Form<{ bridgeIp: string; userToken: string }>({
      name: 'bridgeCreds',
      message: 'Enter Hue bridge credentials',
      align: 'left',
      choices: [
        { name: 'bridgeIp', message: 'Bridge IP (e.g. 192.168.1.2)' },
        { name: 'userToken', message: 'User token (Hue username)' },
      ],
    });

    const result = await form.run();
    const bridgeIp = result.bridgeIp?.trim();
    const userToken = result.userToken?.trim();

    if (!bridgeIp || !isValidIp(bridgeIp)) {
      console.error('Invalid bridge IP. Please enter a valid IPv4 address.');
      continue;
    }
    if (!userToken || !isValidUserToken(userToken)) {
      console.error('Invalid user token. Expected 10-64 alphanumeric characters.');
      continue;
    }

    return { bridgeIp, user: userToken };
  }
};
