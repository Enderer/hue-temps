import fs from 'node:fs';
import YAML from 'yaml';

export interface ConnectConfig {
  bridgeIp: string;
  user: string;
}

export interface HueTempsConfig {
  connect: ConnectConfig;
}

export const loadConfig = (configPath: string): HueTempsConfig => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const parsed = YAML.parse(fileContents) ?? {};

  return {
    connect: parsed.connect as ConnectConfig,
  } satisfies HueTempsConfig;
};