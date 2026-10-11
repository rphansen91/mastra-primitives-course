import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { scriptedModel } from '../shared/mock-model.ts';
import { load, TARGET } from '../shared/target.ts';

const here = import.meta.dirname;

for (const chunks of [['your key is sk-ab', 'c123 ok'], ['s', 'k-abc123 then more'], ['ends with sk-ab', 'c9']]) {
  test(`[${TARGET}] ex3.1: no secret fragment leaks for chunks ${JSON.stringify(chunks)}`, async () => {
    const { redactor } = await load(here, 'ex1-stream-redactor.ts');
    const { model } = scriptedModel([{ textChunks: chunks }]);
    const agent = new Agent({ id: 'redact', name: 'redact', instructions: 'i', model: model as any, outputProcessors: [redactor] });
    const s: any = await agent.stream('x');
    const deltas: string[] = [];
    for await (const c of s.fullStream) if (c.type === 'text-delta') deltas.push(c.payload.text);
    const streamed = deltas.join('');
    assert.ok(streamed.includes('[REDACTED]'), streamed);
    for (const frag of ['sk-', 'abc', 'c123', 'k-a', 'c9']) assert.ok(!streamed.includes(frag), `leaked "${frag}" in ${JSON.stringify(deltas)}`);
  });
}

test(`[${TARGET}] ex3.2: per-run state: two consecutive runs each get the full step budget`, async () => {
  const { stepBudget } = await load(here, 'ex2-per-run-state.ts');
  const echo = createTool({ id: 'echo', description: 'e', inputSchema: z.object({}), execute: async () => ({}) });
  const mk = () => new Agent({
    id: 'budget', name: 'budget', instructions: 'i', tools: { echo },
    model: scriptedModel((_i, prompt) => (prompt.filter((m: any) => m.role === 'tool').length < 2 ? { toolCalls: [{ name: 'echo', args: {} }] } : { text: 'done' })).model as any,
    inputProcessors: [stepBudget(3)],
  });
  const agent = mk();
  const r1: any = await agent.generate('first', { maxSteps: 10 } as any);
  const r2: any = await agent.generate('second', { maxSteps: 10 } as any);
  assert.equal(r1.tripwire, undefined);
  assert.equal(r2.tripwire, undefined, `second run tripped: ${r2.tripwire?.reason}`);
  assert.equal(r2.text, 'done');
});

test(`[${TARGET}] ex3.3: enrichment fails open when its dependency is down`, async () => {
  const { crmEnricher } = await load(here, 'ex3-fail-open.ts');
  const errors: string[] = [];
  const { model } = scriptedModel([{ text: 'answer' }]);
  const agent = new Agent({ id: 'enrich', name: 'enrich', instructions: 'i', model: model as any, inputProcessors: [crmEnricher(async () => { throw new Error('crm down'); }, errors)] });
  const r: any = await agent.generate('hi');
  assert.equal(r.text, 'answer');
  assert.deepEqual(errors, ['crm-enricher: crm down']);
});

test(`[${TARGET}] ex3.3: enrichment still enriches when its dependency is up`, async () => {
  const { crmEnricher } = await load(here, 'ex3-fail-open.ts');
  const errors: string[] = [];
  const { model, prompts } = scriptedModel([{ text: 'answer' }]);
  const agent = new Agent({ id: 'enrich-ok', name: 'enrich-ok', instructions: 'i', model: model as any, inputProcessors: [crmEnricher(async () => 'tier=vip', errors)] });
  const r: any = await agent.generate('hi');
  assert.equal(r.text, 'answer');
  assert.match(JSON.stringify(prompts[0]), /CRM: tier=vip/);
  assert.deepEqual(errors, []);
});
