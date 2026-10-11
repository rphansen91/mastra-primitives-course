// A ~30-line record/replay wrapper, the hand-written cousin of Mastra's own _llm-recorder.
// record(): wraps a real (here: scripted) model and saves each response keyed by a hash of the prompt.
// replay(): serves responses from the tape and fails loudly if a prompt doesn't match the tape.
import { createHash } from 'node:crypto';
import { scriptedModel, type Step } from '../shared/mock-model.ts';

export type Tape = { hash: string; step: Step }[];
const strip = (prompt: any[]) => JSON.stringify(prompt, (k, v) => (k === 'providerOptions' || k === 'id' ? undefined : v));
export const promptHash = (prompt: any[]) => createHash('sha256').update(strip(prompt)).digest('hex').slice(0, 10);

export function record(live: (call: number, prompt: any[]) => Step) {
  const tape: Tape = [];
  const m = scriptedModel((i, prompt) => { const step = live(i, prompt); tape.push({ hash: promptHash(prompt), step }); return step; });
  return { ...m, tape };
}

export function replay(tape: Tape) {
  const misses: string[] = [];
  const m = scriptedModel((i, prompt) => {
    const h = promptHash(prompt);
    if (tape[i]?.hash !== h) misses.push(`call ${i + 1}: prompt ${h} not on tape (expected ${tape[i]?.hash ?? 'nothing'})`);
    return tape[i]?.step ?? { text: '[replay: no tape entry]' };
  });
  return { ...m, misses };
}
