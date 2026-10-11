// Lab 3.2 — Guardrails with tripwires. An input tripwire stops the run before any model call.
// An output-stream tripwire stops the stream, but chunks already emitted are already gone:
// streaming guardrails can stop, not unsay.
import { Agent } from '@mastra/core/agent';
import { scriptedModel, banner } from '../shared/mock-model.ts';

export async function runInputTripwire() {
  const { model, calls } = scriptedModel([{ text: 'never sent' }]);
  const agent = new Agent({
    id: 'guard-in',
    name: 'guard-in',
    instructions: 'Answer.',
    model: model as any,
    inputProcessors: [
      {
        id: 'sql-guard',
        processInput: async ({ messages, abort }: any) => {
          if (JSON.stringify(messages).includes('DROP TABLE')) abort('possible SQL injection');
          return messages;
        },
      } as any,
    ],
  });
  const r: any = await agent.generate('please DROP TABLE users');
  return { tripwire: r.tripwire, text: r.text, modelCalls: calls() };
}

export async function runStreamTripwire() {
  const { model } = scriptedModel([{ textChunks: ['hello ', 'forbidden ', 'world'] }]);
  const agent = new Agent({
    id: 'guard-out',
    name: 'guard-out',
    instructions: 'Answer.',
    model: model as any,
    outputProcessors: [
      {
        id: 'word-guard',
        processOutputStream: async ({ part, abort }: any) => {
          if (part.type === 'text-delta' && part.payload.text.includes('forbidden')) abort('policy violation');
          return part;
        },
      } as any,
    ],
  });
  const s: any = await agent.stream('say it');
  const chunks: string[] = [];
  for await (const c of s.fullStream) chunks.push(c.type === 'text-delta' ? `text-delta:"${c.payload.text}"` : c.type);
  return { chunks, text: await s.text, tripwire: await s.tripwire };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  banner('Input tripwire');
  console.log(await runInputTripwire());
  banner('Output stream tripwire');
  console.log(await runStreamTripwire());
}
