import assert from 'node:assert/strict';
import { Command } from 'commander';
import { afterEach, describe, it, vi } from 'vitest';
import { init } from './init.js';
import { renderSplash } from '../splash.js';

const SPLASH_START = 150;
const SPLASH_END = 440;
const SPLASH_WIDTH = 69;
const SPLASH_OFFSET = 20;

describe('init root command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates Command and applies the expected chained calls', () => {
    const callOrder: string[] = [];
    let exitReceiver: Command | undefined;

    const name = vi.spyOn(Command.prototype, 'name').mockImplementation(function (
      this: Command,
      value: string,
    ) {
      callOrder.push(`name:${value}`);
      return this;
    });

    const description = vi.spyOn(Command.prototype, 'description').mockImplementation(function (
      this: Command,
      value: string,
    ) {
      callOrder.push(`description:${value}`);
      return this;
    });

    const showHelpAfterError = vi
      .spyOn(Command.prototype, 'showHelpAfterError')
      .mockImplementation(function (this: Command) {
        callOrder.push('showHelpAfterError');
        return this;
      });

    const action = vi.spyOn(Command.prototype, 'action').mockImplementation(function (
      this: Command,
      fn: unknown,
    ) {
      callOrder.push('action');
      assert.equal(typeof fn, 'function');
      return this;
    });

    const exitOverride = vi.spyOn(Command.prototype, 'exitOverride').mockImplementation(function (
      this: Command,
    ) {
      callOrder.push('exitOverride');
      exitReceiver = this;
      return this;
    });

    const program = init();

    assert.ok(program instanceof Command);
    assert.equal(program, exitReceiver);

    assert.equal(name.mock.calls.length, 1);
    assert.equal(name.mock.calls[0][0], 'huetemps');

    assert.equal(description.mock.calls.length, 1);
    assert.equal(description.mock.calls[0][0], 'Control Hue lights from the terminal');

    assert.equal(showHelpAfterError.mock.calls.length, 1);
    assert.equal(action.mock.calls.length, 1);
    assert.equal(exitOverride.mock.calls.length, 1);

    assert.deepEqual(callOrder, [
      'name:huetemps',
      'description:Control Hue lights from the terminal',
      'showHelpAfterError',
      'action',
      'exitOverride',
    ]);
  });

  it('prints splash and help when run with no args', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const outputHelpSpy = vi.spyOn(Command.prototype, 'outputHelp').mockImplementation(function (
      this: Command,
    ) {
      return this;
    });

    const program = init();
    await program.parseAsync([], { from: 'user' });

    assert.equal(logSpy.mock.calls.length, 1);
    assert.equal(
      logSpy.mock.calls[0][0],
      renderSplash(SPLASH_WIDTH, SPLASH_START, SPLASH_END, SPLASH_OFFSET),
    );
    assert.equal(outputHelpSpy.mock.calls.length, 1);
  });
});
