---
pageClass: lesson
aside: false
---

<script setup>
const cmd1 = "npm run lab:processors\nnode --import tsx --test m03-processors/lab.test.ts"
const q_trip = [{"text": "Nothing: a tripwire discards the whole response", "why": "Chunks already emitted are gone. There is no un-sending."}, {"text": "`\"hello \"`", "correct": true, "why": "The first delta was emitted before the guard saw the second. Plan for partial output."}, {"text": "`\"hello world\"`: the guard just drops the bad chunk", "why": "That would be returning `null` for one chunk. `abort()` stops the stream."}]
</script>

# Lab 3: Processor composition and tripwires

<LabHeader module="03" folder="m03-processors" runs="~2 s" :tests="3" mood="thinking">

Processor order made visible, and two tripwires: one that stops a request before the model is called, and one that stops a stream halfway.

</LabHeader>


<TryIt :cmd="cmd1" />

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

<Quiz kind="predict" module="03" id="lab-trip" question="The model streams `&quot;hello &quot;`, `&quot;forbidden &quot;`, `&quot;world&quot;`. The guard aborts on the second chunk. What text has the consumer received?" :options="q_trip" />

- **Stream tripwire.** The model streams `"hello "`, `"forbidden "`, `"world"`. The guard aborts on the second chunk:

```text
chunks: [ 'start', 'step-start', 'text-start', 'text-delta:"hello "', 'tripwire' ]
text: 'hello '
tripwire: { reason: 'policy violation', processorId: 'word-guard', ... }
```

`"hello "` reached the consumer. Plan for it.

## Tasks

1. **Order with providers.** Read [agent.ts L1121](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts#L1121). If a `SignalProvider` contributes an input processor P and the agent has [A, B], what's the order? Add a test using a tiny `SignalProvider` subclass with `getInputProcessors()`.
2. **Retry tripwire.** Change the stream guard to `abort('…', { retry: true })`. What does the loop do? How many model calls? (Read the `processOutputStep` doc comment around [L806](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts#L806).)
3. **Tool gating.** Write a `processOutputStep` processor that drops a `deploy` tool call if one already ran in this run (use `state`). Prove the tool never executes.
4. **Drop a chunk.** Return `null` from `processOutputStream` for reasoning chunks. What do clients see? What's persisted?
5. **Stretch: a `processToolResult`** that truncates results over 2 KB and adds `truncated: true`. Check what the model sees in `prompts`.
