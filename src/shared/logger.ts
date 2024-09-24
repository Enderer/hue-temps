import pino from 'pino';

const transport = pino.transport({
  targets: [
    {
      level: 'trace',
      target: 'pino-pretty',
      options: {},
    },
    {
      level: 'trace',
      target: 'pino/file',
      options: { destination: `${process.cwd()}/logs.txt` }
    }
  ]
});

const logger = pino({
  name: 'hue-temps',
  level: 'debug'
}, transport);

export const createLogger = (name: string): pino.Logger => {
  if (!(name?.length > 0)) { throw new Error(`Invalid logger name ${name}`); }
  return logger.child({ name });
};
