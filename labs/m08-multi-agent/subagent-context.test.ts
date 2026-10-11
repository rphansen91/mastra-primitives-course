// Lab 8.3: what does a subagent actually see?
// The Principles book describes an *isolated* subagent ("none of the parent's history").
// Mastra's default at 1.76.0 is different: the subagent receives the parent's conversation
// unless you pass `delegation.messageFilter` (docs: subagents.mdx "Message filtering").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';
import { scriptedModel } from '../shared/mock-model.ts';

const conversation = [
  { role: 'user', content: 'My card is SECRET-CARD-4242, keep it on file.' },
  { role: 'assistant', content: 'Noted.' },
  { role: 'user', content: 'Ask the helper to research refund policies.' },
] as any;

async function delegate(options: Record<string, unknown> = {}) {
  const sub = scriptedModel([{ text: 'Refunds within 30 days.' }]);
  const helper = new Agent({ id: 'helper', name: 'helper', description: 'Researches policies', instructions: 'Research.', model: sub.model as any });
  const parent = scriptedModel([{ toolCalls: [{ name: 'agent-helper', args: { prompt: 'Research refund policies' } }] }, { text: 'Done.' }]);
  const boss = new Agent({ id: 'boss', name: 'boss', instructions: 'Delegate research.', model: parent.model as any, agents: { helper } });
  const mastra = new Mastra({ agents: { boss, helper }, logger: false as any });
  await mastra.getAgent('boss').generate(conversation, options as any);
  assert.equal(sub.prompts.length, 1, 'the helper was called once');
  return JSON.stringify(sub.prompts[0]);
}

test('default: the subagent sees the parent conversation (not isolated)', async () => {
  const seen = await delegate();
  assert.ok(seen.includes('SECRET-CARD-4242'), 'parent history reaches the subagent by default');
});

test('messageFilter: strip sensitive messages before delegation', async () => {
  const seen = await delegate({
    delegation: {
      messageFilter: ({ messages }: any) => messages.filter((m: any) => !JSON.stringify(m.content).includes('SECRET-CARD')),
    },
  });
  assert.ok(!seen.includes('SECRET-CARD-4242'), 'the filter removed it');
  assert.ok(seen.includes('Research refund policies'), 'the delegation prompt still arrives');
});
