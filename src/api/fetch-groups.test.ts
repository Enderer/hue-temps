import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { ApiClient } from './client.js';
import { fetchGroups } from './fetch-groups.js';

describe('fetchGroups', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('fetches groups and maps lights to lightIds', async () => {
    const apiResponse = {
      body: {
        group1: { name: 'Living Room', type: 'Room', lights: ['1', '2'] },
        group2: { name: 'Hallway', type: 'Zone', lights: ['3'] },
      },
    } satisfies Record<string, unknown>;

    const getStub = mock.fn(async (resource: string) => {
      assert.equal(resource, 'groups');
      return apiResponse;
    });

    const client = { get: getStub } as unknown as ApiClient;

    const groups = await fetchGroups(client);

    assert.deepEqual(groups, [
      { id: 'group1', name: 'Living Room', type: 'Room', lightIds: ['1', '2'] },
      { id: 'group2', name: 'Hallway', type: 'Zone', lightIds: ['3'] },
    ]);

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(getStub.mock.calls[0].arguments[0], 'groups');
  });
});
