import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSignalMidRun } from './signal-mid-run.ts';
import { runNotifications } from './notifications.ts';

test('signals: mid-run deliver, idle wake, persist', async () => {
  const r: any = await runSignalMidRun();
  assert.equal(r.stateWhileToolRuns, 'active');
  assert.equal(r.midRunAccepted.action, 'deliver');
  assert.equal(r.run1Text, 'Staggering pushes: waiting 10 minutes between pushes.');
  // the signal joined the very next request, after the tool result, as a user-role XML message
  const p2 = r.prompts[1];
  assert.deepEqual(p2.map((m: any) => m.role), ['system', 'user', 'assistant', 'tool', 'user']);
  assert.match(JSON.stringify(p2.at(-1)), /<notification [^>]*source=\\"chat\\"[^>]*>We're getting rate limited/);
  assert.equal(r.stateAfterRun1, 'idle');
  assert.equal(r.wakeAction, 'wake');
  assert.equal(r.wokenText, 'Resuming normal push cadence.');
  assert.equal(r.persistAccepted.action, 'persist');
  assert.equal(r.persistedResolved, true);
  assert.equal(r.runsSeen, 3, 'one subscription saw all three runs');
  assert.equal(r.modelCalls, 3, 'persist did not call the model');
});

test('notifications: urgent delivers; low is summarized; dispatcher batches the summary', async () => {
  const r = await runNotifications();
  const byId = Object.fromEntries(r.records.map((x: any) => [x.id, x]));
  assert.equal(byId['gh-1'].status, 'delivered');
  assert.equal(byId['gh-1'].reason, 'urgent');
  for (const id of ['ch-1', 'gh-2']) {
    assert.equal(byId[id].priority, 'low');
    assert.equal(byId[id].summaryAt, true);
  }
  assert.ok(r.dispatch.signals.some((s: string) => s.startsWith('<notification-summary>') && s.includes('chat: 1') && s.includes('github: 1')), JSON.stringify(r.dispatch));
  assert.ok(r.roles.includes('signal(notification)'));
  assert.ok(r.roles.includes('signal(notification-summary)'));
});
