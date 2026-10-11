// A tiny, dependency-free implementation of the AI SDK LanguageModelV2 interface.
// Mastra accepts any object with `specificationVersion: 'v2'` + doGenerate/doStream,
// so this is all a "model" really is from the agent loop's point of view.
//
// Usage:
//   const { model, prompts } = scriptedModel([
//     { toolCalls: [{ name: 'check_ci', args: { pr: 1 } }] },
//     { text: 'done' },
//   ]);
//   // or decide from the prompt (works across process restarts):
//   scriptedModel((call, prompt) => ({ text: 'hi' }))

export type ToolCallSpec = { name: string; args: Record<string, unknown>; id?: string };
export type Step = {
  text?: string;
  /** emit the text as several deltas (e.g. to test stream processors across chunk boundaries) */
  textChunks?: string[];
  reasoning?: string;
  toolCalls?: ToolCallSpec[];
  /** total time to spread across emitted chunks (simulates a slow model) */
  delayMs?: number;
  /** throw from doStream (simulates a provider error) */
  error?: string;
};
export type Script = Step[] | ((callIndex: number, prompt: any[]) => Step);

export function scriptedModel(script: Script, opts: { modelId?: string } = {}) {
  const prompts: any[][] = [];
  let call = 0;

  const pick = (prompt: any[]): { idx: number; step: Step } => {
    const idx = call++;
    prompts.push(prompt);
    const step = typeof script === 'function' ? script(idx, prompt) : script[Math.min(idx, script.length - 1)]!;
    return { idx, step };
  };

  const toParts = (idx: number, step: Step) => {
    const parts: any[] = [
      { type: 'stream-start', warnings: [] },
      { type: 'response-metadata', id: `resp-${idx}`, modelId: opts.modelId ?? 'mock', timestamp: new Date(0) },
    ];
    if (step.reasoning) {
      parts.push({ type: 'reasoning-start', id: `r${idx}` }, { type: 'reasoning-delta', id: `r${idx}`, delta: step.reasoning }, { type: 'reasoning-end', id: `r${idx}` });
    }
    const chunks = step.textChunks ?? (step.text ? [step.text] : []);
    if (chunks.length) {
      parts.push({ type: 'text-start', id: `t${idx}` });
      for (const delta of chunks) parts.push({ type: 'text-delta', id: `t${idx}`, delta });
      parts.push({ type: 'text-end', id: `t${idx}` });
    }
    (step.toolCalls ?? []).forEach((tc, j) => {
      parts.push({ type: 'tool-call', toolCallId: tc.id ?? `call-${idx}-${j}`, toolName: tc.name, input: JSON.stringify(tc.args) });
    });
    parts.push({
      type: 'finish',
      finishReason: step.toolCalls?.length ? 'tool-calls' : 'stop',
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    });
    return parts;
  };

  const model = {
    specificationVersion: 'v2' as const,
    provider: 'mock',
    modelId: opts.modelId ?? 'mock',
    supportedUrls: {},
    async doGenerate({ prompt }: any) {
      const { idx, step } = pick(prompt);
      if (step.error) throw new Error(step.error);
      const content: any[] = [];
      const fullText = step.textChunks?.join('') ?? step.text;
      if (fullText) content.push({ type: 'text', text: fullText });
      (step.toolCalls ?? []).forEach((tc, j) => content.push({ type: 'tool-call', toolCallId: tc.id ?? `call-${idx}-${j}`, toolName: tc.name, input: JSON.stringify(tc.args) }));
      return {
        content,
        finishReason: step.toolCalls?.length ? 'tool-calls' : 'stop',
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      };
    },
    async doStream({ prompt }: any) {
      const { idx, step } = pick(prompt);
      if (step.error) throw new Error(step.error);
      const parts = toParts(idx, step);
      const delay = step.delayMs ?? 0;
      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [],
        stream: new ReadableStream({
          async start(c) {
            for (const p of parts) {
              if (delay) await sleep(delay / parts.length);
              c.enqueue(p);
            }
            c.close();
          },
        }),
      };
    },
  };
  return { model, prompts, calls: () => call };
}

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Compact view of a provider prompt: role + first chars of each message. */
export function summarizePrompt(prompt: any[]): string[] {
  return prompt.map(m => {
    const c =
      typeof m.content === 'string'
        ? m.content
        : m.content
            .map((p: any) =>
              p.text ??
              (p.type === 'tool-call'
                ? `[tool-call ${p.toolName}]`
                : p.type === 'tool-result'
                  ? `[tool-result ${p.toolName}: ${JSON.stringify(p.output?.value ?? p.output).slice(0, 60)}]`
                  : `[${p.type}]`),
            )
            .join(' | ');
    return `${m.role.padEnd(9)} ${String(c).replace(/\s+/g, ' ').slice(0, 160)}`;
  });
}

export function banner(s: string) {
  console.log(`\n=== ${s} ${'='.repeat(Math.max(0, 70 - s.length))}`);
}

/** Collect the text of every message in a provider prompt (handy for assertions). */
export const promptText = (prompt: any[]) => JSON.stringify(prompt);
