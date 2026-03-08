import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGradientSvg, TITLE } from '../dist/src/cli/splash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const OUTPUT_PATH = path.join(repoRoot, 'assets', 'readme-splash.svg');

const WIDTH = 66;
const MIRED_START = 100;
const MIRED_END = 450;
const OFFSET = 0;

const run = async () => {
  console.log(TITLE);
  const svg = renderGradientSvg(TITLE, WIDTH, MIRED_START, MIRED_END, OFFSET);
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, svg, 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, OUTPUT_PATH)}`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
