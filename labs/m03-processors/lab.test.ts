import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runComposition } from './composition.ts';
import { runInputTripwire, runStreamTripwire } from './guardrails.ts';

test('composition: input processors in order, output stream processors chained in order', async () => {
  const r = await runComposition();
  assert.deepEqual(r.log, ['processInput A', 'processInput B', 'processOutputStream X sees "hi"', 'processOutputStream Y sees "hi[X]"']);
  assert.equal(r.text, 'hi[X][Y]');
});

test('input tripwire: the model is never called', async () => {
  const r = await runInputTripwire();
  assert.equal(r.tripwire?.reason, 'possible SQL injection');
  assert.equal(r.tripwire?.processorId, 'sql-guard');
  assert.equal(r.modelCalls, 0);
});

test('stream tripwire: stops the stream, but earlier chunks were already emitted', async () => {
  const r = await runStreamTripwire();
  assert.equal(r.tripwire?.reason, 'policy violation');
  assert.ok(r.chunks.includes('text-delta:"hello "'), 'the first chunk leaked before the guard fired');
  assert.ok(!r.chunks.some(c => c.includes('forbidden')));
  assert.equal(r.chunks.at(-1), 'tripwire');
});
