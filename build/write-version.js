import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(moduleDir, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version ?? '0.0.0';

const versionFilePath = resolve(moduleDir, '../dist/src/cli/commands/version.js');
const versionFile = readFileSync(versionFilePath, 'utf8');
const versionPattern = /export const CLI_VERSION = ['\"].*['\"];/g;
const matches = versionFile.match(versionPattern) ?? [];
if (matches.length !== 1) {
  throw new Error(
    `[write-version] expected exactly one CLI_VERSION declaration in ${versionFilePath}, found ${matches.length}`,
  );
}
const versionReplace = `export const CLI_VERSION = '${version}';`;
const updatedVersionFile = versionFile.replace(versionPattern, versionReplace);
writeFileSync(versionFilePath, updatedVersionFile, 'utf8');
console.log(`[write-version] wrote version '${version}' to ${versionFilePath}`);
