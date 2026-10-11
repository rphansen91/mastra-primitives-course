import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { scriptedModel } from '../shared/mock-model.ts';
import { load, TARGET } from '../shared/target.ts';

const here = import.meta.dirname;

test(`[${TARGET}] ex2.1: a runaway search loop stops after 3 identical calls`, async () => {
  const { stopOnRepeat } = await load(here, 'ex1-stop-on-repeat.ts');
  let calls = 0;
  const search = createTool({ id: 'search', description: 'search', inputSchema: z.object({ q: z.string() }), execute: async () => (calls++, { hits: [] }) });
  const { model } = scriptedModel([{ toolCalls: [{ name: 'search', args: { q: 'same' } }] }]);
  const agent = new Agent({ id: 'runaway', name: 'runaway', instructions: 'find it', model: model as any, tools: { search } });
  const r: any = await agent.generate('find it', { maxSteps: 30, stopWhen: stopOnRepeat(3) } as any);
  assert.equal(calls, 3, `expected 3 tool executions, got ${calls}`);
  assert.equal(r.steps.length, 3);
});

test(`[${TARGET}] ex2.2: two parallel seat reservations leave 8 of 10 seats`, async () => {
  const { agentOptions, makeReserveSeat } = await load(here, 'ex2-parallel-tools.ts');
  const db = { seatsLeft: 10 };
  const reserve_seat = createTool({ id: 'reserve_seat', description: 'reserve', inputSchema: z.object({ who: z.string() }), execute: makeReserveSeat(db) });
  const { model } = scriptedModel([
    { toolCalls: [{ name: 'reserve_seat', args: { who: 'ann' } }, { name: 'reserve_seat', args: { who: 'bob' } }] },
    { text: 'booked' },
  ]);
  const agent = new Agent({ id: 'seats', name: 'seats', instructions: 'book', model: model as any, tools: { reserve_seat } });
  await agent.generate('book two', { maxSteps: 3, ...agentOptions } as any);
  assert.equal(db.seatsLeft, 8);
});
