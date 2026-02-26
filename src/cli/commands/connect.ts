import { Argument, Command } from 'commander';
import { ConnectionLoader } from '../../shared/connection.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('commands.connect');

type ConnectTarget = 'bridge' | 'user';

/**
 * Register the connection management commands to the CLI program.
 * @param loader ConnectionLoader instance to manage connection info
 * @param program Commander program to register commands to
 */
export const init = (loader: ConnectionLoader, program: Command) => {
  const commandConnect = program
    .command('connect')
    .description('Manage Hue bridge connection credentials');

  const commandSet = commandConnect
    .command('set')
    .description('Set connection bridge or user token');

  commandSet
    .command('bridge')
    .description('Set bridge IP/host')
    .addArgument(new Argument('<ipOrHost>', 'Bridge IPv4 address or host name'))
    .action(connectSet(loader, 'bridge'));

  commandSet
    .command('user')
    .description('Set connection user token')
    .addArgument(new Argument('<token>', 'Hue bridge user token'))
    .action(connectSet(loader, 'user'));

  commandConnect
    .command('list')
    .description('List stored connection info')
    .action(() => connectList(loader));

  commandConnect
    .command('clear')
    .description('Clear stored bridge/user values from OS keystore')
    .action(connectClear(loader));
};

/**
 * Action handler for 'connect set' command. Validates input and saves to keystore.
 */
export const connectSet = (loader: ConnectionLoader, target: ConnectTarget) => {
  return async (value: string): Promise<void> => {
    logger.info(`connectSet ${target} - start`);
    if (target === 'bridge') {
      await loader.setBridge(value);
    } else if (target === 'user') {
      await loader.setUser(value);
    }
    console.log(`Connection ${target} saved`);
    await connectList(loader);
    logger.info(`connectSet ${target} - complete`);
  };
};

/**
 * Action handler for 'connect list' command. Loads current connection info and logs it.
 */
export const connectList = async (loader: ConnectionLoader) => {
  logger.info('connectList - start');
  console.log('Current connection info:');
  const connection = await loader.list();
  if (connection == null) {
    console.log('No connection info found');
  } else {
    console.log(`Bridge: ${connection.bridge ?? 'not set'}`);
    console.log(`User: ${connection.user ?? 'not set'}`);
    console.log(`Source: ${connection.source ?? 'unknown'}`);
  }
  logger.info('connectList - complete');
};

/**
 * Action handler for 'connect clear' command. Clears specified connection info from keystore.
 */
export const connectClear = (loader: ConnectionLoader) => {
  return async (): Promise<void> => {
    logger.info(`connectClear - start`);
    await loader.clear();
    console.log('Connection info cleared from keystore');
    await connectList(loader);
    logger.info(`connectClear - complete`);
  };
};
