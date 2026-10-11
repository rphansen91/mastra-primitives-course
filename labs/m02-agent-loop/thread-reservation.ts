// Lab 2.2 — One active run per thread. Two stream() calls on the same (resource, thread) are
// serialized by the thread runtime: the second waits for the first to finish, then sees its history.
import { Agent } from '@mastra/core/agent';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { scriptedModel, summarizePrompt, sleep, banner } from '../shared/mock-model.ts';

export async function runThreadReservation(sameThread = true) {
  const storage = new InMemoryStore();
  const order: string[] = [];
  const { model, prompts } = scriptedModel(i => ({ text: `answer ${i + 1}`, delayMs: 300 }));
  const agent = new Agent({ id: 'reserve', name: 'reserve', instructions: 'Be brief.', model: model as any, memory: new MockMemory({ storage }) as any });
  const go = async (label: string, threadId: string) => {
    const s: any = await agent.stream(label, { memory: { thread: threadId, resource: 'user-1' } } as any);
    order.push(`${label} started`);
    order.push(`${label} finished: ${await s.text}`);
  };
  const p1 = go('first', 't1');
  await sleep(10);
  const p2 = go('second', sameThread ? 't1' : 't2');
  await Promise.all([p1, p2]);
  return { order, prompts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const same of [true, false]) {
    const r = await runThreadReservation(same);
    banner(same ? 'Same thread: serialized' : 'Different threads: concurrent');
    r.order.forEach(l => console.log('  ' + l));
    r.prompts.forEach((p, i) => console.log(`  request #${i + 1}: ` + summarizePrompt(p).map(s => s.trim()).join(' / ')));
  }
}
