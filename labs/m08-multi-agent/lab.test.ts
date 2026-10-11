import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCoordinatorRelay } from './coordinator-relay.ts';

test('coordinator relay: discover peer, wake coordinator, deliver into the worker run', async () => {
  const r = await runCoordinatorRelay();
  assert.equal(r.claimed, true);
  assert.deepEqual(r.peers, [{ agentId: 'worker', threadId: 'worker-auth-refactor', label: 'api (auth refactor)' }]);
  assert.equal(r.coordinatorAction, 'wake');
  assert.equal(r.relayResult.routed, 'deliver');
  assert.equal(r.coordinatorText, 'Relayed the rate-limit notice to the worker agent.');
  assert.equal(r.workerText, 'Got it from the coordinator: batching pushes, max 1 per 10 min.');
});
