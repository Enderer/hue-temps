import assert from 'node:assert/strict';
import { Command } from 'commander';
import { afterEach, describe, it, vi } from 'vitest';

const createStore = (lights: any[], apiAlertImpl?: (id: string) => Promise<any>) => {
  const alertMock = vi.fn(async (id: string) =>
    apiAlertImpl ? apiAlertImpl(id) : { id, ok: true },
  );
  return {
    lights: vi.fn(async () => lights),
    provider: vi.fn(async () => ({ alert: alertMock })),
    alertMock,
  } as any;
};

const setupLogger = async () => {
  const childLogger = { log: vi.fn() } as any;
  const rootLogger = { child: vi.fn(() => childLogger) } as any;
  const loggerModule = await import('../../shared/logger.js');
  loggerModule.__setRootLoggerForTests(rootLogger);
  return { childLogger, rootLogger, loggerModule };
};

describe('alert command', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    const loggerModule = await import('../../shared/logger.js');
    loggerModule.__setRootLoggerForTests(null);
  });

  it('alerts by exact id and logs start/end', async () => {
    vi.resetModules();
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([
      { id: 'abc', name: 'Kitchen' },
      { id: 'def', name: 'Porch' },
    ]);

    const { alert } = await import('./alert.js');

    await alert(store)('abc');

    assert.equal(store.alertMock.mock.calls[0][0], 'abc');
    assert.equal(rootLogger.child.mock.calls.length, 1);
    assert.equal(childLogger.log.mock.calls.length, 2);
  });

  it('alerts by exact name when id not found', async () => {
    vi.resetModules();
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Kitchen' },
      { id: '2', name: 'Porch' },
    ]);

    const { alert } = await import('./alert.js');

    await alert(store)('Porch');

    assert.equal(store.alertMock.mock.calls[0][0], '2');
    assert.equal(childLogger.log.mock.calls.length, 2);
    assert.equal(rootLogger.child.mock.calls.length, 1);
  });

  it('alerts by case-insensitive name match', async () => {
    vi.resetModules();
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([{ id: '1', name: 'Kitchen' }]);

    const { alert } = await import('./alert.js');

    await alert(store)('kitchen');

    assert.equal(store.alertMock.mock.calls[0][0], '1');
    assert.equal(childLogger.log.mock.calls.length, 2);
    assert.equal(rootLogger.child.mock.calls.length, 1);
  });

  it('throws when multiple id matches', async () => {
    vi.resetModules();
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: 'dup', name: 'Kitchen' },
      { id: 'dup', name: 'Porch' },
    ]);

    const { alert } = await import('./alert.js');

    await assert.rejects(alert(store)('dup'), /Multiple lights found with id dup/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when multiple case-insensitive name matches', async () => {
    vi.resetModules();
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Kitchen' },
      { id: '2', name: 'kitchen' },
    ]);

    const { alert } = await import('./alert.js');

    await assert.rejects(alert(store)('KITCHEN'), /Multiple lights found with name KITCHEN/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when multiple exact name matches', async () => {
    vi.resetModules();
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Porch' },
      { id: '2', name: 'Porch' },
    ]);

    const { alert } = await import('./alert.js');

    await assert.rejects(alert(store)('Porch'), /Multiple lights found with name Porch/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when no match found', async () => {
    vi.resetModules();
    const { loggerModule } = await setupLogger();
    const store = createStore([{ id: '1', name: 'Kitchen' }]);

    const { alert } = await import('./alert.js');

    await assert.rejects(alert(store)('Porch'), /No light found matching 'Porch'/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('init registers alert command with light arg and action handler', async () => {
    vi.resetModules();
    await setupLogger();
    const program = new Command();
    const store = createStore([{ id: 'abc', name: 'Kitchen' }]);

    const { init } = await import('./alert.js');

    init(store, program);

    const alertCommand = program.commands.find((cmd) => cmd.name() === 'alert');
    assert.ok(alertCommand);
    assert.equal(alertCommand.description(), 'Make a light alert to help identify it');
    assert.equal(alertCommand.registeredArguments.length, 1);

    const lightArg = alertCommand.registeredArguments[0];
    assert.equal(lightArg.name(), 'light');

    // Execute via commander parse to verify init action wiring.
    await program.parseAsync(['alert', 'abc'], { from: 'user' });

    assert.equal(store.lights.mock.calls.length, 1);
    assert.equal(store.provider.mock.calls.length, 1);
    assert.equal(store.alertMock.mock.calls.length, 1);
    assert.equal(store.alertMock.mock.calls[0][0], 'abc');
  });
});
