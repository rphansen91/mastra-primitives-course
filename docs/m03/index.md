---
pageClass: lesson
aside: false
---

<script setup>
const P = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts'
const outcomes = [
  'Name every processor hook, when it fires and what it may return',
  'Predict the output when several processors are stacked',
  'Use a tripwire (<code>abort</code>), per-run <code>state</code> and the <code>writer</code> correctly',
  'Spot the three classic processor bugs: chunk boundaries, shared state, fail-closed enrichment',
  'Decide between a processor, tool code, a workflow, memory or a signal',
]
const needs = [
  { title: 'Redact secrets and PII', body: 'Before the model sees them, and before the user does.', icon: 'eye', color: 'coral' },
  { title: 'Block prompt injection', body: 'Look at user input once, early, and refuse politely.', icon: 'alert', color: 'amber' },
  { title: 'Trim to a token budget', body: 'Before every single model request, not just the first.', icon: 'clock', color: 'sky' },
  { title: 'Inject memory and context', body: 'Load what matters, every step, without string soup.', icon: 'book', color: 'violet' },
  { title: 'Retry provider errors', body: 'A 529 from the provider should not be your user\'s problem.', icon: 'reset', color: 'teal' },
  { title: 'Never deploy twice', body: 'Look at tool calls *before* they run and veto the bad ones.', icon: 'skull', color: 'lime' },
]
const hooks = [
  { name: 'processInput', short: 'once, before step 1', detail: 'Runs **once** on the incoming messages. Returns messages. Guardrails on user input, enrichment.', href: P + '#L700', color: 'sky' },
  { name: 'processInputStep', short: 'before every request', detail: 'Before **every** model request. Returns messages or a MessageList, and may override the model or tools for this step. Context injection, tool gating, per-step budgets.', href: P + '#L728', color: 'violet' },
  { name: 'computeStateSignal', short: 'always-fresh state', detail: 'Per request. Returns a *state signal*, such as the current task list or goal, recomputed every time instead of growing the transcript.', href: P + '#L750', color: 'violet' },
  { name: 'processLLMRequest', short: 'last stop before provider', detail: 'Right before the provider call. Sees the provider prompt. Provider-specific rewrites, prompt caching.', href: P + '#L771', color: 'amber' },
  { name: 'processOutputStream', short: 'every chunk', detail: 'On **every streamed chunk**. Return the chunk, a rewritten chunk, or `null` to drop it. Streaming redaction and moderation. One chunk in, at most one chunk out.', href: P + '#L707', color: 'coral' },
  { name: 'processLLMResponse', short: 'after the response', detail: 'After the provider response completes. Response inspection.', href: P + '#L795', color: 'amber' },
  { name: 'processOutputStep', short: 'after a step, BEFORE tools', detail: 'After each model step, **before any tool runs**. Sees the tool calls. Veto them, check structure, tripwire.', href: P + '#L812', color: 'coral' },
  { name: 'processToolResult', short: 'after each tool', detail: 'After each tool returns. Truncate or redact tool output before the model reads it.', href: P + '#L836', color: 'teal' },
  { name: 'processOutputResult', short: 'once, at the end', detail: 'Runs **once** on the final messages. Final guardrails, shaping what gets persisted.', href: P + '#L716', color: 'sky' },
  { name: 'processAPIError', short: 'on provider errors', detail: 'When the provider errors. Returns a retry decision. Stream retry, model fallback.', href: P + '#L852', color: 'lime' },
]
const ctx = [
  { title: '`abort(reason, { retry? })`', body: 'The **tripwire**. Stops the run with a reason, optionally asking the model to retry.', icon: 'alert', color: 'coral' },
  { title: '`state`', body: 'A scratchpad **per processor, per run**. Survives across steps, never leaks to another run.', icon: 'cards', color: 'violet' },
  { title: '`requestContext`', body: 'Whatever the caller passed in: user id, tenant, feature flags.', icon: 'map', color: 'sky' },
  { title: '`writer`', body: 'Emits extra `data-*` parts to the client stream. (Not extra text. Remember that.)', icon: 'mail', color: 'teal' },
]
const order = [
  '`processInput`',
  '`processInputStep`',
  '`processLLMRequest`',
  '`processOutputStream` (per chunk)',
  '`processOutputStep`',
  '`processToolResult`',
  '`processOutputResult`',
]
const bugs = [
  { title: '3.1 The leaky redactor', body: 'Per-chunk regex. You just watched it leak. Buffer in `state`, flush on `text-end`.', icon: 'eye', color: 'coral', tag: 'exercises/ex1-stream-redactor.ts' },
  { title: '3.2 State that outlives the run', body: 'A step budget counted in a module-level `let`. Run 2 trips on its first step. In a server, that is a cross-user bug.', icon: 'cards', color: 'amber', tag: 'exercises/ex2-per-run-state.ts' },
  { title: '3.3 Fail-closed enrichment', body: 'A nice-to-have CRM lookup throws and kills the whole run. Make it fail open.', icon: 'alert', color: 'violet', tag: 'exercises/ex3-fail-open.ts' },
]
const q_fit = [
  { text: 'Redacting API keys from every agent\'s output', why: 'Cross-cutting, every agent, a specific phase: textbook processor.' },
  { text: 'Trimming context to 8k tokens before every model call', why: 'A per-step hook (`processInputStep`). Processor.' },
  { text: 'Computing a shipping quote inside the `quote` tool', correct: true, why: 'That is one tool\'s business logic. Put it in the tool.' },
  { text: 'Blocking a second `deploy` tool call in one run', why: '`processOutputStep` sees calls before they run. Processor.' },
]
const q_stack = [
  { text: '`hi[Y][X]`', why: 'That would mean Y ran first. Output processors run in array order: X, then Y.' },
  { text: '`hi[X][Y]`', correct: true, why: 'Array order on every chunk. Y sees X\'s rewrite.' },
  { text: '`hi[X]` (only the first processor applies)', why: 'All processors in the array run, each on the previous one\'s output.' },
  { text: '`hi`, output processors only run at the end', why: 'That is `processOutputResult`. `processOutputStream` runs on each chunk.' },
]
const q_where = [
  { text: '`processOutputStream`, with a bigger regex', why: 'A per-chunk guard can stop the stream, but it can\'t unsay chunks that already went out.' },
  { text: 'Buffer in `processOutputStream`, or guard in `processOutputStep` / `processOutputResult`', correct: true, why: 'If even one leaked chunk is unacceptable, you must hold text back (latency) or check before anything is shown.' },
  { text: 'A `stopWhen` condition', why: '`stopWhen` decides whether to loop again. The text has already streamed.' },
]
const choose = [
  { when: 'Behavior is cross-cutting: many agents, or every step', not: 'It is one tool\'s business logic', alt: 'Put it in the tool' },
  { when: 'You need a hook at a specific loop phase', not: 'You need different control flow (branching, fan-out)', alt: 'A workflow (Module 5)' },
  { when: 'It must be reusable and shippable as a package', not: 'It must persist state across runs', alt: 'Memory / storage (Module 4), state signals' },
  { when: 'Guardrails, redaction, budgets, context shaping', not: 'It must react to an outside event mid-run', alt: 'Signals (Module 6)' },
]
const recall = [
  { q: 'Which hook runs before tools, and sees the tool calls?', a: '`processOutputStep`. It runs after each model step and before any tool executes.' },
  { q: 'Output stream processors `[X, Y]`, model streams "hi". Final text?', a: '`hi[X][Y]`. Array order, on every chunk.' },
  { q: 'Where should a per-run counter live?', a: 'In the hook\'s `state` argument: per processor, per run. Never in module scope.' },
  { q: 'Why can a streaming guardrail "stop but not unsay"?', a: 'Chunks before the tripwire have already gone to the client. Buffer, or guard at `processOutputStep` / `processOutputResult`.' },
  { q: 'What can `processOutputStream` not do?', a: 'Emit an extra text chunk. One chunk in, at most one out; `writer` only emits `data-*` parts.' },
  { q: 'The house rule, in one sentence?', a: '"Before adding a feature, check whether it can be a processor." (`packages/core/AGENTS.md`)' },
]
const cheat = [
  { title: 'What a processor is', color: 'violet', lines: ['An object with an id and any subset of hooks', 'Each runs as a workflow step with its own span', 'Ordered, composable, shippable'] },
  { title: 'Hooks, in order', color: 'amber', lines: ['processInput (once)', 'per step: processInputStep → processLLMRequest → processOutputStream (per chunk) → processOutputStep (before tools) → processToolResult', 'processOutputResult (once)'] },
  { title: 'Context', color: 'teal', lines: ['abort(reason, {retry}) = tripwire', 'state = per processor, per run', 'requestContext, writer (data-* parts only)'] },
  { title: 'Order', color: 'sky', lines: ['Array order; each sees the previous output', 'SignalProvider processors: prepended to input, appended to output'] },
  { title: 'Bugs to dodge', color: 'coral', lines: ['Chunk boundaries: buffer in state', 'Module-scope state: use state', 'Throwing enrichment: fail open', 'Stream guard leaks earlier chunks'] },
  { title: 'Choose', color: 'lime', lines: ['Cross-cutting, phase-specific → processor', 'One tool\'s logic → the tool', 'Control flow → workflow', 'Across runs → memory'] },
]
const out1 = '=== Processor order ===\n  processInput A\n  processInput B\n  processOutputStream X sees "hi"\n  processOutputStream Y sees "hi[X]"\nfinal text: hi[X][Y]\n\n=== Output stream tripwire ===\n  chunks: start, step-start, text-start, text-delta:"hello ", tripwire\n  text: "hello "'
</script>

