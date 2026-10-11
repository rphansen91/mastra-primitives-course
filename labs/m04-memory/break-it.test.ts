import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { scriptedModel } from '../shared/mock-model.ts';
import { load, TARGET } from '../shared/target.ts';
import { TEMPLATE, parseFacts } from './facts.ts';

test(`[${TARGET}] ex4.1: two threads learn two facts at once; both survive`, async () => {
  const { createRememberFactTool } = await load(import.meta.dirname, 'ex1-remember-fact.ts');
  const storage = new InMemoryStore();
  const memory = new MockMemory({ storage, enableWorkingMemory: true, workingMemoryTemplate: TEMPLATE, options: { workingMemory: { enabled: true, scope: 'resource', template: TEMPLATE } } as any });
  const { model } = scriptedModel((_i, prompt) => {
    const text = JSON.stringify(prompt);
    if (text.includes('tool-result')) return { text: 'Saved.' };
    return text.includes('vegetarian')
      ? { toolCalls: [{ name: 'remember_fact', args: { key: 'diet', value: 'vegetarian' } }] }
      : { toolCalls: [{ name: 'remember_fact', args: { key: 'city', value: 'Lisbon' } }] };
  });
  const agent = new Agent({ id: 'a', name: 'a', instructions: 'Remember facts.', model: model as any, memory: memory as any, tools: { remember_fact: createRememberFactTool() } });
  new Mastra({ agents: { agent }, storage, logger: false });
  await Promise.all([
    agent.generate('I am vegetarian.', { memory: { resource: 'user-1', thread: 'chat-web' } } as any),
    agent.generate('I just moved to Lisbon.', { memory: { resource: 'user-1', thread: 'chat-mobile' } } as any),
  ]);
  const facts = parseFacts(await memory.getWorkingMemory({ threadId: 'chat-web', resourceId: 'user-1' } as any));
  assert.deepEqual(facts, { diet: 'vegetarian', city: 'Lisbon' }, `working memory lost an update: ${JSON.stringify(facts)}`);
});
