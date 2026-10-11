---
pageClass: lesson
aside: false
---

<script setup>
const B = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae'
const T = 'https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae'
const outcomes = [
  'Explain threads vs resources, and why one key does three jobs',
  'Trace how memory reaches the model, as storage plus input processors',
  'Predict exactly which messages a request carries, and what falls out',
  'Know what a run woken by a signal can and cannot remember',
  'Choose between history, working memory, semantic recall and your own database',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const problems = [
  { title: 'Identity', body: 'Which messages belong to *this* conversation, and to this user across conversations?', icon: 'map', color: 'violet' },
  { title: 'Budget', body: 'The transcript grows forever. The context window does not.', icon: 'clock', color: 'amber' },
  { title: 'Relevance', body: 'The most useful thing is often not the most recent: a preference from 300 messages ago.', icon: 'star', color: 'sky' },
  { title: 'Wake-ups', body: 'A run woken by a signal (Module 6) has **no caller**. Nobody passes it any history.', icon: 'mail', color: 'coral' },
]
const q_wake = [
  { text: 'The whole thread, since the thread id is known', why: 'Knowing the thread id is not the same as loading its history. Something has to load it.' },
  { text: '`[system, signal]` and nothing else', correct: true, why: 'Exactly what the lab prints. No memory means no history to load, so the woken model meets the signal cold.' },
  { text: 'An error: you can\'t wake a thread without memory', why: 'The wake works fine (`action: \'wake\'`). It just wakes up with amnesia.' },
]
const procs = [
  { name: 'MessageHistory', short: 'last N, or a token budget', detail: 'Loads recent messages for the thread before the run and saves new ones after. `lastMessages: 10` by default; `messageHistory: { maxTokens }` trims oldest-first by tokens instead.', href: B + '/packages/core/src/processors/memory/message-history.ts', color: 'amber' },
  { name: 'WorkingMemory', short: 'a structured note', detail: 'A Markdown template or a schema, scoped per **thread** or per **resource**. Injected as a system message; the model edits it through an `updateWorkingMemory` tool.', href: B + '/packages/core/src/processors/memory/working-memory.ts', color: 'lime' },
  { name: 'SemanticRecall', short: 'recall by meaning', detail: 'Embeds the new message, searches a vector store for similar past messages, and brings them back **with neighbors** for context. Needs a vector store and an embedder.', href: B + '/packages/core/src/processors/memory/semantic-recall.ts', color: 'sky' },
  { name: 'MemoryInputFilter', short: 'don\'t save twice', detail: 'Keeps recalled and system content from being saved back as if it were new.', href: B + '/packages/core/src/processors/memory/memory-input-filter.ts', color: 'violet' },
  { name: '@mastra/memory', short: 'the full package', detail: 'Adds observational memory (background summaries of long threads), token-limited history, thread cloning and title generation on top of the same contract.', href: T + '/packages/memory', color: 'teal' },
]
const q_window = [
  { text: '`user` "message 6", then 4 more', why: 'Count again: 5 messages back from the newest is an assistant reply.' },
  { text: '`assistant` "reply 5"', correct: true, why: 'The window counts **messages**, not exchanges. It can start mid-exchange, with an assistant turn whose question is gone.' },
  { text: '`user` "I am vegetarian." (the first message is pinned)', why: 'Nothing is pinned. That\'s the whole problem.' },
]
const assembly = [
  'You call `agent.generate()` with `{ resource, thread }`',
  '`prepareMemoryStep` loads history, in parallel with tools',
  'Input processors add working memory and recalled messages',
  'The model request goes out',
  'New messages are saved back to the thread',
]
const out1 = "=== 1) lastMessages: 5 after 8 exchanges (16 stored messages) =============\nstored messages: 16\n  system    You are a dinner planner.\n  assistant reply 5\n  user      message 6\n  assistant reply 6\n  user      message 7\n  assistant reply 7\n  user      message 8\nmodel still knows \"vegetarian\"? false\n...\n=== 3) A signal wakes the idle thread =====================================\nWITHOUT memory: wake\n  system    You are a dinner planner.\n  user      <notification source=\"booking-api\">Verde has a table at 7pm</notification>\nWITH memory: wake\n  system    You are a dinner planner.\n  user      I am vegetarian. Book dinner for two.\n  assistant Noted: vegetarian, dinner for two.\n  user      <notification source=\"booking-api\">Verde has a table at 7pm</notification>"
const breaks = [
  { title: 'Recency ≠ relevance', body: 'A window drops the instruction from message 11, silently. Recall helps, at the cost of a vector store, an embedder and some latency.', icon: 'star', color: 'sky' },
  { title: 'Counting the wrong thing', body: '`lastMessages` counts messages, not tokens. Ten long messages can blow the window. (It\'s deprecated in favor of `messageHistory.maxTokens`.)', icon: 'clock', color: 'amber' },
  { title: 'Working memory races', body: 'Two threads of one user update resource-scoped working memory at once. Read, await, write: one update wins.', icon: 'cards', color: 'coral' },
  { title: 'Loaded once per run', body: 'History is loaded before the loop starts. Messages another run adds during this run arrive only by signal, or next time.', icon: 'reset', color: 'violet' },
  { title: 'Memory is not a journal', body: 'It stores the conversation, not the results of side effects. Crash recovery needs Module 7.', icon: 'skull', color: 'lime' },
]
const q_fix = [
  { text: 'Make the tool wait 25 ms less', why: 'Any `await` between read and write opens the window. Shrinking it just makes the bug rarer, and harder to find.' },
  { text: 'Serialize read-modify-write per resource (a lock)', correct: true, why: 'That\'s the solution file. It works **within one process**. Across processes you need the store to do it atomically, or a lease.' },
  { text: 'Switch working memory to `scope: \'thread\'`', why: 'That avoids the race by not sharing at all. The Friday thread would no longer know you\'re vegetarian.' },
]
const choose = [
  { when: 'Conversations span requests and you need per-user, per-thread history', not: 'Single-shot tasks with everything in the prompt', alt: 'No memory; pass context explicitly' },
  { when: 'You want history, working memory and recall behind one config', not: 'You need a knowledge base with documents, ACLs and freshness', alt: 'A RAG pipeline (Mastra RAG, a search service) exposed as a tool' },
  { when: 'Always-on agents woken by signals', not: 'You need exact, auditable state machines', alt: 'Workflow state (Module 5), or your own database' },
  { when: 'Long threads that must stay under a budget', not: 'Many agents need shared memory with transactions', alt: 'A database with an explicit schema; a dedicated memory service' },
]
const q_pick = [
  { text: 'Semantic recall over all threads', why: 'It might find it, by similarity, if the phrasing matches. A diet is a fact, not a fuzzy memory.' },
  { text: 'Resource-scoped working memory', correct: true, why: 'A small, structured, always-present note per user. Exactly what working memory is for.' },
  { text: '`lastMessages: 500`', why: 'You\'d pay for 500 messages on every request and still lose it at message 501.' },
]
const recall = [
  { q: 'What are `resource` and `thread`?', a: 'Resource: usually the user or tenant. Thread: one conversation. The thread is also the unit of concurrency and the address for signals.' },
  { q: 'Where does memory live in the loop?', a: 'Storage plus **input processors** (MessageHistory, WorkingMemory, SemanticRecall). No special case in the loop.' },
  { q: 'What does a run woken by a signal see, with no memory?', a: '`[system, signal]`. Nothing else.' },
  { q: 'What does `lastMessages` count?', a: 'Messages, not tokens or exchanges. The window can start with an assistant turn. Prefer `messageHistory: { maxTokens }`.' },
  { q: 'Can the history window split a tool call from its result?', a: 'Not in Mastra\'s stored format: the call and its result are one assistant message. Custom trimming of provider messages can.' },
  { q: 'The working memory race, and its fix?', a: 'Two threads read, await, write: one update is lost. Serialize per resource (one process), or make the store do it atomically.' },
]
const cheat = [
  { title: 'Keys', color: 'violet', lines: ['resource = the user / tenant', 'thread = one conversation', 'thread = unit of history, concurrency, signals'] },
  { title: 'Memory = processors', color: 'amber', lines: ['MessageHistory: last N or maxTokens', 'WorkingMemory: note + update tool', 'SemanticRecall: by meaning, with neighbors'] },
  { title: 'Defaults (1.76.0)', color: 'sky', lines: ['lastMessages: 10 (deprecated)', 'semanticRecall: false', 'workingMemory: off'] },
  { title: 'Woken runs', color: 'coral', lines: ['No memory → [system, signal]', 'With memory → history + signal', 'Only what was stored'] },
  { title: 'Gotchas', color: 'lime', lines: ['Recency ≠ relevance', 'Counts messages, not tokens', 'Loaded once per run', 'Resource WM read-modify-write races'] },
  { title: 'Choose', color: 'teal', lines: ['Facts about a user → working memory', 'Fuzzy past → semantic recall', 'Documents → RAG tool', 'Exact state → workflow / database'] },
]
</script>

# Module 4: Memory

<p class="lead">A language model is a goldfish with a very large vocabulary. Every request starts from zero. "Memory" is everything you decide to tape to the bowl before it swims past, and in Mastra that decision is made by a few small, readable processors.</p>

<LessonHero module="04" :minutes="40" lab="Memory lab, ~3 s, no API keys" :outcomes="outcomes" mood="thinking">

**Week three of the pilot.** A user tells your dinner-planning assistant, for the fourth time, that they're vegetarian. You check the logs. The assistant *did* hear it, in message 1. By message 30 it's suggesting a steakhouse.

Then the booking API sends a "table confirmed" signal. The woken run greets the user like a stranger. Nothing crashed. Nothing errored. It just... forgot.

</LessonHero>

<Journey :station="1" module="04" />

## The problem {#problem}

An LLM is stateless. Every request must carry everything the model should "remember". That sounds simple until you hit these four:

<IdeaCards :cols="4" :cards="problems" />

<Callout type="analogy" title="A goldfish with a notebook">

The model is the goldfish: brilliant for three seconds, then nothing. Memory is the notebook you keep next to the bowl. Before each question you tape some pages to the glass: the last few things said (history), a sticky note of facts (working memory), and anything from the archive that looks related (recall). The bowl is only so big, so you can't tape the whole notebook.

</Callout>

<Quiz kind="predict" module="04" id="wake" question="An agent has **no memory configured**. A signal wakes its idle thread. What's in the model's prompt?" :options="q_wake" />

<StationDone module="04" :station="1" />

<Journey :station="2" module="04" />

## Under the hood {#under-the-hood}

### Threads and resources

Memory is keyed by two ids you pass on every call:

```ts
await agent.stream('hi', { memory: { resource: 'user-1', thread: 'support-42' } });
```

<ThreadsResources />

### Memory is processors

[`MastraMemory`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/memory/memory.ts#L121) defines the contract. The behavior lives in **input processors** that read from storage and write into the `MessageList`. Module 3's house rule, applied to Mastra's own memory:

<MemoryLayers />

<ClickMap title="The memory processors" :stations="procs" start-label="storage" end-label="MessageList" />

### Now you drive

Here's the dinner thread from the story. Make it longer, switch memory features on and off, and watch what reaches the model:

<ContextBudget />

<Callout type="note" title="Defaults at the pinned commit">

From [`memory.ts` L89](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/memory/memory.ts#L89): `lastMessages: 10`, `semanticRecall: false`, working memory off. On 1.75.0 and 1.76.0, `lastMessages` is marked **deprecated**: *"Counting messages is a poor proxy for context size. Prefer `messageHistory` to bound history by a token budget."*

</Callout>

<Quiz kind="predict" module="04" id="window" question="`lastMessages: 5`. The thread has 8 exchanges (16 messages) and you send message 8. What's the first message after the system prompt?" :options="q_window" />

Put a request's memory work in order:

<OrderSteps module="04" id="assembly" prompt="Order what happens to memory during one agent.generate() call." :items="assembly" explain="History is loaded **once per run**, before the loop, in `prepareMemoryStep` (in parallel with `prepareToolsStep`). The processors then run before each model request." />

<TryIt cmd="npm run lab:memory" :output="out1">

Four experiments against the real package, each asserting on the **prompts the model received**: the history window, tool pairs, a woken run with and without memory, and working memory crossing threads.

</TryIt>

<DeepDive title="Signals in memory, tool pairs, and where history is loaded">

- **Where history is loaded.** The prepare-stream workflow runs `prepareMemoryStep` in parallel with `prepareToolsStep` ([prepare-stream L230](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/workflows/prepare-stream/index.ts#L230)), before the loop starts. The agent asks memory for its processors at [agent.ts L2233](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts#L2233).
- **Tool pairs.** Mastra stores a tool call and its result in **one** assistant message (the lab shows `assistant: tool-invocation + step-start + text`), so the window can't split them. The loader still groups linked tool messages for older formats: [`groupLinkedToolMessages`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/memory/load-message-history.ts#L49). If you trim **provider** messages yourself, you must keep pairs together.
- **Signals in memory.** Signals are stored with `role: 'signal'` (Module 6). Which ones get replayed into history is a choice: see [`recall-signal-exclusions.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/memory/recall-signal-exclusions.test.ts). Transient signals reach the model but are never stored.
- **Working memory merges.** How concurrent updates merge in the full package: [`merge-working-memory.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/memory/src/merge-working-memory.test.ts).
- **The full package.** [`packages/memory`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/memory): observational memory, token-limited history, thread cloning, title generation.

</DeepDive>

<StationDone module="04" :station="2" />

<Journey :station="3" module="04" />

## Break it {#break-it}

Five ways memory lets you down without throwing a single error:

<IdeaCards :cards="breaks" />

<Misconception myth="My agent remembers the whole conversation.">

It remembers what's **stored** and sends what's **selected**. With the defaults, that's the last 10 messages. Everything older is still in the database, invisible to the model, until semantic recall or working memory brings it back.

</Misconception>

<Misconception myth="If another conversation tells the user's agent something, the running agent sees it right away.">

History is loaded **once per run**. A message added to the thread by another run, mid-way through yours, doesn't appear in your next model request. If it must reach a running agent, send it as a signal (Module 6).

</Misconception>

### Your mission: the lost fact

<Callout type="tip" title="Exercise 4.1">

Two chats with the same user, web and mobile, each learn one fact at the same moment: "I'm vegetarian" and "I just moved to Lisbon". A `remember_fact` tool writes it to **resource-scoped** working memory. Afterwards, only Lisbon survived. Find the race and fix it. File: `exercises/ex1-remember-fact.ts`.

</Callout>

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m04-memory/break-it.test.ts">

Fails with `working memory lost an update: {"city":"Lisbon"}` until you fix it. Solution and trade-offs on the [lab page](./lab#break-it-exercise-4-1-the-lost-fact).

</TryIt>

<Quiz module="04" id="fix" question="Which fix actually closes the race?" :options="q_fix" />

<StationDone module="04" :station="3" />

<Journey :station="4" module="04" />

## Choose wisely {#choose-wisely}

<Choose subject="Mastra memory" :rows="choose" />

<Quiz module="04" id="pick" question="The planner must *always* know a user's dietary restrictions, in every thread, forever. Which memory feature?" :options="q_pick" />

<Callout type="analogy" title="LangGraph: checkpointer + store">

LangGraph splits memory in two: **short-term** memory is the checkpointed graph state per thread, and **long-term** memory is a namespaced key-value and vector `store`. Mastra's thread history ≈ LangGraph's checkpointed messages; working memory and semantic recall ≈ the store.

The difference: LangGraph's checkpointer also does crash recovery. In Mastra, checkpointing a *run* is a separate mechanism (Module 7), and memory is just the conversation.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="04" />

<StationDone module="04" :station="4" next="./lab" next-label="On to the lab" />

## Wrap-up

<Podcast title="Memory, in four minutes" :minutes="4">

**Host:** Why does an agent need memory at all?

**Loopy:** Because the model is stateless. Every request has to carry whatever it should know. Memory decides what goes in.

**Host:** What are resource and thread?

**Loopy:** The resource is usually the user. A thread is one conversation. You pass both on every call. The thread also decides concurrency, one active run at a time, and it's where signals get delivered.

**Host:** How does memory actually reach the model?

**Loopy:** Through input processors. Message history loads the recent messages. Working memory adds a structured note as a system message, and gives the model a tool to update it. Semantic recall embeds your new message and pulls similar old ones back from a vector store.

**Host:** So why did my planner forget I'm vegetarian?

**Loopy:** Because the default window is the last 10 messages, and you said it in message 1. Recency isn't relevance. Put facts like that in working memory.

**Host:** And the woken run that treated me like a stranger?

**Loopy:** A run woken by a signal has no caller, so nobody passes it history. Without memory, it sees the system prompt and the signal. That's it.

**Host:** Anything that bites in production?

**Loopy:** Two. The window counts messages, not tokens, so prefer a token budget. And resource-scoped working memory can lose an update when two threads write at once. Serialize the read-modify-write, or let your database do it atomically.

</Podcast>

<Recall module="04" :cards="recall" />

<CheatCard module="04" title="Memory" subtitle="What reaches the model, and why" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 4: memory under pressure](./lab):** four experiments and the lost-fact exercise.
- **[Module 5: Workflows](/m05/):** the other place Mastra keeps state, and the one that can pause for days.

</Callout>
