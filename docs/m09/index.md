# Module 9: Evals and observability

**Goal:** treat agent quality and agent behavior as observable, testable data: spans for every loop step and processor, scorers that grade outputs (live, on traces, and in CI), datasets and experiments, record/replay of model calls for deterministic tests, and time travel for debugging.

**Depth:** lesson + lab spec.

## Pass 1: the problem

Everything in Modules 2 to 8 is invisible by default. When an always-on agent did something odd at 3 a.m. you need to answer: which signal woke it, which processor rewrote the prompt, which tool call repeated after recovery, and was the answer any good? And before you ship a processor change, you want to know it didn't make answers worse. Unit tests with a mock model (this course's labs) prove *mechanics*; they can't prove *quality*.

## Pass 2: how it's built

### Tracing: the loop's structure is the trace's structure

Because the loop, prepare-stream, processors and tool calls are all **workflow steps** (Modules 2, 3, 5), each one gets a span: agent run → model step → `<phase> processor: <id>` → tool call. Processors can rename/retype their spans ([`Processor` docs at L625](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L625) describe `spanType`/`spanName`), so memory or task-state processors show up as what they are. Durable recovery keeps a **single-rooted trace** across the crash (covered by the durable crash-recovery tests in [`agent/durable/__tests__/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/durable/__tests__)).

Exporters live under [`observability/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/observability): Langfuse, Braintrust, Datadog, Arize, Laminar and others, plus OpenTelemetry. Docs: [`observability/tracing/overview.mdx`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/docs/src/content/en/docs/observability/tracing/overview.mdx).

### Scorers

[`createScorer`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/evals/base.ts#L1982) builds a scorer as a small pipeline: `preprocess → analyze → generateScore → generateReason`, where each stage is a function or an LLM judge prompt. Scorers attach to agents (live, with sampling), run over stored **traces** ([`evals/scoreTraces/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/evals/scoreTraces)), or run in batch with [`runEvals`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/evals/run/index.ts) over **datasets**, with gates and verdicts for CI ([`docs/evals/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/docs/src/content/en/docs/evals)). Classifier scorers wrap the `Classifier` primitive.

Note `isTaskCompleteStep` in the loop (Module 2, step ⑦): completion scorers can **drive** the loop ("keep going until the scorer says done"), so evals aren't only after the fact.

### Record/replay

Mastra's own test suite runs most agent tests against **recorded** model responses ([`packages/_llm-recorder`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/_llm-recorder)): record once against a real provider, replay deterministically in CI with no keys. The course's mock model is the hand-written version of the same idea.

### Time travel

Workflow [`timeTravel`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/workflows/workflow.ts#L5648) re-executes a run from a chosen step with new context ([docs](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/docs/src/content/en/docs/workflows/time-travel.mdx)). Combined with snapshots it's a "what if this step had returned X" debugger.

## Pass 3: where it falls down

- **No event-sourced history.** There's no per-run journal of every request, response, signal and claim generation like Temporal's history; traces are the closest thing, and they're sampled/exported, not authoritative.
- **No deterministic replay of an agent run against new code.** Time travel re-executes; it doesn't replay recorded model outputs through changed processors.
- **LLM judges are models too.** They drift, cost money and need their own evals. Use rule-based scorers wherever the property is checkable.
- **Mock-model tests can lie.** They prove the loop's mechanics, not that a real model will call the tool. Pair them with recorded and live evals.
- **Signals are hard to attribute.** Which notification caused a wake should be a first-class span attribute; check what your exporter shows.

## Pass 4: when to choose something else

| Use Mastra evals/tracing when | Don't when | Alternatives |
|---|---|---|
| You want spans that match loop/processor/tool structure with no extra code | You already standardize on an observability vendor's SDK | Export Mastra spans to it (Langfuse, Braintrust, Datadog, OTel) |
| Scorers should run live, on traces and in CI with one definition | You need large-scale offline experimentation | Braintrust / LangSmith experiments; your own data pipeline |
| Deterministic CI for agent mechanics | You need provable replay of production incidents | Build the journal (capstone candidate); Temporal-style history |

**Compare: LangSmith.** LangSmith traces LangChain/LangGraph runs and hosts datasets/experiments with LLM-as-judge evaluators. Mastra's design difference is that scorers are a framework primitive (they can gate the loop via task-completion and run inside your process), and tracing comes from the workflow-step structure rather than callbacks.

## Lab 9 spec: "observe the course"

Build `labs/m09-evals/`:

1. **Rule-based scorer.** With `createScorer`, score Module 2's anatomy answers for "mentions the failure reason from the tool result" (pure function, no LLM). Run it over 5 scripted variants and assert scores.
2. **LLM-judge scorer with a mock judge.** Use the mock model as the judge; assert the prompt the judge received contains the input and output.
3. **Completion-driven loop.** Configure task-completion scoring so the agent keeps going until the scorer passes; script the model to succeed on step 3; assert 3 steps.
4. **Trace shape.** Configure an in-memory/console exporter, run Module 6's mid-run signal lab, and assert the span tree contains the tool call, the signal drain, and a processor span (default name `<phase> processor: <id>`).
5. **Break it:** a scorer that reads `output.text` fails on tool-only steps. Make it robust and add a test.

**Acceptance:** tests green with no API keys; the trace assertion checks span names/types, not timing.
