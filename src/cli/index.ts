#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { Argument, Command } from 'commander';
import { createApiClient, createStore } from '../api/index.js';
import { loadConfig } from '../shared/config.js';
import * as commands from './commands/index.js';
import { startRepl } from './repl.js';

const CONFIG_PATH = './config.yaml';

export const buildProgram = () => {
  const config = loadConfig(CONFIG_PATH);
  const { bridgeIp, user } = config.connect;
  const store = createStore(createApiClient(bridgeIp, user));

  const program = new Command();

  program
    .name('huetemps')
    .description('Control Hue lights from the terminal')
    .showHelpAfterError()
    .exitOverride();

  program.configureOutput({
    outputError: (message) => {
      console.error(message.trim());
    },
  });

  program
    .command('refresh')
    .description('Clear cached data and fetch updated records')
    .action(() => {
      console.log('refresh command received');
    });

  program
    .command('list')
    .description('List lights, groups, sensors, or temps')
    .addArgument(
      new Argument('[target]', commands.listTargets.join(' | '))
        .choices(commands.listTargets)
        .default('all'),
    )
    .action(commands.list(store));
  return program;
};

export const main = async (argv: string[]) => {
  const program = buildProgram();

  if (argv.length === 0) {
    await startRepl(program);
    return;
  }

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    const exitCode =
      typeof error === 'object' && error !== null && 'exitCode' in error
        ? Number((error as { exitCode?: number }).exitCode ?? 1)
        : 1;

    const message = error instanceof Error ? error.message : String(error);
    console.error(message.trim());
    process.exitCode = Number.isInteger(exitCode) ? exitCode : 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main(process.argv.slice(2));
}
