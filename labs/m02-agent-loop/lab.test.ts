import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAnatomy } from './anatomy.ts';
import { runThreadReservation } from './thread-reservation.ts';

test('anatomy: hook order matches the documented loop', async () => {
  const r = await runAnatomy();
  assert.deepEqual(r.log, [
    'processInput (once) msgs=1',
    'processInputStep step=0 msgs=1',
    'processOutputStep step=0 finish=tool-calls toolCalls=1',
    'tool.execute check_ci(pr=42)',
    'chunk tool-result',
    'onIterationComplete iteration=1 isFinal=false',
    'onStepFinish finishReason=tool-calls',
    'chunk step-finish',
    'processInputStep step=1 msgs=2',
    'processOutputStep step=1 finish=stop toolCalls=0',
    'onIterationComplete iteration=2 isFinal=true',
    'onStepFinish finishReason=stop',
    'chunk step-finish',
    'processOutputResult (once) msgs=1',
    'chunk finish',
  ]);
  assert.equal(r.chunkTypes.join(' '), 'start step-start tool-call tool-result step-finish step-start text-start text-delta text-end step-finish finish');
  assert.equal(r.prompts.length, 2);
  assert.deepEqual(r.prompts[1]!.map((m: any) => m.role), ['system', 'user', 'assistant', 'tool']);
  assert.equal(r.finishReason, 'stop');
});

test('thread reservation: same thread runs serialize and the 2nd sees the 1st in history', async () => {
  const r = await runThreadReservation(true);
  assert.deepEqual(r.order, ['first started', 'first finished: answer 1', 'second started', 'second finished: answer 2']);
  assert.match(JSON.stringify(r.prompts[1]), /answer 1/);
});

test('thread reservation: different threads run concurrently', async () => {
  const r = await runThreadReservation(false);
  assert.equal(r.order[1], 'second started');
});
