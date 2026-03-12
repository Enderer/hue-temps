import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { configTemplate, getConfigPath, HueTempsConfig } from '../../shared/config.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('commands.config');

/**
 * Register the config command to the CLI program.
 */
export const init = (program: Command, configPath: string, config: HueTempsConfig) => {
  program
    .command('config')
    .description('Show or initialize configuration')
    .option('--init', 'Create a default config file')
    .action((opts: { init?: boolean }) => {
      if (opts.init) {
        initConfig();
      }
      printConfig(configPath, config);
    });
};

/**
 * Creates the default config file at the platform-specific path.
 * Skips writing if a config file already exists.
 */
export const initConfig = (): void => {
  logger.info('initConfig - start');
  const configPath = getConfigPath();

  if (fs.existsSync(configPath)) {
    console.log(chalk.red(`✖ Config file already exists at ${configPath}`));
    logger.info('initConfig - config already exists, skipping');
    return;
  }

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, configTemplate(), 'utf8');
  console.log(chalk.green(`✔ Config file created at ${configPath}`));
  logger.info('initConfig - complete');
};

/**
 * Prints the resolved config values to the console.
 */
export const printConfig = (configPath: string, config: HueTempsConfig): void => {
  logger.info('printConfig - start');
  const dim = chalk.dim;
  const cyan = chalk.cyan;
  const green = chalk.green;
  const label = (name: string) => dim(name.padEnd(14));

  console.log();
  console.log(chalk.bold('Configuration'));
  console.log();
  console.log(`${label('Config file')}${cyan(configPath)}`);
  console.log(`${label('Zone name')}${green(config.zoneName)}`);
  console.log(`${label('Log level')}${green(config.logging.level)}`);
  console.log(`${label('Log file')}${cyan(config.logging.filePath)}`);
  console.log(`${label('Log max size')}${green(config.logging.maxSize)}`);
  console.log(`${label('Log max files')}${green(config.logging.maxFiles)}`);
  console.log();
  logger.info('printConfig - complete');
};
