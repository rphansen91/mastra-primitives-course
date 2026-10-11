import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent, scripted, SignalQueue, type Tool } from './loop-from-scratch.ts';
import { Journal, runDurably, FakePaymentsApi, LeaseStore } from './durability.ts';

const echo: Tool = { name: 'echo', description: 'echo', execute: async a => a };

test('loop: tool call → result → final answer, results folded in call order', async () => {
  const slow: Tool = { name: 'slow', description: '', execute: async ({ ms }) => (await new Promise(r => setTimeout(r, ms)), ms) };
  const { model, requests } = scripted([
    { toolCalls: [{ id: 'a', name: 'slow', args: { ms: 40 } }, { id: 'b', name: 'slow', args: { ms: 5 } }] },
    { text: 'done' },
  ]);
  const r = await runAgent({ model, tools: { slow }, messages: [{ role: 'user', content: 'go' }] });
  assert.equal(r.text, 'done');
  assert.equal(r.finishReason, 'stop');
  const toolMsgs = requests[1]!.filter(m => m.role === 'tool').map(m => (m as any).toolCallId);
  assert.deepEqual(toolMsgs, ['a', 'b'], 'b finished first but is folded second');
});

test('loop: maxSteps is a hard budget', async () => {
  const { model } = scripted([{ toolCalls: [{ id: 'x', name: 'echo', args: {} }] }]);
  const r = await runAgent({ model, tools: { echo }, messages: [{ role: 'user', content: 'go' }], maxSteps: 4 });
  assert.equal(r.finishReason, 'max-steps');
  assert.equal(r.steps.length, 4);
});

test('loop: a tool error becomes data, not a crash', async () => {
  const boom: Tool = { name: 'boom', description: '', execute: async () => { throw new Error('nope'); } };
  const { model, requests } = scripted([{ toolCalls: [{ id: 'x', name: 'boom', args: {} }] }, { text: 'recovered' }]);
  const r = await runAgent({ model, tools: { boom }, messages: [{ role: 'user', content: 'go' }] });
  assert.equal(r.text, 'recovered');
  assert.match(JSON.stringify(requests[1]), /nope/);
});

test('loop: a signal pushed during a tool joins the NEXT model request', async () => {
  const signals = new SignalQueue();
  const push: Tool = { name: 'push', description: '', execute: async () => { signals.push('rate limited: stagger pushes'); return { ok: true }; } };
  const { model, requests } = scripted([{ toolCalls: [{ id: 'p', name: 'push', args: {} }] }, { text: 'staggering' }]);
  await runAgent({ model, tools: { push }, messages: [{ role: 'user', content: 'push' }], signals });
  assert.ok(!JSON.stringify(requests[0]).includes('rate limited'));
  const last = requests[1]!.at(-1)!;
  assert.equal(last.role, 'user');
  assert.equal((last as any).content, '<signal>rate limited: stagger pushes</signal>');
});

test('loop: hooks can rewrite the request (the seed of processors)', async () => {
  const { model, requests } = scripted([{ text: 'hi' }]);
  await runAgent({
    model,
    messages: [{ role: 'user', content: 'my key is sk-123' }],
    hooks: [{ beforeModel: ms => ms.map(m => ('content' in m ? { ...m, content: m.content.replace(/sk-\d+/, '[REDACTED]') } : m)) as any }],
  });
  assert.match(JSON.stringify(requests[0]), /REDACTED/);
});

test('journal: completed steps replay from the journal; the in-flight step re-runs', async () => {
  const journal = new Journal();
  let emails = 0;
  let slowRuns = 0;
  const { result, attempts } = await runDurably('r1', journal, async ctx => {
    await ctx.run('send-email', async () => ++emails);
    await ctx.run('slow-step', async () => ++slowRuns);
    return 'ok';
  }, ['slow-step']); // kill -9 after slow-step's effect, before its journal write
  assert.equal(result, 'ok');
  assert.equal(emails, 1, 'send-email memoized by the journal');
  assert.equal(slowRuns, 2, 'the in-flight step runs again: at-least-once');
  assert.deepEqual(attempts[1]!.replayed, ['send-email']);
  assert.deepEqual(attempts[1]!.executed, ['slow-step']);
});

test('idempotency key: a retried charge is applied once', async () => {
  const api = new FakePaymentsApi();
  await api.charge(500, 'run-1:charge');
  await api.charge(500, 'run-1:charge');
  await api.charge(500); // no key → duplicate
  await api.charge(500);
  assert.equal(api.charges.length, 3);
});

test('lease: a second owner cannot acquire until the first expires; tokens increase', () => {
  let now = 0;
  const leases = new LeaseStore(() => now);
  const a = leases.acquire('A', 100)!;
  assert.equal(leases.acquire('B', 100), undefined);
  now = 150;
  const b = leases.acquire('B', 100)!;
  assert.ok(b.token > a.token);
});
