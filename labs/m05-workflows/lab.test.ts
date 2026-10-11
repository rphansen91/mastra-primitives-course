import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSuspendResume } from './suspend-resume.ts';
import { runLoopAsWorkflow } from './loop-as-workflow.ts';

test('5.1 suspend → snapshot → resume in a new process; double resume has one winner', async () => {
  const r = await runSuspendResume();
  assert.equal(r.startedStatus, 'suspended');
  assert.equal(r.snapshot.status, 'suspended');
  assert.deepEqual(r.snapshot.suspendedPaths, { approve: [1] });
  assert.deepEqual(r.snapshot.suspendPayload, { ask: 'Refund $49?' });
  assert.equal(r.resumed.status, 'success');
  assert.deepEqual(r.resumed.result, { message: 'Refunded $49' });
  assert.equal(r.byProcess.length, 2, 'two different processes did the work');
  assert.deepEqual(r.byProcess[0]!.events, ['fetch', 'EMAIL manager: Approve refund of $49 for order-1042?']);
  assert.deepEqual(r.byProcess[1]!.events, ['apply refund $49', 'notify customer: Refunded $49'], 'fetch did not re-run');
  assert.equal(r.raceOut.filter((x) => x.startsWith('won')).length, 1);
  assert.match(r.raceOut.find((x) => x.startsWith('lost'))!, /already resumed by another caller/);
});

test('5.2 the agent loop as dowhile: three iterations, a snapshot per iteration', async () => {
  const r = await runLoopAsWorkflow();
  assert.equal(r.status, 'success');
  assert.equal(r.steps, 3);
  assert.match(r.final, /Lisbon \(24°C\) is warmer/);
  assert.equal(r.snapshots.filter((s) => /iteration #\d starting/.test(s)).length, 3);
  const capped = await runLoopAsWorkflow(2);
  assert.equal(capped.steps, 2, 'the predicate is the stop condition');
});
