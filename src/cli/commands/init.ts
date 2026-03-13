import { Command } from 'commander';
import { CLI_VERSION } from '../../shared/version.js';
import { renderSplash } from '../splash.js';

const SPLASH_START = 150;
const SPLASH_END = 440;
const SPLASH_OFFSET = 20;

export const init = () => {
  const program = new Command()
    .name('huetemps')
    .description('Control Hue lights from the terminal')
    .option('-c, --config <path>', 'Path to config file')
    .version(CLI_VERSION)
    .showHelpAfterError()
    .action(function (this: Command) {
      const splash = renderSplash(SPLASH_START, SPLASH_END, SPLASH_OFFSET);
      console.log(splash);
      this.outputHelp();
    })
    .exitOverride();
  return program;
};
