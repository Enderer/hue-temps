import chalk from 'chalk';
import * as color from '../shared/color.js';
import { CLI_VERSION } from '../shared/version.js';

const VERSION_OFFSET = 2;

const TITLE_LINES = [
  '╔════════════════════════════════════════════════════════════════════╗',
  '║                                                          __        ║',
  '║     _   _           _____                             ."`  `".     ║',
  '║    | | | |_   _  __|_   _|__ _ __ ___  _ __  ___     /   /\\   \\    ║',
  "║    | |_| | | | |/ _ \\| |/ _ \\ '_ ` _ \\| '_ \\/ __|   |    \\/    |   ║",
  '║    |  _  | |_| |  __/| |  __/ | | | | | |_) \\__ \\    \\   ()   /    ║',
  "║    |_| |_|\\__,_|\\___||_|\\___|_| |_| |_| .__/|___/     '.____.'     ║",
  '║                                       |_|              {_.="}      ║',
  '║                                                        {_.="}      ║',
  '║    Your terminal-powered cockpit for                   `-..-`      ║',
  '║    perfectly tuned Hue lighting                                    ║',
  '║                                                                    ║',
  '╚════════════════════════════════════════════════════════════════════╝',
];

/**
 * Generate a colorful splash screen with the app title
 */
export const renderSplash = (
  width: number,
  miredStart: number,
  miredEnd: number,
  offset: number,
): string => {
  // Add the version number to the title
  const versionLength = CLI_VERSION.length + 3;
  const lines = [...TITLE_LINES];
  const vStart = -(versionLength + VERSION_OFFSET);
  const vEnd = -VERSION_OFFSET;
  lines[0] = lines[0].slice(0, vStart) + ` v${CLI_VERSION} ` + lines[0].slice(vEnd);
  const splash = lines.join('\n');
  const bar = renderBar(width, miredStart, miredEnd, offset);
  const coloredSplash = colorizeText(width, miredStart, miredEnd, offset, splash);
  return `${coloredSplash} \n ${bar}\n`;
};

/**
 * Colorize text by applying a gradient based on position.
 * The gradient is defined by a start and end mired values.
 * @param width Number of characters wide the gradient should span
 * @param miredStart Mired value at the start of the gradient
 * @param miredEnd Mired value at the end of the gradient
 * @param text The text to colorize
 * @returns The input text with ANSI color codes applied to create a gradient effect
 */
const colorizeText = (
  width: number,
  miredStart: number,
  miredEnd: number,
  offset: number,
  text: string,
) => {
  const lines = text.split('\n');
  const result: string[] = lines.map((line: string) => {
    const coloredChars = [];
    for (let i = 0; i < line.length; i++) {
      const mired = getTempAtPosition(width, miredStart, miredEnd, offset, i);
      const rgb = color.miredToRGB(mired);
      const outChar = chalk.rgb(rgb.r, rgb.g, rgb.b)(line[i]);
      coloredChars.push(outChar);
    }
    return coloredChars.join('');
  });
  return result.join('\n');
};

/**
 * Render a horizontal bar of characters colored with a gradient based on position.
 * @param n Number of characters in the bar
 * @param miredStart Mired value at the start of the gradient
 * @param miredEnd Mired value at the end of the gradient
 * @param char Character to repeat for the bar (default: '█')
 * @returns A string of length n with ANSI color codes applied to create a gradient effect
 */
export const renderBar = (
  n: number,
  miredStart: number,
  miredEnd: number,
  offset: number,
  char = '█',
) => {
  const barChars = [];
  for (let i = 0; i < n; i++) {
    const mired = getTempAtPosition(n, miredStart, miredEnd, offset, i);
    const rgb = color.miredToRGB(mired);
    const outChar = chalk.rgb(rgb.r, rgb.g, rgb.b)(char);
    barChars.push(outChar);
  }
  const bar = barChars.join('');
  return bar;
};

/**
 * Get the mired value at a specific position in a gradient.
 * @param n Total number of positions in the gradient
 * @param tempStart Mired value at the start of the gradient
 * @param tempEnd Mired value at the end of the gradient
 * @param pos The position to get the mired value for (0-based index)
 * @returns The mired value corresponding to the given position in the gradient
 */
const getTempAtPosition = (
  n: number,
  tempStart: number,
  tempEnd: number,
  offset: number,
  pos: number,
) => {
  if (n <= 1) {
    return tempStart;
  }
  const delta = (tempEnd - tempStart) / (n - offset - 1);
  pos = Math.max(0, pos - offset);
  let temp = tempStart + delta * pos;
  temp = Math.min(temp, Math.max(tempStart, tempEnd));
  temp = Math.max(temp, Math.min(tempStart, tempEnd));
  return temp;
};

/**
 * Render splash page title as an SVG using the same per-character mired gradient
 * as the terminal splash renderer. This is suitable for README/Docs images.
 */
export const renderGradientSvg = (
  text: string,
  width: number,
  miredStart: number,
  miredEnd: number,
  offset: number,
): string => {
  const {
    background = '#0f1115',
    fontFamily = '"Cascadia Mono", "Consolas", monospace',
    fontSize = 14,
    lineHeight = 18,
    charWidth = 8.4,
    paddingX = 16,
    paddingY = 16,
    cornerRadius = 8,
  } = {};

  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const effectiveWidth = Math.max(1, width);
  const maxChars = Math.max(...lines.map((line) => line.length), effectiveWidth);
  const svgWidth = Math.ceil(paddingX * 2 + maxChars * charWidth);
  const svgHeight = Math.ceil(paddingY * 2 + lines.length * lineHeight);

  const textNodes = lines
    .map((line, lineIdx) => {
      const y = paddingY + fontSize + lineIdx * lineHeight;
      const spans = line
        .split('')
        .map((ch, i) => {
          const mired = getTempAtPosition(effectiveWidth, miredStart, miredEnd, offset, i);
          const rgb = color.miredToRGB(mired);
          return `<tspan fill="rgb(${rgb.r},${rgb.g},${rgb.b})">${escapeXml(ch)}</tspan>`;
        })
        .join('');
      return `<text x="${paddingX}" y="${y}" font-family='${fontFamily}' font-size="${fontSize}" xml:space="preserve">${spans}</text>`;
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="HueTemps splash banner">
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${background}" />
  ${textNodes}
</svg>
`;
};

const escapeXml = (ch: string): string => {
  if (ch === ' ') return '&#160;';
  if (ch === '&') return '&amp;';
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  if (ch === '"') return '&quot;';
  if (ch === "'") return '&apos;';
  return ch;
};

// for (let mired = 153; mired <= 454; mired += 20) {
//   const kelvin = color.miredToKelvin(mired);
//   const rgb = color.miredToRGB(mired);
//   console.log(
//     chalk.rgb(rgb.r, rgb.g, rgb.b)('███'),
//     `${kelvin} K \t ${mired} \t (${rgb.r}, ${rgb.g}, ${rgb.b})`,
//   );
// }
