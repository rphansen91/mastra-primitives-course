# Lab 3: Processor composition and tripwires

**Code:** [`labs/m03-processors`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m03-processors) · **Runs in:** ~2 s

```bash
npm run lab:processors
node --import tsx --test m03-processors/lab.test.ts
```

## 3.1 Composition

[`composition.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m03-processors/composition.ts) registers two input processors (A, B) and two output processors (X, Y), each tagging the text.

```text
=== Processor order =======================================================
  processInput A
  processInput B
  processOutputStream X sees "hi"
  processOutputStream Y sees "hi[X]"
final text: hi[X][Y]
```

## 3.2 Tripwires

[`guardrails.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m03-processors/guardrails.ts):

- **Input tripwire.** `processInput` calls `abort('possible SQL injection')`. Result: `tripwire: { reason, processorId: 'sql-guard' }`, empty text, and **zero model calls**.
- **Stream tripwire.** The model streams `"hello "`, `"forbidden "`, `"world"`. The guard aborts on the second chunk:

```text
chunks: [ 'start', 'step-start', 'text-start', 'text-delta:"hello "', 'tripwire' ]
text: 'hello '
tripwire: { reason: 'policy violation', processorId: 'word-guard', ... }
```

`"hello "` reached the consumer. Plan for it.

## Tasks

1. **Order with providers.** Read [agent.ts L1121](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/agent.ts#L1121). If a `SignalProvider` contributes an input processor P and the agent has [A, B], what's the order? Add a test using a tiny `SignalProvider` subclass with `getInputProcessors()`.
2. **Retry tripwire.** Change the stream guard to `abort('…', { retry: true })`. What does the loop do? How many model calls? (Read the `processOutputStep` doc comment around [L806](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/index.ts#L806).)
3. **Tool gating.** Write a `processOutputStep` processor that drops a `deploy` tool call if one already ran in this run (use `state`). Prove the tool never executes.
4. **Drop a chunk.** Return `null` from `processOutputStream` for reasoning chunks. What do clients see? What's persisted?
5. **Stretch: a `processToolResult`** that truncates results over 2 KB and adds `truncated: true`. Check what the model sees in `prompts`.
