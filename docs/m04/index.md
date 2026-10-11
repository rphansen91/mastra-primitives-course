---
pageClass: lesson
aside: false
---

<script setup>
const outcomes = ["Explain threads vs resources, and what each memory type stores", "Trace how memory reaches the model, as input and output processors", "Predict what gets dropped when the context window fills up", "Choose between working memory, semantic recall and observational memory"]
</script>

# Module 4: Memory

**Goal:** understand what "memory" means mechanically in Mastra (threads and resources, message history, working memory, semantic recall, observational memory), how it reaches the model (as processors), how it bounds the context window, and why woken runs depend on it.

<LessonHero :recap="false" module="04" :minutes="35" lab="Memory spec lab" :outcomes="outcomes" mood="thinking">

**Week three of the pilot.** A user tells your assistant, for the fourth time, that they're vegetarian. The thread is 900 messages long and the model's context window gave up somewhere around message 400.

What does "remember" even mean for a stateless model, and who decides what fits?

</LessonHero>


**Depth:** lesson + lab spec. The lab is yours to build; the spec has acceptance tests.

<Journey :station="1" module="04" />

## The problem {#problem}

An LLM is stateless. Every request must carry everything the model should "remember". Three problems follow:

1. **Identity.** Which messages belong to this conversation, and to this user across conversations?
2. **Budget.** The transcript grows without bound; the context window doesn't.
3. **Relevance.** The most useful memory is often not the most recent (a preference stated 300 messages ago).

And one problem specific to always-on agents: a run **woken by a signal** (Module 6) starts with no caller-supplied messages. If there's no memory, the woken run sees only the signal (the Module 6 lab shows exactly this: request #3 contains only the system prompt and the signal).

<Journey :station="2" module="04" />

## How it's built {#under-the-hood}

### Threads and resources

Memory is keyed by `resource` (usually the user or tenant) and `thread` (one conversation). You pass both per call:

```ts
await agent.stream('hi', { memory: { resource: 'user-1', thread: 'support-42' } });
```

The thread is also the **unit of concurrency** (one active run per thread, Module 2), and the address for signals (Module 6). Memory, concurrency and messaging share one key on purpose.

### Memory is processors

[`MastraMemory`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/memory.ts#L121) defines the contract; the defaults are at [L89](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/memory.ts#L89): `lastMessages: 10`, `semanticRecall: false`, `workingMemory.enabled: false`. The behaviors themselves are **processors** in [`processors/memory/`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/memory):

| Behavior | Processor | What it does |
|---|---|---|
| Message history | [`message-history.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/memory/message-history.ts) | loads the last N messages (or a token budget) for the thread; saves new ones |
| Working memory | [`working-memory.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/memory/working-memory.ts) | a structured scratchpad (Markdown template or schema), per thread or per resource, that the agent updates via a tool |
| Semantic recall | [`semantic-recall.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/memory/semantic-recall.ts) | embeds the query, retrieves similar past messages (with surrounding context) from a vector store |
| Input filtering | [`memory-input-filter.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/processors/memory/memory-input-filter.ts) | keeps recalled/system content from being re-saved |

The agent asks memory for its processors when it builds the run ([agent.ts L2233](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/agent.ts#L2233)). Module 3's rule in action: memory isn't special-cased in the loop; it's processors plus storage.

The full `@mastra/memory` package ([`packages/memory`](https://github.com/mastra-ai/mastra/tree/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/memory)) adds observational memory (background summarization of long threads into observations), token-limited history, thread cloning, and title generation.

### Signals in memory

Signals are stored with `role: 'signal'` (Module 6). History loading must decide which signals to replay; see [`recall-signal-exclusions.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/recall-signal-exclusions.test.ts). Transient signals are delivered to the model but never persisted.

### Where history is loaded

The prepare-stream workflow runs `prepareMemoryStep` in parallel with `prepareToolsStep` ([prepare-stream L230](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/agent/workflows/prepare-stream/index.ts#L230)), before the loop starts. History is loaded **once per run**; messages that other runs add to the thread during this run arrive only through signals or the next run.

<Journey :station="3" module="04" />

## Where it falls down {#break-it}

- **Recency ≠ relevance.** `lastMessages: 10` silently drops the instruction from message 11. Semantic recall helps, but needs a vector store and an embedder (cost, latency, eventual consistency).
- **Tool-call pairs.** Truncating history between a tool call and its result breaks provider validation. The loader groups linked tool messages ([`groupLinkedToolMessages`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/memory/load-message-history.ts#L49)); custom trimming must too.
- **Working memory races.** Two threads updating resource-scoped working memory concurrently can overwrite each other (merge semantics: [`merge-working-memory.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/memory/src/merge-working-memory.test.ts)).
- **Woken runs only know what's stored.** No memory means no history for wake-ups.
- **Memory is not a journal.** It stores the conversation, not the results of side effects. Recovering a crashed run needs Module 7's snapshots.

<Journey :station="4" module="04" />

## When to choose something else {#choose-wisely}

| Use Mastra memory when | Don't when | Alternatives |
|---|---|---|
| Conversations span requests and you need per-user/per-thread history | Single-shot tasks with all context in the prompt | No memory; pass context explicitly |
| You want history, working memory and recall behind one config | You need a full knowledge base with documents, ACLs, freshness | RAG pipeline (Mastra RAG, a search service) as a tool |
| Always-on agents woken by signals | You need exact, auditable state machines | Workflow state (Module 5); your database |
| Long threads that must stay under a budget | You need cross-agent shared memory with transactions | A database with explicit schema; LangGraph store; Letta/Zep-style memory services |

**Compare: LangGraph checkpointer + store.** LangGraph separates *short-term* memory (the checkpointed graph state per thread) from *long-term* memory (a namespaced key-value/vector `store`). Mastra's thread history ≈ LangGraph's checkpointed messages; working memory and semantic recall ≈ the store. The difference: Mastra's checkpoint of a *run* (for crash recovery) is a separate mechanism (Module 7), while LangGraph's checkpointer does both jobs.

## Lab 4 spec: build "memory under pressure"

Build `labs/m04-memory/` against the published package, using `MockMemory` + `InMemoryStore` (both exported from `@mastra/core/memory` and `@mastra/core/storage`) and the course mock model.

1. **History window.** Thread with 15 exchanges, `lastMessages: 5`. Assert from the recorded `prompts` that request 16 contains exactly the last 5 messages plus the new one. Then use a token budget instead and assert the bound.
2. **Tool pairs survive trimming.** Make message 5-from-the-end a tool result. Assert the matching tool call is included too (or both are excluded). Never orphaned.
3. **Woken run with and without memory.** Send a signal to an idle thread (`ifIdle: wake`). Without memory, assert the woken prompt is `[system, signal]`. With memory, assert it includes prior history.
4. **Working memory.** Enable thread-scoped working memory with a template; script the model to call the update tool; assert the next run's prompt contains the updated content.
5. **Break it:** two runs on *different threads* of the same resource update resource-scoped working memory concurrently. Show the lost update, then fix it (serialize, merge, or schema-based updates) and explain the trade-off.

**Acceptance:** `npm test` green; each assertion reads `prompts`, not internal state; a README section with the observed output.
