import assert from 'node:assert/strict';
import { Command } from 'commander';
import { afterEach, beforeAll, describe, it, vi } from 'vitest';

let init: typeof import('./list.js').init;
let list: typeof import('./list.js').list;

describe('list command', () => {
  beforeAll(async () => {
    ({ init, list } = await import('./list.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init registers list command with target arg and action handler', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = new Command();
    const store = {
      lights: vi.fn(async () => [
        {
          id: '1',
          name: 'Kitchen',
          productName: 'Hue A',
          on: true,
          reachable: true,
          temp: 200,
          tempMin: 100,
          tempMax: 400,
        },
      ]),
      sensors: vi.fn(async () => []),
      groups: vi.fn(async () => []),
    } as any;

    init(store, program, 'Zone');

    const listCommand = program.commands.find((cmd) => cmd.name() === 'list');
    assert.ok(listCommand);
    assert.equal(listCommand.description(), 'List lights, groups, sensors, or temps');
    assert.equal(listCommand.registeredArguments.length, 1);

    const targetArg = listCommand.registeredArguments[0];
    assert.equal(targetArg.name(), 'target');
    assert.equal(targetArg.defaultValue, 'all');

    // Run through commander to verify the action is wired by init.
    await program.parseAsync(['list', 'lights'], { from: 'user' });

    assert.equal(store.lights.mock.calls.length, 1);
    assert.equal(store.sensors.mock.calls.length, 0);
    assert.equal(store.groups.mock.calls.length, 0);
    assert.equal(logSpy.mock.calls.length > 0, true);
  });

  it('prints sorted tables for all targets and calls store per section', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const store = {
      lights: vi.fn(async () => [
        {
          id: '2',
          name: 'Bedroom',
          productName: 'Hue A',
          on: true,
          reachable: true,
          temp: 200,
          tempMin: 100,
          tempMax: 400,
        },
        {
          id: '1',
          name: 'Atrium',
          productName: 'Hue B',
          on: false,
          reachable: true,
          temp: 300,
          tempMin: 100,
          tempMax: 400,
        },
      ]),
      sensors: vi.fn(async () => [
        { id: 's2', name: 'Hall', productName: 'Sensor B' },
        { id: 's1', name: 'Attic', productName: 'Sensor A' },
      ]),
      groups: vi.fn(async () => [
        { id: 'g2', name: 'Upstairs', type: 'Zone', lightIds: ['1', '2'] },
        { id: 'g3', name: 'Downstairs', type: 'Zone', lightIds: ['3', '4'] },
        { id: 'g1', name: 'Basement', type: 'Floor', lightIds: [] },
        { id: 'g4', name: 'Basement', type: 'Floor', lightIds: [] },
      ]),
    } as any;

    // Run list for all targets
    await list('Upstairs', store)('all');

    // Store calls per section (groups twice: groups + temps, lights twice: lights + temps)
    assert.equal(store.lights.mock.calls.length, 2);
    assert.equal(store.sensors.mock.calls.length, 1);
    assert.equal(store.groups.mock.calls.length, 2);

    // Console last call logs joined tables
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall[0] as string;

    // Ensure sorted rows appear in output in order
    assert.ok(output.indexOf('Atrium') < output.indexOf('Bedroom'));
    // Sensors are currently sorted by icon column (index 1), so input order is retained.
    assert.ok(output.indexOf('Hall') < output.indexOf('Attic'));
    assert.ok(output.indexOf('Basement') < output.indexOf('Upstairs'));
  });

  it('renders unreachable light with red unreachable icon', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const store = {
      lights: vi.fn(async () => [
        {
          id: '5',
          name: 'Garage',
          productName: 'Hue A19',
          on: true,
          reachable: false,
          temp: 200,
          tempMin: 153,
          tempMax: 454,
        },
      ]),
      sensors: vi.fn(async () => []),
      groups: vi.fn(async () => []),
    } as any;

    await list('Zone', store)('lights');

    assert.equal(store.lights.mock.calls.length, 1);
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall[0] as string;
    assert.ok(output.includes('⧅'));
  });

  it('renders groups with missing type as blank', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const store = {
      groups: vi.fn(async () => [{ id: 'g3', name: 'NoType' }]),
    } as any;

    await list('Zone', store)('groups');

    assert.equal(store.groups.mock.calls.length, 1);
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall[0] as string;

    assert.ok(output.includes('NoType'));
    assert.ok(output.includes('g3'));
    assert.equal(output.includes('undefined'), false);
  });

  it('throws when temps group.lightIds is undefined and no rows are available', async () => {
    const store = {
      groups: vi.fn(async () => [{ id: 'g1', name: 'ZoneNoIds' }]),
      lights: vi.fn(async () => [
        {
          id: '10',
          name: 'Spare',
          productName: 'Hue X',
          on: true,
          reachable: true,
          temp: 200,
          tempMin: 153,
          tempMax: 454,
        },
      ]),
    } as any;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await assert.rejects(
      async () => list('ZoneNoIds', store)('temps'),
      /Table must define at least one row/,
    );

    assert.equal(store.groups.mock.calls.length, 1);
    assert.equal(store.lights.mock.calls.length, 1);

    assert.equal(logSpy.mock.calls.length, 0);
  });

  it('throws when temps zone is missing', async () => {
    const store = {
      groups: vi.fn(async () => [{ id: 'g9', name: 'OtherZone', lightIds: [] }]),
      lights: vi.fn(async () => {
        throw new Error('lights should not be called when no zone match');
      }),
    } as any;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await assert.rejects(
      async () => list('MissingZone', store)('temps'),
      /Table must define at least one row/,
    );

    assert.equal(store.groups.mock.calls.length, 1);
    assert.equal(store.lights.mock.calls.length, 0);

    assert.equal(logSpy.mock.calls.length, 0);
  });

  it('replaces missing fields with blanks', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const store = {
      lights: vi.fn(async () => [
        {
          id: '7',
          name: 'Loft',
          productName: undefined,
          on: true,
          reachable: true,
          temp: 200,
          tempMin: 153,
          tempMax: 454,
        },
      ]),
      sensors: vi.fn(async () => []),
      groups: vi.fn(async () => []),
    } as any;

    await list('Zone', store)('lights');

    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall[0] as string;

    assert.ok(output.includes('Loft'));
    assert.equal(output.includes('undefined'), false);
  });
});
