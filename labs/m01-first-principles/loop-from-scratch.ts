// Lab 1.1 — An agent loop from scratch (~200 lines, no framework).
//
// This is the smallest honest version of what every agent framework runs:
//   messages → model → (tool calls → tool results → model)* → final text
// plus the three things production loops add on top:
//   1. stop conditions (maxSteps + custom predicates)
//   2. hooks (the seed of Mastra's "processors")
//   3. a signal queue drained at safe points (the seed of Mastra's signals)

export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type ToolCall = { id: string; name: string; args: Record<string, unknown> };
export type Message =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; name: string; content: string };

/** What the model returns for one request. */
export type ModelTurn = { text?: string; toolCalls?: ToolCall[] };
/** A model is just a function from transcript (+ tool specs) to the next turn. */
export type Model = (messages: Message[], tools: ToolSpec[]) => Promise<ModelTurn>;

export type ToolSpec = { name: string; description: string };
export type Tool = ToolSpec & { execute: (args: any, ctx: ToolContext) => Promise<unknown> };
export type ToolContext = { runId: string; step: number; toolCallId: string };

export type StepRecord = { step: number; turn: ModelTurn; toolResults: { id: string; name: string; result: unknown }[] };
/** Return a reason string to stop, or undefined to continue. */
export type StopCondition = (steps: StepRecord[]) => string | undefined;

export type LoopEvent =
  | { type: 'step-start'; step: number }
  | { type: 'model-request'; step: number; messages: number }
  | { type: 'tool-call'; step: number; call: ToolCall }
  | { type: 'tool-result'; step: number; id: string; result: unknown }
  | { type: 'signal'; step: number; text: string }
  | { type: 'step-finish'; step: number }
  | { type: 'finish'; reason: string; steps: number };

/** Hooks run at fixed points; they may rewrite what flows through (Mastra calls these processors). */
export type Hooks = {
  beforeModel?: (messages: Message[], step: number) => Message[] | Promise<Message[]>;
  afterModel?: (turn: ModelTurn, step: number) => ModelTurn | Promise<ModelTurn>;
  afterTool?: (call: ToolCall, result: unknown) => unknown | Promise<unknown>;
};

/** Messages that arrive while the loop runs. Drained only at safe points (between steps). */
export class SignalQueue {
  #items: string[] = [];
  push(text: string) {
    this.#items.push(text);
  }
  drain(): string[] {
    const out = this.#items;
    this.#items = [];
    return out;
  }
  get size() {
    return this.#items.length;
  }
}

export type RunOptions = {
  model: Model;
  tools?: Record<string, Tool>;
  messages: Message[];
  maxSteps?: number;
  stopWhen?: StopCondition[];
  hooks?: Hooks[];
  signals?: SignalQueue;
  onEvent?: (e: LoopEvent) => void;
  runId?: string;
  /** run tool calls of one step concurrently (true) or one after another (false) */
  parallelTools?: boolean;
};

export type RunResult = { text: string; steps: StepRecord[]; messages: Message[]; finishReason: string };

export async function runAgent(opts: RunOptions): Promise<RunResult> {
  const { model, tools = {}, maxSteps = 10, stopWhen = [], hooks = [], signals, onEvent = () => {} } = opts;
  const runId = opts.runId ?? `run-${Math.random().toString(36).slice(2, 8)}`;
  const messages: Message[] = [...opts.messages];
  const steps: StepRecord[] = [];
  const specs = Object.values(tools).map(({ name, description }) => ({ name, description }));
  let finishReason = 'max-steps';
  let text = '';

  for (let step = 0; step < maxSteps; step++) {
    onEvent({ type: 'step-start', step });

    // Safe point #1: signals that arrived since the last step join the transcript
    // as user-role messages, wrapped in a tag so the model can tell them apart.
    for (const s of signals?.drain() ?? []) {
      messages.push({ role: 'user', content: `<signal>${s}</signal>` });
      onEvent({ type: 'signal', step, text: s });
    }

    // Hooks may rewrite the request (inject context, trim history, redact...).
    let request = messages;
    for (const h of hooks) if (h.beforeModel) request = await h.beforeModel(request, step);
    onEvent({ type: 'model-request', step, messages: request.length });

    let turn = await model(request, specs);
    for (const h of hooks) if (h.afterModel) turn = await h.afterModel(turn, step);

    messages.push({ role: 'assistant', content: turn.text ?? '', toolCalls: turn.toolCalls });
    const record: StepRecord = { step, turn, toolResults: [] };
    steps.push(record);

    const calls = turn.toolCalls ?? [];
    if (calls.length === 0) {
      text = turn.text ?? '';
      finishReason = 'stop';
      onEvent({ type: 'step-finish', step });
      break;
    }

    // Fan out tool calls; fold the results back into the transcript IN CALL ORDER,
    // regardless of completion order, so the next prompt is deterministic.
    const exec = async (call: ToolCall) => {
      onEvent({ type: 'tool-call', step, call });
      const tool = tools[call.name];
      let result: unknown;
      try {
        if (!tool) throw new Error(`unknown tool ${call.name}`);
        result = await tool.execute(call.args, { runId, step, toolCallId: call.id });
      } catch (err) {
        // Errors become data the model can react to, not crashes of the loop.
        result = { error: (err as Error).message };
      }
      for (const h of hooks) if (h.afterTool) result = await h.afterTool(call, result);
      return result;
    };
    const results = opts.parallelTools === false ? await sequential(calls, exec) : await Promise.all(calls.map(exec));
    calls.forEach((call, i) => {
      const result = results[i];
      record.toolResults.push({ id: call.id, name: call.name, result });
      messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content: JSON.stringify(result) });
      onEvent({ type: 'tool-result', step, id: call.id, result });
    });
    onEvent({ type: 'step-finish', step });

    // Custom stop conditions run after every step that did not already finish.
    const reason = stopWhen.map(c => c(steps)).find(Boolean);
    if (reason) {
      finishReason = reason;
      break;
    }
  }

  onEvent({ type: 'finish', reason: finishReason, steps: steps.length });
  return { text, steps, messages, finishReason };
}

async function sequential<T, R>(items: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (const it of items) out.push(await fn(it));
  return out;
}

/** A model scripted as a list of turns (last one repeats), recording every request. */
export function scripted(turns: ModelTurn[] | ((i: number, messages: Message[]) => ModelTurn)) {
  const requests: Message[][] = [];
  const model: Model = async messages => {
    const i = requests.length;
    requests.push(structuredClone(messages));
    return typeof turns === 'function' ? turns(i, messages) : turns[Math.min(i, turns.length - 1)]!;
  };
  return { model, requests };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { model } = scripted([
    { toolCalls: [{ id: 'c1', name: 'weather', args: { city: 'Lisbon' } }, { id: 'c2', name: 'weather', args: { city: 'Oslo' } }] },
    { text: 'Lisbon is warmer than Oslo.' },
  ]);
  const weather: Tool = {
    name: 'weather',
    description: 'current temperature',
    execute: async ({ city }) => {
      await new Promise(r => setTimeout(r, city === 'Lisbon' ? 50 : 10)); // Oslo finishes first
      return { city, tempC: city === 'Lisbon' ? 24 : 9 };
    },
  };
  const r = await runAgent({
    model,
    tools: { weather },
    messages: [{ role: 'user', content: 'Compare Lisbon and Oslo' }],
    onEvent: e => console.log(JSON.stringify(e)),
  });
  console.log('text:', r.text, '| finishReason:', r.finishReason, '| steps:', r.steps.length);
}
