import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import chalk from 'chalk';
import { list } from './list.js';

describe('list command', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('prints sorted tables for all targets and calls store only once per resource', async () => {
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
        { id: 'g2', name: 'Upstairs', type: 'Zone' },
        { id: 'g1', name: 'Basement', type: 'Floor' },
      ]),
    } as any;

    // Run list for all targets
    await list(store)('all');

    // Store calls once each
    assert.equal(store.lights.mock.calls.length, 1);
    assert.equal(store.sensors.mock.calls.length, 1);
    assert.equal(store.groups.mock.calls.length, 1);

    // Console first call logs command, last call logs joined tables
    assert.equal(logSpy.mock.calls[0].arguments[0], 'list command received: all');
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

    await list(store)('lights');

    assert.equal(store.lights.mock.calls.length, 1);
    const outputCall = logSpy.mock.calls.at(-1);
    assert.ok(outputCall, 'expected console.log to be called');
    const output = outputCall.arguments[0] as string;
    assert.ok(output.includes('⧅'));
  });
});
