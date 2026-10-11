---
pageClass: lesson
aside: false
---

<script setup>
const cmdLab = 'npm run lab:memory\nnode --import tsx --test m04-memory/lab.test.ts'
const outEx = 'not ok 1 - [exercises] ex4.1: two threads learn two facts at once; both survive\n  working memory lost an update: {"city":"Lisbon"}'
const q_pairs = [
  { text: 'The tool result, without its call (the window cut between them)', why: 'That would be invalid for most providers. And Mastra doesn\'t store them separately.' },
  { text: 'Both the call and the result, together', correct: true, why: 'Mastra stores the call and its result as **one** assistant message (`tool-invocation + step-start + text`). The window counts it once, so it can\'t split it.' },
  { text: 'Neither: tool messages are filtered out of history', why: 'They\'re kept. The model needs to know what it already looked up.' },
]
const q_friday = [
  { text: 'Yes: the Monday messages are loaded into Friday\'s history', why: 'History is per **thread**. Friday\'s history is just "Plan Friday dinner."' },
  { text: 'Yes: working memory is resource-scoped, so it crosses threads', correct: true, why: 'Working memory with `scope: \'resource\'` follows the user into every thread, as a system message.' },
  { text: 'No: different thread, clean slate', why: 'That\'s true for message history, not for resource-scoped working memory.' },
]
</script>

# Lab 4: Memory under pressure

<LabHeader module="04" folder="m04-memory" runs="~3 s" :tests="5" mood="thinking">

Four small experiments in [`memory-under-pressure.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m04-memory/memory-under-pressure.ts), each built on `MockMemory` + `InMemoryStore` from the real package. Every assertion reads the **prompts the model actually received**, never Mastra's internal state.

</LabHeader>

<TryIt :cmd="cmdLab" />

## 4.1 The history window

`lastMessages: 5`, eight exchanges, and the important fact in message 1. The model gets the system prompt, **five** history messages and the new one:

```text
=== 1) lastMessages: 5 after 8 exchanges (16 stored messages) =============
stored messages: 16
  system    You are a dinner planner.
  assistant reply 5
  user      message 6
  ...
  user      message 8
model still knows "vegetarian"? false
```

Notice the window **starts with an assistant reply**. It counts messages, not exchanges.

## 4.2 Tool pairs

<Quiz kind="predict" module="04" id="lab-pairs" question="`lastMessages: 3`, and the oldest message in the window is the one where the model called `find_menu`. What does the prompt contain?" :options="q_pairs" />

```text
  stored  assistant: tool-invocation + step-start + text
  prompt  assistant [tool-call find_menu]
  prompt  tool      [tool-result find_menu: {"dishes":["mushroom risotto","dal"]}]
  prompt  assistant reply 3
```

One stored message became three provider messages. If you ever trim **provider** messages yourself (in a `processLLMRequest`, say), keep pairs together: [`groupLinkedToolMessages`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/load-message-history.ts#L49) is how the loader does it.

## 4.3 Waking with and without memory

```text
WITHOUT memory: wake
  system    You are a dinner planner.
  user      <notification source="booking-api">Verde has a table at 7pm</notification>
WITH memory: wake
  system    You are a dinner planner.
  user      I am vegetarian. Book dinner for two.
  assistant Noted: vegetarian, dinner for two.
  user      <notification source="booking-api">Verde has a table at 7pm</notification>
```

Same signal, same thread id. The only difference is whether anything was **stored**.

## 4.4 Working memory across threads

<Quiz kind="predict" module="04" id="lab-friday" question="On Monday's thread the model saved `- diet: vegetarian` to resource-scoped working memory. On a **new** Friday thread, does the model know?" :options="q_friday" />

```text
memory tools offered to the model: [ 'updateWorkingMemory' ]
Friday thread sees "diet: vegetarian"? true
Friday thread history: [ 'user      Plan Friday dinner.' ]
```

## Break it: Exercise 4.1, the lost fact

**File:** [`exercises/ex1-remember-fact.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m04-memory/exercises/ex1-remember-fact.ts)

Two threads of `user-1`, `chat-web` and `chat-mobile`, run **at the same time**. Each model calls `remember_fact` once: `diet: vegetarian` on one, `city: Lisbon` on the other. The tool reads resource-scoped working memory, awaits something, then writes the whole note back.

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m04-memory/break-it.test.ts" :output="outEx" />

**Task:** both facts must survive. Don't change the test or the model script.

<Reveal title="Show the solution and the trade-off">

Serialize the read-modify-write **per resource** with a promise chain:

```ts
const chains = new Map<string, Promise<unknown>>();
function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  chains.set(key, next.catch(() => {}));
  return next;
}
// in execute:
return serialize(resourceId, async () => {
  const facts = parseFacts(await ctx.memory.getWorkingMemory({ threadId, resourceId }));
  facts[key] = value;
  await ctx.memory.updateWorkingMemory({ threadId, resourceId, workingMemory: renderFacts(facts) });
  return { saved: key };
});
```

- **Trade-off:** the lock lives in one process. With two server instances you need the store to do it atomically (a transaction, a compare-and-set on a version column) or a lease. That's Module 1's lost-update rule again.
- **Why not `scope: 'thread'`?** No race, but no sharing either: the Friday thread forgets the diet.
- Mastra's full memory package handles merges differently; see [`merge-working-memory.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/memory/src/merge-working-memory.test.ts).

</Reveal>

## More tasks

1. **Token budget.** Replace `lastMessages: 5` with `messageHistory: { maxTokens: … }`. Find the value that keeps exactly three exchanges. What happens to a single very long message?
2. **Signal history.** Persist a signal with `ifIdle: { behavior: 'persist' }`, then start a normal run. Is the signal in the history? Compare with [`recall-signal-exclusions.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/recall-signal-exclusions.test.ts).
3. **Mid-run messages.** Start a slow run on a thread, and while it's running save a message to the same thread from outside. Does the running agent's next request include it? (Predict first.)
4. **Recall.** Add semantic recall with an in-memory vector store and a fake embedder. Make message 1 come back for "what should I avoid eating?".
