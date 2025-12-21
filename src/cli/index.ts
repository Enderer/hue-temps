#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { Argument, Command } from 'commander';
import { createApiClient, createStore } from '../api/index.js';
import { loadConfig } from '../shared/config.js';
import { loadCredentials } from '../shared/credentials.js';
import { configureLogging, createLogger } from '../shared/logger.js';
import * as commands from './commands/index.js';
import { startRepl } from './repl.js';

const CONFIG_PATH = 'config.yaml';
const ZONE_NAME_DEFAULT = 'Hue Temps';

const ENV_BRIDGE = 'HUETEMPS_BRIDGE';
const ENV_USER = 'HUE  TEMPS_USER';
const KEYCHAIN_SERVICE = 'com.huetemps.cli';
const DEFAULT_PROFILE = 'home';

export const main = async (argv: string[]) => {
  let logConfigured = false;

  try {
    // Load bridge connection credentials
    const creds = await loadCredentials({
      envBridge: ENV_BRIDGE,
      envUser: ENV_USER,
      keychainService: KEYCHAIN_SERVICE,
      keychainProfile: DEFAULT_PROFILE,
    });
    if (creds == null) {
      throw new Error(`No credentials found.`);
    }
    const { bridgeIp, user } = creds;
    const client = createApiClient(bridgeIp, user);
    const store = createStore(client);

    // Load config settings
    const config = loadConfig(CONFIG_PATH);
    configureLogging(config.logging);
    logConfigured = true;
    const log = createLogger('cli.main');
    const tempsZone = config.zoneName ?? ZONE_NAME_DEFAULT;
    log.info(`CLI starting (zone=${tempsZone}, bridge=${bridgeIp})`);

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
      .action(commands.list(tempsZone, store));

    program
      .command('alert')
      .description('Make a light alert to help identify it')
      .addArgument(new Argument('lightId', 'ID of the light to alert'))
      .action(commands.alert(store));

    if (argv.length === 0) {
      await startRepl(program);
      return;
    }

    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    if (logConfigured) {
      const log = createLogger('cli.main');
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error(`Unhandled error in CLI: ${errorMsg}`);
    }
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
