import { Argument } from 'commander';
import { Store } from '../../modules/api/index.js';
import { ListTarget, listTargets } from './list.js';

export const init = (store: Store, program: any, zoneName: string) => {
  program
    .command('list')
    .description('List lights, groups, sensors, or temps')
    .addArgument(
      new Argument('[target]', listTargets.join(' | ')).choices(listTargets).default('all'),
    )
    .action(list(zoneName, store));
};

/**
 * List command prints out a list of resources.
 * @param zoneName Name of the zone to change temps for
 */
export const list = (zoneName: string, store: Store) => async (target: ListTarget) => {};
