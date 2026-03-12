import os from 'node:os';
import path from 'node:path';

export const isAbsolutePath = (value: string): boolean => path.isAbsolute(value);

export const resolveXdgDir = (value: string | undefined, fallback: string): string => {
  return value && isAbsolutePath(value) ? value : fallback;
};

const localAppData = (): string => {
  return process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local');
};

export const defaultConfigPath = (
  appId: string,
  appDirWindows: string,
  configFileName: string,
): string => {
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appId, configFileName);
    case 'win32':
      return path.join(localAppData(), appDirWindows, configFileName);
    default: {
      const configHome = resolveXdgDir(
        process.env.XDG_CONFIG_HOME,
        path.join(os.homedir(), '.config'),
      );
      return path.join(configHome, appId, configFileName);
    }
  }
};

export const defaultLogPath = (appId: string, appDirWindows: string): string => {
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Logs', appId, `${appId}.log`);
    case 'win32':
      return path.join(localAppData(), appDirWindows, 'logs', `${appId}.log`);
    default: {
      const stateHome = resolveXdgDir(
        process.env.XDG_STATE_HOME,
        path.join(os.homedir(), '.local', 'state'),
      );
      return path.join(stateHome, appId, 'logs', `${appId}.log`);
    }
  }
};
