import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import { __setRootLoggerForTests } from '../../shared/logger.js';

const childLogger = { log: mock.fn() } as any;
const rootLogger = { child: mock.fn(() => childLogger) } as any;

let list: typeof import('./list.js').list;

describe('list command', () => {
  before(async () => {
    __setRootLoggerForTests(rootLogger);
    ({ list } = await import('./list.js'));
  });

  beforeEach(() => {
    childLogger.log = mock.fn();
    rootLogger.child = mock.fn(() => childLogger);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  after(() => {
    __setRootLoggerForTests(null);
  });

  it('prints sorted tables for all targets and calls store per section', async () => {
    // Capture console output
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      lights: mock.fn(async () => [
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
      sensors: mock.fn(async () => [
        { id: 's2', name: 'Hall', productName: 'Sensor B' },
        { id: 's1', name: 'Attic', productName: 'Sensor A' },
      ]),
      groups: mock.fn(async () => [
        { id: 'g2', name: 'Upstairs', type: 'Zone', lightIds: ['1', '2'] },
        { id: 'g3', name: 'Downstairs', type: 'Zone', lightIds: ['3', '4'] },
        { id: 'g1', name: 'Basement', type: 'Floor', lightIds: [] },
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
    const output = outputCall.arguments[0] as string;

    // Ensure sorted rows appear in output in order
    assert.ok(output.indexOf('Atrium') < output.indexOf('Bedroom'));
    assert.ok(output.indexOf('Attic') < output.indexOf('Hall'));
    assert.ok(output.indexOf('Basement') < output.indexOf('Upstairs'));
  });

  it('renders unreachable light with red unreachable icon', async () => {
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      lights: mock.fn(async () => [
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
      sensors: mock.fn(async () => []),
      groups: mock.fn(async () => []),
    } as any;

    await list('Zone', store)('lights');

    assert.equal(store.lights.mock.calls.length, 1);
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;
    assert.ok(output.includes('⧅'));
  });

  it('renders groups with missing type as blank', async () => {
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      groups: mock.fn(async () => [{ id: 'g3', name: 'NoType' }]),
    } as any;

    await list('Zone', store)('groups');

    assert.equal(store.groups.mock.calls.length, 1);
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;

    assert.ok(output.includes('NoType'));
    assert.ok(output.includes('g3'));
    assert.equal(output.includes('undefined'), false);
  });

  it('handles temps when group.lightIds is undefined', async () => {
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      groups: mock.fn(async () => [{ id: 'g1', name: 'ZoneNoIds' }]),
      lights: mock.fn(async () => [
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

    await list('ZoneNoIds', store)('temps');

    assert.equal(store.groups.mock.calls.length, 1);
    assert.equal(store.lights.mock.calls.length, 1);

    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;

    // Should render temps section without leaking undefined
    assert.equal(output.includes('undefined'), false);
  });

  it('renders temps table with none when zone is missing', async () => {
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      groups: mock.fn(async () => [{ id: 'g9', name: 'OtherZone', lightIds: [] }]),
      lights: mock.fn(async () => {
        throw new Error('lights should not be called when no zone match');
      }),
    } as any;

    await list('MissingZone', store)('temps');

    assert.equal(store.groups.mock.calls.length, 1);
    assert.equal(store.lights.mock.calls.length, 0);

    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;

    assert.ok(output.includes('temps'));
    assert.ok(output.includes('(none)'));
    assert.equal(output.includes('undefined'), false);
  });

  it('replaces missing fields with blanks', async () => {
    const logSpy = mock.method(console, 'log', () => {});

    const store = {
      lights: mock.fn(async () => [
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
      sensors: mock.fn(async () => []),
      groups: mock.fn(async () => []),
    } as any;

    await list('Zone', store)('lights');

    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;

    assert.ok(output.includes('Loft'));
    assert.equal(output.includes('undefined'), false);
  });
});
