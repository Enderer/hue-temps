import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { Command } from 'commander';
import { init } from './init.js';

describe('init root command', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('creates Command and applies the expected chained calls', () => {
    const callOrder: string[] = [];
    let exitReceiver: Command | undefined;

    const name = mock.method(Command.prototype, 'name', function (this: Command, value: string) {
      callOrder.push(`name:${value}`);
      return this;
    });

    const description = mock.method(
      Command.prototype,
      'description',
      function (this: Command, value: string) {
        callOrder.push(`description:${value}`);
        return this;
      },
    );

    const showHelpAfterError = mock.method(
      Command.prototype,
      'showHelpAfterError',
      function (this: Command) {
        callOrder.push('showHelpAfterError');
        return this;
      },
    );

    const exitOverride = mock.method(Command.prototype, 'exitOverride', function (this: Command) {
      callOrder.push('exitOverride');
      exitReceiver = this;
      return this;
    });

    const program = init();

    assert.ok(program instanceof Command);
    assert.equal(program, exitReceiver);

    assert.equal(name.mock.calls.length, 1);
    assert.equal(name.mock.calls[0].arguments[0], 'huetemps');

    assert.equal(description.mock.calls.length, 1);
    assert.equal(description.mock.calls[0].arguments[0], 'Control Hue lights from the terminal');

    assert.equal(showHelpAfterError.mock.calls.length, 1);
    assert.equal(exitOverride.mock.calls.length, 1);

    assert.deepEqual(callOrder, [
      'name:huetemps',
      'description:Control Hue lights from the terminal',
      'showHelpAfterError',
      'exitOverride',
    ]);
  });
});
