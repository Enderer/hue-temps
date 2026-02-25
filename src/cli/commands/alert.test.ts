import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

const createStore = (lights: any[], apiAlertImpl?: (id: string) => Promise<any>) => {
  const alertMock = mock.fn(async (id: string) =>
    apiAlertImpl ? apiAlertImpl(id) : { id, ok: true },
  );
  return {
    lights: mock.fn(async () => lights),
    provider: mock.fn(async () => ({ alert: alertMock })),
    alertMock,
  } as any;
};

const setupLogger = async () => {
  const childLogger = { log: mock.fn() } as any;
  const rootLogger = { child: mock.fn(() => childLogger) } as any;
  const loggerModule = await import('../../shared/logger.js');
  loggerModule.__setRootLoggerForTests(rootLogger);
  return { childLogger, rootLogger, loggerModule };
};

describe('alert command', () => {
  afterEach(async () => {
    mock.restoreAll();
    const loggerModule = await import('../../shared/logger.js');
    loggerModule.__setRootLoggerForTests(null);
  });

  it('alerts by exact id and logs start/end', async () => {
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([
      { id: 'abc', name: 'Kitchen' },
      { id: 'def', name: 'Porch' },
    ]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await alert(store)('abc');

    assert.equal(store.alertMock.mock.calls[0].arguments[0], 'abc');
    assert.equal(rootLogger.child.mock.calls.length, 1);
    assert.equal(childLogger.log.mock.calls.length, 2);
  });

  it('alerts by exact name when id not found', async () => {
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Kitchen' },
      { id: '2', name: 'Porch' },
    ]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await alert(store)('Porch');

    assert.equal(store.alertMock.mock.calls[0].arguments[0], '2');
    assert.equal(childLogger.log.mock.calls.length, 2);
    assert.equal(rootLogger.child.mock.calls.length, 1);
  });

  it('alerts by case-insensitive name match', async () => {
    const { childLogger, rootLogger } = await setupLogger();
    const store = createStore([{ id: '1', name: 'Kitchen' }]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await alert(store)('kitchen');

    assert.equal(store.alertMock.mock.calls[0].arguments[0], '1');
    assert.equal(childLogger.log.mock.calls.length, 2);
    assert.equal(rootLogger.child.mock.calls.length, 1);
  });

  it('throws when multiple id matches', async () => {
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: 'dup', name: 'Kitchen' },
      { id: 'dup', name: 'Porch' },
    ]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await assert.rejects(alert(store)('dup'), /Multiple lights found with id dup/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when multiple case-insensitive name matches', async () => {
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Kitchen' },
      { id: '2', name: 'kitchen' },
    ]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await assert.rejects(alert(store)('KITCHEN'), /Multiple lights found with name KITCHEN/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when multiple exact name matches', async () => {
    const { loggerModule } = await setupLogger();
    const store = createStore([
      { id: '1', name: 'Porch' },
      { id: '2', name: 'Porch' },
    ]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await assert.rejects(alert(store)('Porch'), /Multiple lights found with name Porch/);
    loggerModule.__setRootLoggerForTests(null);
  });

  it('throws when no match found', async () => {
    const { loggerModule } = await setupLogger();
    const store = createStore([{ id: '1', name: 'Kitchen' }]);

    const { alert } = await import(`./alert.js?test=${Date.now()}`);

    await assert.rejects(alert(store)('Porch'), /No light found matching 'Porch'/);
    loggerModule.__setRootLoggerForTests(null);
  });
});
