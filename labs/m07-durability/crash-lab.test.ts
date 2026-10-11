// Runs the real kill -9 crash lab in child processes. Slow-ish (~30s on 1.75.x, ~75s on 1.76 pre-releases).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { scenarioA, scenarioB } from './crash-lab.ts';
import { TARGET } from '../shared/target.ts';

const coreVersion: string = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@mastra/core/package.json'), 'utf8')).version;
// 1.76 pre-releases (main @ the course's pinned SHA) add durable-run claims + fencing.
const hasRunClaims = !/^1\.(7[0-5]|[0-6]\d)\./.test(coreVersion);

test(`crash A [core ${coreVersion}, ${TARGET}]: kill -9 then recover`, { timeout: 150_000 }, async () => {
  const a: any = await scenarioA();
  assert.deepEqual(a.persisted, ['crash-wf/wf-run-1=running', 'durable-agentic-execution/agent-run-1=running', 'durable-agentic-loop/agent-run-1=running']);
  assert.deepEqual(a.active, ['agent-run-1']);
  const c = a.counts;
  // plain workflow: completed step memoized, in-flight step re-ran
  assert.equal(c['WF step send-email executed'], 1);
  assert.equal(c['WF step slow-step started'], 2);
  assert.equal(c['WF step final executed'], 1);
  // durable agent: completed LLM calls and tools NOT repeated; the in-flight tool re-ran
  assert.equal(c['LLM call (tool results so far: none)'], 1);
  assert.equal(c['LLM call (tool results so far: charge_card)'], 1);
  assert.equal(c['TOOL charge_card executed'], 1);
  assert.equal(c['TOOL slow_deploy started'], 2);
  assert.equal(c['LLM call (tool results so far: charge_card,slow_deploy)'], 1);
  if (hasRunClaims) assert.ok(a.attempts[0].skipped >= 1, 'the dead owner\'s claim blocks immediate recovery');
  // exercise 7.1: the external deploy is applied exactly once only with a stable idempotency key
  assert.equal(a.ledger.length, 1, `deploy applied ${a.ledger.length}x: ${a.ledger.join(', ')}`);
});

test(`crash B [core ${coreVersion}, ${TARGET}]: second replica boots while the first is alive`, { timeout: 120_000 }, async () => {
  const b: any = await scenarioB();
  // plain workflow restart has no ownership claim: the in-flight step runs in BOTH processes
  assert.equal(b.pidsPerEffect['WF step slow-step started'], 2);
  assert.equal(b.counts['WF step final executed'], 2);
  if (hasRunClaims) {
    assert.equal(b.pidsPerEffect['TOOL slow_deploy started'], 1, 'claims/fencing keep the live run single-owner');
  } else {
    assert.equal(b.pidsPerEffect['TOOL slow_deploy started'], 2, '1.75.x: no distributed lease; the replica re-drives the live run');
  }
});
