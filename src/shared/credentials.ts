import keytar from 'keytar';

export type CredentialSource = 'env' | 'keychain';

export type CredentialResult = Credentials | undefined;

export interface Credentials {
  bridgeIp: string;
  user: string;
  source: CredentialSource;
}

export interface CredentialsOptions {
  envBridge: string;
  envUser: string;
  keychainService: string;
  keychainProfile: string;
}

/**
 * Load credentials for connecting to the Hue bridge for all possible sources.
 * @param options
 * @returns
 */
export const loadCredentials = async (options: CredentialsOptions): Promise<CredentialResult> => {
  // Try to load from environment variables
  const { envBridge, envUser } = options;
  const envCreds = await loadEnvCredentials(envBridge, envUser);
  if (envCreds) return envCreds;

  // Try to load from keychain
  const { keychainService, keychainProfile } = options;
  const keychainCreds = await loadKeystoreCredentials(keychainService, keychainProfile);
  if (keychainCreds) return keychainCreds;

  return undefined;
};

export const loadKeystoreCredentials = async (
  service: string,
  profile: string,
): Promise<CredentialResult> => {
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

export const loadEnvCredentials = (envBridge: string, envUser: string): CredentialResult => {
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
