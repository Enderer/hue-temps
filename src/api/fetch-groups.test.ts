import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import { configureLogging } from '../shared/logger.js';
import type { ApiClient } from './client.js';
import { fetchGroups } from './fetch-groups.js';

describe('fetchGroups', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches groups and maps lights to lightIds', async () => {
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

    const apiResponse = {
      group1: { name: 'Living Room', type: 'Room', lights: ['1', '2'] },
      group2: { name: 'Hallway', type: 'Zone', lights: ['3'] },
    } satisfies Record<string, unknown>;

    const getStub = vi.fn(async (resource: string) => {
      assert.equal(resource, 'groups');
      return apiResponse;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const groups = await fetchGroups(async () => client);

    assert.deepEqual(groups, [
      { id: 'group1', name: 'Living Room', type: 'Room', lightIds: ['1', '2'] },
      { id: 'group2', name: 'Hallway', type: 'Zone', lightIds: ['3'] },
    ]);

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0][0], 'groups');
  });
});
