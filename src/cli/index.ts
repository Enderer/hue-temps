import { CommanderError } from 'commander';
import { createApiClientProvider, createStore } from '../api/index.js';
import { loadConfig, resolveConfigPath } from '../shared/config.js';
import { createConnectionLoader } from '../shared/connection.js';
import { configureLogging, createLogger } from '../shared/logger.js';
import * as commands from './commands/index.js';

const logger = createLogger('cli.main');

export const main = async (argv: string[]) => {
  try {
    const configPath = resolveConfigPath(argv);
    const config = loadConfig(configPath);
    configureLogging(
      config.logging.level,
      config.logging.filePath,
      config.logging.maxSize,
      config.logging.maxFiles,
    );

    logger.info('Starting HueTemps CLI');
    const connectionLoader = createConnectionLoader(config);
    const provider = createApiClientProvider(connectionLoader);
    const store = createStore(provider);

    const program = commands.init();
    commands.list.init(store, program, config.zoneName);
    commands.alert.init(store, program);
    commands.connect.init(connectionLoader, program);

    await program.parseAsync(argv, { from: 'user' });
  } catch (error: any) {
    // Commander returned an success exit code. We can ignore the error and exit.
    const exitCode = Number.isInteger(error?.exitCode) ? error.exitCode : 1;
    if (error instanceof CommanderError && exitCode === 0) {
      const exitCode = error?.exitCode;
      process.exitCode = exitCode;
      return;
    }
    // An actual unhandled error occurred. Log it and exit with an error code.
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Unhandled error in CLI: ${message}`);
    console.error(message.trim());
    process.exitCode = Number.isInteger(exitCode) ? exitCode : 1;
  }
};
