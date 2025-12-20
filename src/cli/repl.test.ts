import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { afterEach, describe, it, mock } from 'node:test';
import { Command } from 'commander';
import { configureLogging } from '../shared/logger.js';
import { startRepl } from './repl.js';

const makeMockRl = (lines: string[]) => {
  const prompts: string[] = [];
  const rl = {
    prompt: mock.fn(() => {
      prompts.push('prompted');
    }),
    close: mock.fn(() => {}),
    [Symbol.asyncIterator]: async function* () {
      for (const line of lines) {
        yield line;
      }
    },
  } as any;
  return { rl, prompts } as const;
};

describe('startRepl', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('handles help, runs commands, logs errors, and exits on exit', async () => {
    try {
      configureLogging({
        level: 'error',
        filePath: path.join(os.tmpdir(), 'huetemps', 'test.log'),
        maxSize: '1m',
        maxFiles: '1d',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been configured')) {
        throw error;
      }
    }

    const { rl } = makeMockRl(['help', 'cmd arg1 arg2', 'fail', 'exit']);
    mock.method(readline, 'createInterface', () => rl);

    const logSpy = mock.method(console, 'log', () => {});
    const errorSpy = mock.method(console, 'error', () => {});

    const program = {
      helpInformation: () => 'HELP INFO\n',
      parseAsync: mock.fn(async (args: string[], opts: { from: string }) => {
        assert.equal(opts.from, 'user');
        if (args[0] === 'fail') {
          throw new Error('boom');
        }
      }),
    } as unknown as Command;

    await startRepl(program);

    // welcome message + help info + final table output logs
    assert.ok(logSpy.mock.calls.some((c) => String(c.arguments[0]).includes('Interactive mode')));
    assert.ok(logSpy.mock.calls.some((c) => c.arguments[0] === 'HELP INFO'));

    // command parsed with args
    const parseCalls = program.parseAsync as any;
    assert.equal(parseCalls.mock.calls.length, 2);
    assert.deepEqual(parseCalls.mock.calls[0].arguments[0], ['cmd', 'arg1', 'arg2']);
    assert.deepEqual(parseCalls.mock.calls[1].arguments[0], ['fail']);

    // error from failing command is logged
    assert.ok(errorSpy.mock.calls.some((c) => String(c.arguments[0]).includes('boom')));

    // REPL closed
    assert.equal(rl.close.mock.calls.length, 1);
  });
});
