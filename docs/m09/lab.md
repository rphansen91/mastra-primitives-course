---
pageClass: lesson
aside: false
---

<script setup>
const cmdLab = 'npm run lab:observe\nnode --import tsx --test m09-evals/lab.test.ts'
const outEx = 'not ok 1 - [exercises] ex9.1: the scorer reads answers that come after a tool call\n    Why did CI fail?         → 0 (does not name the failure reason)\n    Is CI green?             → 0 (does not name the failure reason)\n    What broke the build?    → 0 (does not name the failure reason)'
const q_judge = [
  { text: 'Only the answer', why: 'Then it couldn\'t tell grounded claims from invented ones.' },
  { text: 'Its instructions as the system prompt, then your createPrompt text with the tool result and the answer', correct: true, why: 'Lab output: `judge saw: system You are a strict grader.` then `user Tool result: … Answer: …`. A judge is just another model call, so you can test its prompt.' },
  { text: 'The whole agent transcript', why: 'Only what your `createPrompt` puts in. You choose the evidence.' },
]
const q_hash = [
  { text: '1', why: 'The tool call and the final answer are two separate model calls.' },
  { text: '2', correct: true, why: 'One for the tool call, one for the answer. Each is keyed by a hash of the prompt it was answering.' },
  { text: '3', why: 'The tool itself isn\'t a model call; it runs for real on replay.' },
]
</script>

# Lab 9: Observe the course

<LabHeader module="09" folder="m09-evals" runs="~3 s" :tests="5" mood="thinking">

Five experiments on Module 2's CI helper: read its trace, score it with a rule and with a judge, let a scorer drive the loop, and record/replay it. Everything is a mock, including the judge, so every assertion is deterministic.

</LabHeader>

<TryIt :cmd="cmdLab" />

## 9.1 The trace

[`observe.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m09-evals/observe.ts) registers `Observability` from `@mastra/observability` with a `TestExporter`, runs the agent once, and prints the span tree from `exporter.getCompletedSpans()`:

```text
=== 1) The trace of one agent run (model_chunk spans hidden) ==============
  agent_run        agent run: 'ci-helper'
    model_generation llm: 'mock'
      model_step       step: 0
        processor_run    llm request processor: provider-history-compat
        model_inference  inference: 0
        tool_call        tool: 'check_ci'
      model_step       step: 1
        processor_run    llm request processor: provider-history-compat
        model_inference  inference: 1
```

The test asserts **names and nesting**, never timing.

## 9.2 Scorers: a rule and a judge

`runEvals` runs the agent over a 3-item dataset with the (fixed) `mentions-reason` scorer:

```text
=== 2) Rule-based scorer over a 3-item dataset (runEvals) =================
  Why did CI fail?         → 1 (names the failure reason)
  Is CI green?             → 0 (does not name the failure reason)
  What broke the build?    → 1 (names the failure reason)
  average: 0.6666666666666666
```

Then a `grounded` scorer with `judge: { model, instructions }` and an `.analyze({ outputSchema, createPrompt })` stage. The judge is a scripted mock that returns `{ grounded: false, unsupported: ['the build uses Rust'] }`.

<Quiz kind="predict" module="09" id="lab-judge" question="What does the judge model receive?" :options="q_judge" />

```text
=== 3) LLM-judge scorer (the judge is a mock model too) ===================
  score: 0 | unsupported: the build uses Rust
  judge saw: system    You are a strict grader.
  judge saw: user      Tool result: {"status":"failed","reason":"lint error in auth.ts"} Answer: CI failed because the build uses Rus
```

## 9.3 A scorer drives the loop

`agent.generate(prompt, { isTaskComplete: { scorers: [citations], strategy: 'all' } })`. The model writes two drafts without a citation, then one with `[1]`:

```text
=== 4) isTaskComplete: a scorer keeps the loop going ======================
  model calls: 3
  feedback the model saw: assistant #### Completion Check Results Overall: ❌ NOT COMPLETE **citations** (citations) Score: 0 ❌
  result.text: Draft 1: Mastra is a TypeScript agent framework.Draft 2: Mastra is a TypeScript agent framework. Mastra is a TypeScript agent framework [1].
```

The feedback arrives as an **assistant** message, and `result.text` accumulates all three attempts.

## 9.4 Record once, replay forever

[`recorder.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m09-evals/recorder.ts) wraps a model, saves each response under a hash of its prompt, and replays from the tape, reporting any prompt that isn't on it.

<Quiz kind="predict" module="09" id="lab-hash" question="How many entries does the tape have after one CI-helper run?" :options="q_hash" />

```text
=== 5) Record once, replay deterministically, catch prompt drift ==========
  tape dc3ae83bd1 → tool check_ci
  tape d95ce05e46 → text
  replay, same code:      CI failed on PR 42: lint error in auth.ts. | misses: 0
  replay, new instructions: [
  'call 1: prompt fcdcb0443f not on tape (expected dc3ae83bd1)',
  'call 2: prompt 0c8b68d71b not on tape (expected d95ce05e46)'
]
```

## Break it: Exercise 9.1, the scorer that only scores zeros {#break-it-exercise-9-1-the-scorer-that-only-scores-zeros}

**File:** [`exercises/ex1-mentions-reason.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m09-evals/exercises/ex1-mentions-reason.ts)

```ts
.preprocess(({ run }) => {
  const text: string = run.output[0]?.content?.parts?.[0]?.text ?? '';
  return { text };
})
```

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m09-evals/break-it.test.ts" :output="outEx" />

**Task:** the dataset should score `[1, 0, 1]`. Change only `preprocess`.

<Reveal title="Show the solution and why">

```ts
.preprocess(({ run }) => {
  const text = (run.output ?? [])
    .filter((m) => m.role === 'assistant')
    .flatMap((m) => m.content?.parts ?? [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n');
  return { text };
})
```

- **Why:** an agent scorer's `run.output` is a list of stored messages, each a list of **parts**. After a tool call, the assistant message is `tool-invocation + step-start + text`, so part 0 has no `.text`.
- **The lesson generalizes:** a scorer that silently returns 0 looks exactly like a bad agent. Add a test with a known-good answer to every scorer.

</Reveal>

## More tasks

1. **Score traces.** Store spans in a storage-backed exporter and run `mentions-reason` over stored traces instead of live runs.
2. **Sampling.** Attach the scorer to the agent with sampling at 50%. Over 20 runs, how many scores do you get? Make it deterministic for the test.
3. **Signal attribution.** Run Module 6's mid-run signal lab with tracing on. Where does the signal show up in the span tree? What attribute would you add?
4. **Replay through a processor.** Record a run, then add a processor that rewrites the system prompt. Which tape entries miss? Write a "re-record on purpose" script.
