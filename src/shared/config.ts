import fs from 'node:fs';
import YAML from 'yaml';

export interface HueTempsConfig {
  zoneName?: string;
}

export const loadConfig = (configPath: string): HueTempsConfig => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  const parsed = YAML.parse(fileContents) ?? {};

  return { zoneName: parsed.zoneName };
};
