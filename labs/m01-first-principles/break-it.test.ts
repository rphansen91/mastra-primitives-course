import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent, scripted, type Tool } from './loop-from-scratch.ts';
import { Journal, runDurably, LeaseStore } from './durability.ts';
import { load, TARGET } from '../shared/target.ts';

const here = import.meta.dirname;

test(`[${TARGET}] ex1: a repeating tool call is stopped as loop-detected after 3 calls`, async () => {
  const { stopOnRepeat } = await load(here, 'ex1-loop-guard.ts');
  let calls = 0;
  const search: Tool = { name: 'search', description: '', execute: async () => (calls++, { hits: [] }) };
  const { model } = scripted([{ toolCalls: [{ id: 's', name: 'search', args: { q: 'same thing' } }] }]);
  const r = await runAgent({ model, tools: { search }, messages: [{ role: 'user', content: 'find it' }], maxSteps: 25, stopWhen: [stopOnRepeat(3)] });
  assert.equal(r.finishReason, 'loop-detected');
  assert.equal(calls, 3);
});

test(`[${TARGET}] ex1: different args are not a loop`, async () => {
  const { stopOnRepeat } = await load(here, 'ex1-loop-guard.ts');
  const search: Tool = { name: 'search', description: '', execute: async () => ({}) };
  const { model } = scripted((i) => (i < 4 ? { toolCalls: [{ id: `s${i}`, name: 'search', args: { q: `q${i}` } }] } : { text: 'found' }));
  const r = await runAgent({ model, tools: { search }, messages: [{ role: 'user', content: 'x' }], stopWhen: [stopOnRepeat(3)] });
  assert.equal(r.finishReason, 'stop');
});

test(`[${TARGET}] ex2: replay after a branch change never returns the wrong effect`, async () => {
  const { workflow } = await load(here, 'ex2-journal-keys.ts');
  const journal = new Journal();
  let attempt = 0;
  const { result } = await runDurably('r1', journal, async ctx => workflow(ctx, attempt++ > 0), ['getUser']);
  assert.deepEqual((result as any).user, { id: 'u1' });
  assert.deepEqual((result as any).orders, ['order-1', 'order-2']);
});

test(`[${TARGET}] ex3: a stale lease holder cannot overwrite the new owner's write`, async () => {
  const { Store } = await load(here, 'ex3-fencing.ts');
  let now = 0;
  const leases = new LeaseStore(() => now);
  const store = new Store();
  const a = leases.acquire('A', 100)!; // A owns the run…
  now = 500; //                          …and stalls past its TTL
  const b = leases.acquire('B', 100)!;
  store.write('run-1/result', 'B result', b.token);
  try { store.write('run-1/result', 'A stale result', a.token); } catch { /* rejected: good */ }
  assert.equal(store.read('run-1/result'), 'B result');
});
