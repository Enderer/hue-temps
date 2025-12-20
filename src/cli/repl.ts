import readline from 'node:readline';
import { Command } from 'commander';
import { createLogger } from '../shared/logger.js';

const log = createLogger('cli.repl');

export const startRepl = async (program: Command) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'huetemps> ',
  });

  console.log("Interactive mode. Type 'help' for commands, 'exit' to quit.");
  rl.prompt();

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!trimmed) {
      rl.prompt();
      continue;
    }

    if (trimmed === 'help') {
      console.log(program.helpInformation().trim());
      rl.prompt();
      continue;
    }

    if (trimmed === 'exit' || trimmed === 'quit') {
      break;
    }

    try {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      await program.parseAsync(parts, { from: 'user' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error(`Command failed in REPL: ${message}`);
      console.error(message.trim());
    }

    rl.prompt();
  }

  rl.close();
  log.info('REPL closed');
};
