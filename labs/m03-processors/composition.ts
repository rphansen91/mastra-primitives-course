// Lab 3.1 — Processor composition. Input processors run in array order; output stream
// processors run in array order on EVERY chunk, each one seeing the previous one's output.
import { Agent } from '@mastra/core/agent';
import { scriptedModel, banner } from '../shared/mock-model.ts';

export async function runComposition() {
  const log: string[] = [];
  const tagger = (id: string) => ({
    id,
    processInput: async ({ messages }: any) => {
      log.push(`processInput ${id}`);
      return messages;
    },
    processOutputStream: async ({ part }: any) => {
      if (part.type !== 'text-delta') return part;
      log.push(`processOutputStream ${id} sees "${part.payload.text}"`);
      return { ...part, payload: { ...part.payload, text: `${part.payload.text}[${id}]` } };
    },
  });
  const { model } = scriptedModel([{ text: 'hi' }]);
  const agent = new Agent({
    id: 'compose',
    name: 'compose',
    instructions: 'Say hi.',
    model: model as any,
    inputProcessors: [tagger('A'), tagger('B')] as any,
    outputProcessors: [tagger('X'), tagger('Y')] as any,
  });
  const s: any = await agent.stream('hello');
  const text = await s.text;
  return { log, text };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runComposition();
  banner('Processor order');
  r.log.forEach(l => console.log('  ' + l));
  console.log('final text:', r.text);
}
