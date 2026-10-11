import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceTree, judgeScorer, completionLoop, recordReplay } from './observe.ts';

test('9.1 the trace mirrors the loop: run → steps → processor, inference, tool', async () => {
  const t = await traceTree();
  for (const type of ['agent_run', 'model_generation', 'model_step', 'model_inference', 'processor_run', 'tool_call']) assert.ok(t.types.includes(type), type);
  assert.match(t.lines[0]!, /^agent_run/);
  const tool = t.lines.find((l) => l.includes("tool: 'check_ci'"))!;
  assert.match(tool, /^ {6}tool_call/, 'the tool call is a child of model step 0');
  assert.ok(t.lines.some((l) => /processor_run\s+llm request processor:/.test(l)), 'processors get their own spans');
});

test('9.2 an LLM judge is just another (mock) model call', async () => {
  const j = await judgeScorer();
  assert.equal(j.score, 0);
  assert.match(j.reason, /Rust/);
  assert.ok(j.judgeSaw.some((l) => l.includes('lint error in auth.ts') && l.includes('Answer:')), 'judge prompt carries input and output');
});

test('9.3 isTaskComplete: a failing scorer sends the loop around again', async () => {
  const c = await completionLoop();
  assert.equal(c.modelCalls, 3);
  assert.match(c.feedback, /NOT COMPLETE/);
  assert.match(c.text, /Draft 1.*Draft 2.*\[1\]/, 'result.text accumulates every iteration');
});

test('9.4 replay is deterministic and catches prompt drift', async () => {
  const r = await recordReplay();
  assert.equal(r.same.misses.length, 0);
  assert.equal(r.same.text, r.recorded);
  assert.equal(r.changed.misses.length, 2);
});