# Module 3: Processors

<p class="lead">Every production agent needs the same boring, critical stuff: redaction, guardrails, budgets, memory, retries. Mastra's answer is one small interface with ten hooks. Learn it once and you can bend any agent without touching the framework.</p>

<LessonHero module="03" :minutes="35" lab="Lab runs in ~2 s, no API keys" :outcomes="outcomes" mood="alarmed">

**Tuesday, 2:15 pm.** A customer pastes their API key into your support bot. You were careful: there's a redaction regex on the output stream. It runs on every chunk.

The screenshot on social media shows the bot cheerfully repeating `[REDACTED]c123` back at them. The regex worked perfectly. On half a secret.

</LessonHero>

<Journey :station="1" module="03" />

## The problem {#problem}

Here's a normal week of feature requests for one agent:

<IdeaCards :cards="needs" />

You have two bad options. Make each one a **flag on `Agent`**, and the core grows forever while every feature becomes a risky change to the hottest code path. Or **fork the loop**, and nothing composes with anything.

What you actually want: **named, ordered, composable hooks at every phase of the loop**, with per-run state and a standard way to bail out. That's a processor.

<Callout type="analogy" title="Checkpoints on a conveyor belt">

Picture the agent loop as an airport conveyor belt. Processors are the checkpoints along it: one scans bags on the way in, one weighs them before the plane, one checks tags on the way out. Each checkpoint does one job, they always run in the same order, and adding a new one doesn't mean rebuilding the airport.

