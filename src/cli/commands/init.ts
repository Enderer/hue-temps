import { Command } from 'commander';
import { renderSplash } from '../../shared/splash.js';
import { CLI_VERSION } from '../../shared/version.js';

/** Color temp the gradient begins at */
const SPLASH_START_MIRED = 150;

/** Color temp the gradient ends at */
const SPLASH_END_MIRED = 440;

/** Number of chars to start gradient transition */
const SPLASH_OFFSET_CHARS = 20;

export const init = () => {
  const program = new Command()
    .name('huetemps')
    .description('Control Hue lights from the terminal')
    .option('-c, --config <path>', 'Path to config file')
    .version(CLI_VERSION)
    .showHelpAfterError()
    .action(function (this: Command) {
      const splash = renderSplash(SPLASH_START_MIRED, SPLASH_END_MIRED, SPLASH_OFFSET_CHARS);
      console.log(splash);
      this.outputHelp();
      console.log('');
    })
    .exitOverride();
  return program;
};
