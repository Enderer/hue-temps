import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import { configureLogging } from '../shared/logger.js';
import type { ApiClient } from './client.js';
import { fetchResource } from './fetch-resource.js';

describe('fetchResource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes predicate for each mapped item and filters results', async () => {
    try {
      configureLogging({
        level: 'error',
        filePath: path.join(os.tmpdir(), 'huetemps', 'test.log'),
        maxSize: '1m',
        maxFiles: '1d',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been configured')) {
        throw error;
      }
    }

    const responseBody = {
      alpha: { name: 'Alpha' },
      beta: { name: 'Beta' },
    } satisfies Record<string, unknown>;

    const getStub = vi.fn(async (resource: string) => {
      assert.equal(resource, 'widgets');
      return responseBody;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const mapper = ({ id, o }: { id: string; o: unknown }) => ({
      id,
      name: (o as { name: string }).name,
    });

    const fetchWidgets = fetchResource('widgets', mapper);
    const result = await fetchWidgets(async () => client);

    assert.equal(getStub.mock.calls.length, 1);
    assert.deepEqual(result, [
      { id: 'alpha', name: 'Alpha' },
      { id: 'beta', name: 'Beta' },
    ]);
  });

  it('uses defaultMapper when mapper is omitted', async () => {
    try {
      configureLogging({
        level: 'error',
        filePath: path.join(os.tmpdir(), 'huetemps', 'test.log'),
        maxSize: '1m',
        maxFiles: '1d',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been configured')) {
        throw error;
      }
    }

    const responseBody = {
      alpha: { name: 'Alpha' },
      beta: { name: 'Beta' },
    } satisfies Record<string, unknown>;

    const getStub = vi.fn(async (resource: string) => {
      assert.equal(resource, 'widgets');
      return responseBody;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const fetchWidgets = fetchResource<{ id: string }>('widgets');
    const result = await fetchWidgets(async () => client);

    assert.equal(getStub.mock.calls.length, 1);
    assert.deepEqual(result, [{ id: 'alpha' }, { id: 'beta' }]);
  });
});