</Callout>

<Quiz module="03" id="fit" question="Which of these should **not** be a processor?" :options="q_fit" />

<StationDone module="03" :station="1" />

<Journey :station="2" module="03" />

## Under the hood {#under-the-hood}

A [`Processor`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts#L625) is an object with an `id` and **any subset** of ten hooks. Click through them. The colors group them by phase: input, request, output, tools, errors.

<ClickMap title="The ten hooks" :stations="hooks" start-label="user message" end-label="finish" />

Every hook gets a context with four things worth memorising:

<IdeaCards :cols="4" :cards="ctx" />

Now put the main hooks in the order they fire during a run with one tool call:

<OrderSteps module="03" id="hook-order" prompt="Order these hooks for a run where the model calls one tool and then answers." :items="order" explain="`processInputStep` through `processOutputStep` repeat for every step. `processInput` and `processOutputResult` run once." />

### Stacking processors

Input processors run **in array order**, each seeing the previous one's output. Output stream processors run in array order **on every chunk**.

<ProcessorOrder />

<Quiz kind="predict" module="03" id="stack" question="Two output stream processors: X appends `[X]` to each text chunk, Y appends `[Y]`. They're registered as `[X, Y]` and the model streams `hi`. What does the user see?" :options="q_stack" />

<TryIt cmd="npm run lab:processors" :output="out1">

The composition lab, then the tripwire lab. Notice `"hello "` got out before the tripwire fired.

</TryIt>

### The house rule

<MascotSays mood="happy">

From [`packages/core/AGENTS.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/AGENTS.md): *"Before adding a feature, check whether it can be a processor. Processors are self-contained and need no changes to core internals, so they carry far less risk of breaking existing behavior."*

</MascotSays>

Mastra follows its own rule. Task lists and goals, signal-provider hints, stream retry, memory, moderation, PII, prompt-injection detection, token limiting, structured output and skills all ship as **processors**, not `Agent` methods. Browse them in [`processors/processors/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/processors).

<DeepDive title="The runner, ordering rules and tests">

- [`ProcessorRunner`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/runner.ts#L329) runs each processor as a workflow step with its own span. A processor error is reported from a step named `processor:<id>`, and spans are named `<phase> processor: <id>` by default.
- Processors contributed by a `SignalProvider` are **prepended** to the agent's input processors and **appended** to its output processors ([agent.ts L1121](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts#L1121)). Memory and channel output processors are added at [L2233-2241](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts#L2233).
- Changes to the processor API itself should land in a separate PR first and be *"generally useful rather than shaped around one feature"* (same `AGENTS.md`).

Tests worth reading:

- [`runner.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/runner.test.ts)
- [`process-input-step.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/process-input-step.test.ts)
- [`output-processor-tool-execution.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/output-processor-tool-execution.test.ts)
- [`batch-parts.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/processors/batch-parts.ts): a built-in that buffers stream parts. Compare it with your redactor from Station 3.

</DeepDive>

<StationDone module="03" :station="2" />

<Journey :station="3" module="03" />

## Break it {#break-it}

Remember the leaky redactor from Tuesday? Here it is. Step through the chunks with each processor:

<StreamChunker />

Stream processors see **deltas, not words**. The provider decides where chunks split, and it doesn't care about your regex.

That's bug one of three:

<IdeaCards :cards="bugs" />

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m03-processors/break-it.test.ts">

Five tests fail on the starters. Solutions and the limitation you'll discover are on the [Break it page](./break-it).

</TryIt>

<Misconception myth="If my streaming guardrail trips, the user never sees the bad output.">

A streaming guardrail can **stop, not unsay**. When `processOutputStream` trips on chunk 2, chunk 1 has already reached the client. The lab shows it: `text-delta:"hello "` then `tripwire`. If one leaked chunk is too many, buffer (and accept latency) or guard in `processOutputStep` / `processOutputResult`.

</Misconception>

<Misconception myth="A buffering redactor can just emit the held-back text as an extra chunk at the end.">

`processOutputStream` is **one chunk in, at most one chunk out**, and the `writer` only emits `data-*` parts. The solution has to flush its tail *in place of* `text-end`. The text ends up correct, the chunk sequence doesn't. That's a real gap, and a capstone candidate (Module 10).

</Misconception>

<Quiz module="03" id="where" question="Compliance says: not a single character of a secret may ever reach the screen. Where do you enforce it?" :options="q_where" />

<StationDone module="03" :station="3" />

<Journey :station="4" module="03" />

## Choose wisely {#choose-wisely}

<Choose subject="a processor" :rows="choose" />

<Callout type="analogy" title="Model middleware vs loop middleware">

The AI SDK's `wrapLanguageModel` middleware (`transformParams`, `wrapGenerate`, `wrapStream`) wraps **one model call**. It never sees tool results, and it can't run once per run. Think of it as a filter on one pipe.

LangChain's agent middleware (`before_model`, `after_model`, `wrap_tool_call`, …) is the closest cousin to Mastra processors, with similar phases. Mastra's extras: per-run `state`, the tripwire contract (`abort` with retry), processors as workflow steps (spans, ordering), and the fact that Mastra's own features use the same API, which keeps it general.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="03" />

<StationDone module="03" :station="4" next="./lab" next-label="On to the lab" />

## Wrap-up

<Podcast title="Processors, in four minutes" :minutes="4">

**Host:** What's a processor?

**Loopy:** An object with an id and some hooks. Mastra calls those hooks at fixed points in the agent loop, in order, and each one can rewrite what passes through or stop the run.

**Host:** Which hooks matter most?

**Loopy:** `processInput` runs once at the start. `processInputStep` runs before every model call, perfect for context and budgets. `processOutputStream` runs on every chunk as it streams. `processOutputStep` runs after the model's turn but before any tool, so it can veto a dangerous call. `processToolResult` cleans up tool output. And `processOutputResult` runs once at the end.

**Host:** What if I stack three of them?

**Loopy:** Array order, every time. Each sees the previous one's output. If X and Y both tag a chunk, you get `hi[X][Y]`.

**Host:** Tell me about the leaky redactor.

**Loopy:** The secret got split across two chunks. A per-chunk regex saw `sk-ab` in one and `c123` in the other and neither looked like a whole secret. The fix is to buffer the possibly-secret tail in the processor's `state` and only release text that can't be part of a secret anymore.

**Host:** Any other classic bugs?

**Loopy:** Two. Keeping a counter in a module-level variable, which leaks across runs and across users. Use `state`. And an enrichment processor that throws, which kills the run. Nice-to-haves should fail open.

**Host:** And the house rule?

**Loopy:** Before adding a feature to Mastra, check whether it can be a processor. Most of Mastra's own features are.

</Podcast>

<Recall module="03" :cards="recall" />

<CheatCard module="03" title="Processors" subtitle="Ten hooks, one house rule" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 3](./lab):** composition and tripwires against the real package.
- **[Break it](./break-it):** three exercises, with solutions.
- **[Check your understanding](./quiz)**
- **[Module 4: Memory](/m04/):** which, you'll notice, is made of processors.

</Callout>
