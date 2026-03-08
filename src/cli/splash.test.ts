import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderGradientSvg, renderSplash } from './splash.js';

const stripAnsi = (value: string): string => value.replace(/\u001B\[[0-9;]*m/g, '');

const SPLASH_WIDTH = 70;
const SPLASH_START = 100;
const SPLASH_END = 450;
const SPLASH_OFFSET = 0;

describe('renderSplash', () => {
  it('renders a boxed title with tagline', () => {
    const out = renderSplash(SPLASH_WIDTH, SPLASH_START, SPLASH_END, SPLASH_OFFSET);
    const plain = stripAnsi(out);

    assert.ok(plain.split('\n').length > 5);

    // Border glyph styles can vary, so check key content.
    assert.ok(plain.includes('_   _           _____'));
    assert.ok(plain.includes('| |_| | | | |/ _ \\| |/ _ \\'));
    assert.ok(plain.includes('Your terminal-powered cockpit'));
    assert.ok(plain.includes('perfectly tuned Hue lighting'));
    assert.ok(plain.includes('█'));
    assert.equal(plain.includes('magical'), false);
  });
});

describe('renderGradientSvg', () => {
  it('renders SVG and escapes XML-sensitive characters', () => {
    const text = `A & < > " '\r\n B`;
    const out = renderGradientSvg(text, 0, SPLASH_START, SPLASH_END, SPLASH_OFFSET);

    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(out.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(out.includes('&amp;'));
    assert.ok(out.includes('&lt;'));
    assert.ok(out.includes('&gt;'));
    assert.ok(out.includes('&quot;'));
    assert.ok(out.includes('&apos;'));
    assert.ok(out.includes('&#160;'));
  });

  it('uses the gradient width when it exceeds text width', () => {
    const out = renderGradientSvg('ab', 10, SPLASH_START, SPLASH_END, SPLASH_OFFSET);

    // width = ceil((paddingX*2) + (maxChars*charWidth)) = ceil(32 + (10*8.4)) = 116
    assert.ok(out.includes('width="116"'));
    assert.ok(out.includes('viewBox="0 0 116'));
    assert.ok(out.includes('fill="#0f1115"'));
    assert.ok(out.includes('aria-label="HueTemps splash banner"'));
  });
});
