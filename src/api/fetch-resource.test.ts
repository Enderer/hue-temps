import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { ApiClient } from './client.js';
import { fetchResource } from './fetch-resource.js';

describe('fetchResource', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('invokes predicate for each mapped item and filters results', async () => {
    const responseBody = {
      alpha: { name: 'Alpha' },
      beta: { name: 'Beta' },
    } satisfies Record<string, unknown>;

    const getStub = mock.fn(async (resource: string) => {
      assert.equal(resource, 'widgets');
      return { body: responseBody };
    });

    const client = { get: getStub } as unknown as ApiClient;

    const mapper = ({ id, o }: { id: string; o: unknown }) => ({
      id,
      name: (o as { name: string }).name,
    });

    const predicate = mock.fn((item: { id: string; name: string }) => item.id === 'beta');

    const fetchWidgets = fetchResource('widgets', mapper, predicate);
    const result = await fetchWidgets(client);

    assert.equal(getStub.mock.calls.length, 1);
    assert.equal(predicate.mock.calls.length, 2);
    assert.deepEqual(
      predicate.mock.calls.map((c) => c.arguments[0].id),
      ['alpha', 'beta'],
    );
    assert.deepEqual(result, [{ id: 'beta', name: 'Beta' }]);
  });
});
