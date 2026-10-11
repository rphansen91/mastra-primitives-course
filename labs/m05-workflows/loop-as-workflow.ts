// Lab 5.2 — Module 1's agent loop, rebuilt as a Mastra workflow: dowhile(iteration, predicate).
// We spy on the store to see the snapshot Mastra writes after every iteration.
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { z } from 'zod';
import { banner } from '../shared/mock-model.ts';

type Msg = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };
const State = z.object({ messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string() })), step: z.number(), done: z.boolean() });

// A scripted "model": look up two cities, then answer.
function model(messages: Msg[]): { text?: string; toolCalls?: { name: string; args: any }[] } {
  const results = messages.filter((m) => m.role === 'tool').length;
  if (results === 0) return { toolCalls: [{ name: 'weather', args: { city: 'Lisbon' } }] };
  if (results === 1) return { toolCalls: [{ name: 'weather', args: { city: 'Oslo' } }] };
  return { text: 'Lisbon (24°C) is warmer than Oslo (9°C).' };
}
const tools: Record<string, (a: any) => Promise<unknown>> = {
  weather: async ({ city }) => ({ city, tempC: city === 'Lisbon' ? 24 : 9 }),
};

export async function runLoopAsWorkflow(maxSteps = 5) {
  const trace: string[] = [];
  const iteration = createStep({
    id: 'iteration', inputSchema: State, outputSchema: State,
    execute: async ({ inputData }) => {
      const messages = [...inputData.messages] as Msg[];
      const turn = model(messages);
      trace.push(`iteration ${inputData.step}: model → ${turn.toolCalls ? 'tool ' + turn.toolCalls.map((t) => `${t.name}(${t.args.city})`).join(', ') : `"${turn.text}"`}`);
      if (!turn.toolCalls) return { messages: [...messages, { role: 'assistant' as const, content: turn.text! }], step: inputData.step + 1, done: true };
      for (const c of turn.toolCalls) {
        messages.push({ role: 'assistant', content: `[tool-call ${c.name}]` });
        messages.push({ role: 'tool', content: JSON.stringify(await tools[c.name]!(c.args)) });
      }
      return { messages, step: inputData.step + 1, done: false };
    },
  });
  const loop = createWorkflow({ id: 'agent-loop', inputSchema: State, outputSchema: State })
    .dowhile(iteration, async ({ inputData }) => !inputData.done && inputData.step < maxSteps)
    .commit();
  const storage = new InMemoryStore();
  const wf: any = await storage.getStore('workflows');
  const snaps: string[] = [];
  const orig = wf.persistWorkflowSnapshot.bind(wf);
  wf.persistWorkflowSnapshot = async (a: any) => {
    const it = a.snapshot.context.iteration;
    if (!it) snaps.push(`run ${a.snapshot.status}: no steps yet`);
    else if (it.status === 'running') snaps.push(`run ${a.snapshot.status}: iteration #${it.metadata?.iterationCount} starting, input carries ${it.payload.messages.length} messages`);
    else snaps.push(`run ${a.snapshot.status}: iteration ${it.status}, output carries ${it.output.messages.length} messages`);
    return orig(a);
  };
  const mastra = new Mastra({ workflows: { loop }, storage, logger: false } as any);
  const run = await mastra.getWorkflow('loop').createRun();
  const res: any = await run.start({ inputData: { messages: [{ role: 'user', content: 'Which is warmer, Lisbon or Oslo?' }], step: 0, done: false } });
  return { status: res.status, steps: res.result.step, final: res.result.messages.at(-1).content, messages: res.result.messages.length, trace, snapshots: snaps };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runLoopAsWorkflow();
  banner('The agent loop as createWorkflow().dowhile(iteration, predicate)');
  r.trace.forEach((t) => console.log('  ' + t));
  console.log('  status:', r.status, '| iterations:', r.steps, '| messages:', r.messages);
  console.log('  final:', r.final);
  banner('Snapshots written to storage while it ran');
  r.snapshots.forEach((s, i) => console.log(`  #${i + 1} ${s}`));
  const capped = await runLoopAsWorkflow(2);
  banner('Same loop with the predicate capped at 2 iterations');
  console.log('  iterations:', capped.steps, '| last message:', capped.final);
  process.exit(0);
}
