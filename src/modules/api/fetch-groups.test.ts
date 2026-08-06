import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mapGroup } from './fetch-groups.js';

describe('mapGroup', () => {
  it('maps group api records and renames lights to lightIds', () => {
    const apiResponse = {
      group1: { name: 'Living Room', type: 'Room', lights: ['1', '2'] },
      group2: { name: 'Hallway', type: 'Zone', lights: ['3'] },
    } satisfies Record<string, unknown>;

    const groups = Object.entries(apiResponse).map(([id, o]) => mapGroup({ id, o }));

    assert.deepEqual(groups, [
      { id: 'group1', name: 'Living Room', type: 'Room', lightIds: ['1', '2'] },
      { id: 'group2', name: 'Hallway', type: 'Zone', lightIds: ['3'] },
    ]);
  });
});
