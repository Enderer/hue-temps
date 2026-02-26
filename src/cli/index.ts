#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { Argument, Command } from 'commander';
import { createApiClientProvider, createStore } from '../api/index.js';
import { loadConfig } from '../shared/config.js';
import { createConnectionLoader } from '../shared/connection.js';
import { configureLogging, createLogger } from '../shared/logger.js';
import * as commands from './commands/index.js';

const logger = createLogger('cli.main');

const CONFIG_PATH = 'config.yaml';

export const main = async (argv: string[]) => {
  const config = loadConfig(CONFIG_PATH);

  try {
    const connectionLoader = createConnectionLoader(config);
    const provider = createApiClientProvider(connectionLoader);
    const store = createStore(provider);

    // Load config settings
    configureLogging(config.logging);
    logger.info(`CLI starting. zone:${config.zoneName}`);

    // Setup CLI commands
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
      .action(commands.list(config.zoneName, store));

    program
      .command('alert')
      .description('Make a light alert to help identify it')
      .addArgument(new Argument('light', 'Id or name of the light to alert'))
      .action(commands.alert(store));

    commands.connect.init(connectionLoader, program);

    await program.parseAsync(argv, { from: 'user' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    const exitCode = error?.exitCode ?? 1;
    logger.error(`Unhandled error in CLI: ${message}`);
    console.error(message.trim());
    process.exitCode = Number.isInteger(exitCode) ? exitCode : 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main(process.argv.slice(2));
}
