import { createApiClientProvider, createStore } from '../api/index.js';
import { loadConfig } from '../shared/config.js';
import { createConnectionLoader } from '../shared/connection.js';
import { configureLogging, createLogger } from '../shared/logger.js';
import * as commands from './commands/index.js';

const logger = createLogger('cli.main');

const CONFIG_PATH = 'config.yaml';

export const main = async (argv: string[]) => {
  try {
    // Load config and initialize logging
    const config = loadConfig(CONFIG_PATH);
    configureLogging(config.logging);

    // Initialize API client and shared dependencies
    logger.info(`Starting HueTemps CLI`);
    const connectionLoader = createConnectionLoader(config);
    const provider = createApiClientProvider(connectionLoader);
    const store = createStore(provider);
    logger.info(`CLI starting. zone:${config.zoneName}`);

    // Setup commands
    const program = commands.init();
    commands.list.init(store, program, config.zoneName);
    commands.alert.init(store, program);
    commands.connect.init(connectionLoader, program);

    // Run the CLI
    await program.parseAsync(argv, { from: 'user' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    const exitCode = error?.exitCode ?? 1;
    logger.error(`Unhandled error in CLI: ${message}`);
    console.error(message.trim());
    process.exitCode = Number.isInteger(exitCode) ? exitCode : 1;
  }
};
