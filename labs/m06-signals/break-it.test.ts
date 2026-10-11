import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { scriptedModel, sleep } from '../shared/mock-model.ts';
import { load, TARGET } from '../shared/target.ts';

const here = import.meta.dirname;

test(`[${TARGET}] ex6.1: custom delivery policy`, async () => {
  const { decide } = await load(here, 'ex1-delivery-policy.ts');
  const storage = new InMemoryStore();
  const store: any = await storage.getStore('notifications');
  const { model, prompts } = scriptedModel([{ text: 'ok', delayMs: 300 }]);
  const agent = new Agent({
    id: 'policy', name: 'policy', instructions: 'i', model: model as any,
    memory: new MockMemory({ storage }) as any,
    notifications: { deliveryPolicy: { decide } },
  } as any);
  new Mastra({ agents: { agent }, storage, logger: false });
  const thread = { resourceId: 'u', threadId: 'inbox' };
  const send = (source: string, priority: string) =>
    agent.sendNotificationSignal({ source, kind: 'k', priority, summary: `${source}-${priority}`, sourceId: `${source}-${priority}` } as any, thread as any);
  await send('github', 'urgent'); // wakes the thread: it is now ACTIVE for ~300ms
  await sleep(20);
  await send('calendar', 'medium');
  await send('chat', 'low');
  await send('spam', 'high');
  await sleep(1200);
  const recs = Object.fromEntries((await store.listNotifications({ threadId: 'inbox' })).map((r: any) => [r.sourceId, r]));
  assert.equal(recs['calendar-medium'].status, 'delivered', 'calendar interjects into the active run');
  assert.equal(recs['spam-high'].status, 'discarded');
  assert.equal(recs['chat-low'].status, 'pending');
  assert.equal(recs['chat-low'].summaryAt, undefined, 'persisted, not scheduled for a summary');
  assert.ok(!JSON.stringify(prompts).includes('spam-high'), 'spam never reached the model');
});
