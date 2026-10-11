// Lab 4.1 — memory under pressure. Every assertion reads what the MODEL received (prompts),
// never Mastra's internal state.
//  1) history window: lastMessages: 5 after 8 exchanges
//  2) tool calls and results stay together when the window slides
//  3) a run woken by a signal, with and without memory
//  4) working memory: the model saves a fact; the next conversation sees it
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { scriptedModel, summarizePrompt, sleep, banner } from '../shared/mock-model.ts';

const thread = (t: string) => ({ memory: { resource: 'user-1', thread: t } }) as any;

export async function historyWindow() {
  const storage = new InMemoryStore();
  const { model, prompts } = scriptedModel((i) => ({ text: `reply ${i + 1}` }));
  const agent = new Agent({ id: 'chat', name: 'chat', instructions: 'You are a dinner planner.', model: model as any, memory: new MockMemory({ storage, options: { lastMessages: 5 } as any }) as any });
  new Mastra({ agents: { agent }, storage, logger: false });
  await agent.generate('I am vegetarian.', thread('dinner'));
  for (let i = 2; i <= 8; i++) await agent.generate(`message ${i}`, thread('dinner'));
  const last = prompts.at(-1)!;
  return { prompt: summarizePrompt(last), stillKnowsDiet: JSON.stringify(last).includes('vegetarian'), stored: ((await (await storage.getStore('memory') as any).listMessages({ threadId: 'dinner', perPage: false })).messages.length) };
}

export async function toolPairs() {
  const storage = new InMemoryStore();
  const { model, prompts } = scriptedModel((i) => (i === 1 ? { toolCalls: [{ name: 'find_menu', args: { diet: 'vegetarian' } }] } : { text: `reply ${i + 1}` }));
  const find_menu = createTool({ id: 'find_menu', description: 'Find a menu', inputSchema: z.object({ diet: z.string() }), execute: async () => ({ dishes: ['mushroom risotto', 'dal'] }) });
  const agent = new Agent({ id: 'chat2', name: 'chat2', instructions: 'You are a dinner planner.', model: model as any, tools: { find_menu }, memory: new MockMemory({ storage, options: { lastMessages: 3 } as any }) as any });
  new Mastra({ agents: { agent }, storage, logger: false });
  for (let i = 1; i <= 3; i++) await agent.generate(`message ${i}`, thread('menu'));
  const st: any = await storage.getStore('memory');
  const stored = (await st.listMessages({ threadId: 'menu', perPage: false })).messages.map((m: any) => `${m.role}: ${m.content.parts.map((p: any) => p.type).join(' + ')}`);
  return { stored, prompt: summarizePrompt(prompts.at(-1)!) };
}

export async function wokenRun(withMemory: boolean) {
  const storage = new InMemoryStore();
  const { model, prompts } = scriptedModel((i) => ({ text: i === 0 ? 'Noted: vegetarian, dinner for two.' : 'Great, the 7pm table at Verde works.' }));
  const agent = new Agent({ id: withMemory ? 'with' : 'without', name: 'planner', instructions: 'You are a dinner planner.', model: model as any, ...(withMemory ? { memory: new MockMemory({ storage }) as any } : {}) });
  new Mastra({ agents: { agent }, storage, logger: false });
  await agent.generate('I am vegetarian. Book dinner for two.', thread('booking'));
  await sleep(30);
  const acc: any = await agent.sendSignal({ type: 'notification', contents: 'Verde has a table at 7pm', attributes: { source: 'booking-api' } } as any, { resourceId: 'user-1', threadId: 'booking' }).accepted;
  if (acc.output) await acc.output.text;
  const woken = prompts.at(-1)!;
  return { action: acc.action, prompt: summarizePrompt(woken), knowsDiet: JSON.stringify(woken).includes('vegetarian') };
}

export async function workingMemory() {
  const storage = new InMemoryStore();
  const { model, prompts } = scriptedModel((i, p) => {
    if (i === 0) return { toolCalls: [{ name: 'updateWorkingMemory', args: { memory: '# About the user\n- diet: vegetarian\n' } }] };
    return { text: 'ok' };
  });
  const memory = new MockMemory({ storage, enableWorkingMemory: true, workingMemoryTemplate: '# About the user\n- diet:\n', options: { workingMemory: { enabled: true, scope: 'resource', template: '# About the user\n- diet:\n' } } as any });
  const agent = new Agent({ id: 'wm', name: 'wm', instructions: 'You are a dinner planner.', model: model as any, memory: memory as any });
  new Mastra({ agents: { agent }, storage, logger: false });
  await agent.generate('I am vegetarian.', thread('monday'));
  await agent.generate('Plan Friday dinner.', thread('friday')); // a DIFFERENT thread, same user
  const friday = prompts.at(-1)!;
  return { fridaySeesDiet: JSON.stringify(friday).includes('diet: vegetarian'), fridayHistory: summarizePrompt(friday).filter((l) => !l.startsWith('system')), toolsOffered: Object.keys(memory.listTools()) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await historyWindow();
  banner('1) lastMessages: 5 after 8 exchanges (16 stored messages)');
  console.log('stored messages:', h.stored);
  h.prompt.forEach((l) => console.log('  ' + l));
  console.log('model still knows "vegetarian"?', h.stillKnowsDiet);
  const t = await toolPairs();
  banner('2) Tool call + result are ONE stored message, so the window keeps them together');
  t.stored.forEach((l) => console.log('  stored  ' + l));
  t.prompt.forEach((l) => console.log('  prompt  ' + l));
  const w0 = await wokenRun(false);
  const w1 = await wokenRun(true);
  banner('3) A signal wakes the idle thread');
  console.log('WITHOUT memory:', w0.action); w0.prompt.forEach((l) => console.log('  ' + l));
  console.log('WITH memory:', w1.action); w1.prompt.forEach((l) => console.log('  ' + l));
  const wm = await workingMemory();
  banner('4) Resource-scoped working memory crosses threads');
  console.log('memory tools offered to the model:', wm.toolsOffered);
  console.log('Friday thread sees "diet: vegetarian"?', wm.fridaySeesDiet);
  console.log('Friday thread history:', wm.fridayHistory);
  process.exit(0);
}
