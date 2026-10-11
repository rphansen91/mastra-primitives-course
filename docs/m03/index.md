# Module 3: Processors as the extension point

**Goal:** understand processors as Mastra's primary extension mechanism: every hook, the order they run in, how they compose, how they fail, and why the repo's own rule is *"check whether it can be a processor"* before adding core API.

**Lab:** [`labs/m03-processors`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m03-processors) · [Lab guide](./lab) · [Break it](./break-it) · [Quiz](./quiz)

## Pass 1: the problem

Every production agent needs cross-cutting behavior: redact PII, block prompt injection, trim context to a token budget, inject memory, retry on provider errors, enforce "never deploy twice", stream moderation. If each of these is a flag on `Agent`, the core grows without bound and every feature is a risky change to the hottest code path. If each is a fork of the loop, nothing composes.

You need **named, ordered, composable hooks at every phase of the loop**, with per-run state and a standard way to abort. That's a processor.

## Pass 2: how it's built

### The interface

[`Processor`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L625) is an object with an `id` and any subset of these methods:

| Hook | When | Returns | Typical use |
|---|---|---|---|
| [`processInput`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L700) | once, before the first step | messages | guardrails on user input, enrichment |
| [`processInputStep`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L728) | before **every** model request | messages / MessageList, plus optional model/tools overrides | context injection, tool gating, per-step budgets |
| [`computeStateSignal`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L750) | per request | a state signal | always-current state (task list, goal) |
| [`processLLMRequest`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L771) | right before the provider call | the provider prompt | provider-specific rewrites, caching |
| [`processOutputStream`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L707) | per streamed chunk | chunk, or `null` to drop | streaming redaction, moderation |
| [`processLLMResponse`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L795) | after the provider response | | response inspection |
| [`processOutputStep`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L812) | after each model step, **before tools run** | messages | vet tool calls, structured checks |
| [`processToolResult`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L836) | after each tool | tool result | truncate/redact tool output |
| [`processOutputResult`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L716) | once, at the end | messages | final guardrails, persistence shaping |
| [`processAPIError`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L852) | on provider errors | retry decision | stream retry, model fallback |

Every hook gets a context with `abort(reason, { retry?, metadata? })` (a **tripwire**), a per-processor-per-run `state` object, the `requestContext`, the `agent`, and an optional `writer` that can emit `data-*` chunks.

The [`ProcessorRunner`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/runner.ts#L329) runs each processor as a workflow step with its own span, which is why a processor error is reported from a step named `processor:<id>` (and spans are named `<phase> processor: <id>` by default).

### Order and composition

- Input processors run **in array order**; each sees the previous one's output.
- Output stream processors run in array order **on every chunk**; `X` then `Y` means `Y` sees `X`'s rewrite.
- Processors contributed by a `SignalProvider` are **prepended** to the agent's input processors and **appended** to its output processors ([agent.ts L1121](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/agent.ts#L1121)). Memory and channel output processors are added at [L2233-2241](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/agent.ts#L2233).

Verified in the lab on 1.75.0:

```text
processInput A
processInput B
processOutputStream X sees "hi"
processOutputStream Y sees "hi[X]"
final text: hi[X][Y]
```

### The ethos: processor over core API

From [`packages/core/AGENTS.md`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/AGENTS.md):

> Before adding a feature, check whether it can be a processor. Processors are self-contained and need no changes to core internals, so they carry far less risk of breaking existing behavior, and they can be registered automatically for all users rather than requiring each user to configure them.

> If a feature does need core processor API changes, land them in a separate PR first. They should be generally useful rather than shaped around one feature…

You can see the rule applied across the codebase. These all ship as processors (plus tools), not `Agent` methods:

- the task list and goals (`TaskStateProcessor`, `GoalStateProcessor`),
- signal providers' prompt hints,
- cross-agent expected-reply enforcement in mastracode,
- stream retry (`StreamErrorRetryProcessor`),
- memory, moderation, PII, prompt-injection detection, token limiting, structured output, skills ([`processors/processors/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/processors)).

## Pass 3: where it breaks

The [break-it exercises](./break-it) hit the three most common processor bugs:

1. **Chunk boundaries.** A per-chunk regex redactor leaks `sk-ab` + `c123`. Stream processors see deltas, not words.
2. **Module-scope state.** A counter in a closure is shared by every run (and every user) in the process. Use the `state` argument.
3. **Fail-closed enrichment.** A throwing processor fails the whole run with `Input processor error`. That's right for guardrails, wrong for nice-to-haves.

And two structural limits you'll observe in the lab:

- **A streaming guardrail can stop, not unsay.** When `processOutputStream` tripwires on chunk 2, chunk 1 has already gone to the client:

  ```text
  chunks: start, step-start, text-start, text-delta:"hello ", tripwire
  ```

  If leaking even one chunk is unacceptable, buffer (and accept latency) or guard in `processOutputStep`/`processOutputResult` instead.
- **One chunk in, at most one chunk out.** `processOutputStream` can rewrite or drop a chunk, but can't emit an extra text chunk (the `writer` only emits `data-*` parts). The buffering redactor in the solution has to flush its held-back tail *in place of* `text-end`. That's a candidate primitive for the capstone.

## Pass 4: when to choose something else

| Use a processor when | Don't when | Alternatives |
|---|---|---|
| Behavior is cross-cutting (applies to many agents or every step) | It's one tool's business logic | Put it in the tool |
| You need a hook at a specific loop phase | You need different control flow (branching, fan-out) | Workflow (Module 5) |
| It must be reusable and shippable as a package | It needs to persist state across runs | Memory / storage (Module 4), state signals |
| Guardrails, redaction, budgets, context shaping | It must react to an external event mid-run | Signals (Module 6) |

### Compare: LangChain/LangGraph middleware and AI SDK middleware

The AI SDK's `wrapLanguageModel` middleware (`transformParams`, `wrapGenerate`, `wrapStream`) is a model-level hook: it sees one model call, not the agent loop, so it can't see tool results or run once per run. LangChain's agent middleware (`before_model`, `after_model`, `wrap_tool_call`, …) is the closest analogue to Mastra processors, with similar phases. Mastra's distinguishing features are the **per-run `state`**, the **tripwire** contract (`abort` with retry), processors-as-workflow-steps (spans, ordering), and the fact that the framework's own features are built on the same API, so the API stays general.

## Read the source and tests

- [`processors/runner.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/runner.ts#L329) and [`runner.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/runner.test.ts)
- [`process-input-step.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/process-input-step.test.ts)
- [`output-processor-tool-execution.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/output-processor-tool-execution.test.ts)
- [`processors/processors/batch-parts.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/processors/batch-parts.ts): a built-in that buffers stream parts. Compare it with your redactor.
