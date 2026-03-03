import { Command } from 'commander';

export const init = () => {
  const program = new Command()
    .name('huetemps')
    .description('Control Hue lights from the terminal')
    .showHelpAfterError()
    .exitOverride();
  return program;
};
