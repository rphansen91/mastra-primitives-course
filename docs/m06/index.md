---
verified:
  core: 1.76.0
  sha: 81299c921d6f499d4c62f14c38e4d4d88b4fbfae
  date: '2026-10-11'
pageClass: lesson
aside: false
---

<script setup>
const R = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts'
const outcomes = [
  'Explain the three faces of one signal: what the model, the database and the client each see',
  'Predict where a signal lands for every thread state: deliver, wake, persist, discard or <code>blocked</code>',
  'Configure notifications: priorities, the default policy, batching and the inbox tool',
  'Plug an external source in with a <code>SignalProvider</code>',
  'Know what signals don\'t guarantee yet (durability, preemption) and what to use instead',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const questions = [
  { title: 'Is the agent busy?', body: 'Then don\'t start a second run on the same transcript. Get the news into the **current** run at a safe point.', icon: 'clock', color: 'violet' },
  { title: 'Is it idle?', body: 'Maybe wake it up. Maybe just leave a note for later.', icon: 'mail', color: 'sky' },
  { title: 'How important is it?', body: 'An outage should interrupt. A typo-fix merge can wait for a digest.', icon: 'alert', color: 'coral' },
  { title: 'Who sent it?', body: 'Outside text is **data, not instructions**. Frame it that way.', icon: 'eye', color: 'amber' },
]
const faces = [
  { title: '`toLLMMessage()`', body: 'A **user-role** message for the model: `<notification channel="ops" source="chat">…</notification>`', icon: 'bulb', color: 'violet' },
  { title: '`toDBMessage()`', body: 'A `MastraDBMessage` with `role: \'signal\'` for memory and storage.', icon: 'book', color: 'teal' },
  { title: '`toDataPart()`', body: 'A `data-signal` chunk for clients subscribed to the thread.', icon: 'mail', color: 'sky' },
]
const drains = [
  { name: 'request build', short: 'joins the next prompt', detail: 'While building each LLM request, pre-run signals join the first request and pending signals join later ones.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/workflows/agentic-execution/llm-execution-step.ts#L1488', color: 'amber' },
  { name: 'signalDrainStep', short: 'after tools, every lap', detail: 'Seals the current response message, rotates to a fresh id, adds the signal, emits `data-signal`, and marks the iteration continued so the model gets another turn.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts#L206', color: 'teal' },
  { name: 'predicate drain', short: 'the late arrivals', detail: 'The `dowhile` predicate drains once more, for signals that arrived after `signalDrainStep`.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts#L419', color: 'violet' },
  { name: 'interruption', short: 'reasoning-only requests', detail: 'If a request has streamed **only reasoning**, a queued signal aborts it and it is reissued with the signal. No step is spent.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/workflows/agentic-execution/llm-execution-step.ts#L1299', color: 'coral' },
]
const q_digest = [
  { text: 'Interrupt the run right away, it might matter', why: 'That is how an always-on agent gets distracted by every leaderboard. Low priority should not interrupt.' },
  { text: 'Hold it for a batched summary, without waking anyone', correct: true, why: 'The default policy summarizes low-priority items, and an all-low batch is persisted without waking the thread.' },
  { text: 'Drop it', why: 'You might want it later. The inbox tool lets the agent pull details on demand.' },
]
const q_high = [
  { text: '`deliver`, same as when idle', why: 'That is `urgent`. `high` is treated a little more gently when the thread is busy.' },
  { text: 'Summarize now, then deliver the full item', correct: true, why: 'The default policy for `high` + active: a short summary interjects immediately, the full record follows.' },
  { text: 'Summarize at the next dispatcher tick', why: 'That is `medium` / `low`.' },
  { text: '`persist` only', why: 'High priority is never just filed away by default.' },
]
const q_blocked = [
  { text: 'Mastra retries the signal when the approval comes through', why: 'Nothing retries for you. `blocked` is a result you must handle.' },
  { text: 'You get `{ action: \'blocked\' }` and decide: persist it, retry later, or alert someone', correct: true, why: 'Suspended runs (and runs owned by another process) cannot accept in-process delivery.' },
  { text: 'It is delivered into the suspended run', why: 'A suspended run is not looping, so there is no safe point to drain at.' },
]
const choose = [
  { when: 'An agent must learn something while it works, without a second run', not: 'The sender needs a synchronous answer', alt: '`agent.generate()`, or a tool call on another agent' },
  { when: 'You want priority-aware interrupt-or-digest behavior', not: 'Every event must be processed exactly once, durably, across crashes', alt: 'A durable queue (SQS, Kafka, Temporal signals) feeding `sendSignal` idempotently' },
  { when: 'GitHub, chat, webhooks or schedules should reach a thread', not: 'You only need fan-out to many consumers', alt: 'PubSub directly' },
  { when: 'Chat interjections: "the user typed while the agent works"', not: 'Your UI framework handles turns itself', alt: 'AI SDK UI has no mid-run injection; LangGraph uses `interrupt` / `Command`' },
]
const recall = [
  { q: 'Name the three projections of a signal.', a: '`toLLMMessage()` (user-role XML for the model), `toDBMessage()` (role `signal` for storage), `toDataPart()` (`data-signal` chunk for clients).' },
  { q: 'Thread idle, `ifIdle: \'wake\'`. What happens?', a: 'Reserve the thread, take a lease, start `agent.stream(signal, { untilIdle: true })`. Result: `wake` with the output.' },
  { q: 'When do you get `blocked`?', a: 'The thread is active in **another process**, or the run is **suspended** (e.g. waiting for approval).' },
  { q: 'Signal sent during a 10-minute tool. When is it seen?', a: 'After the tool, at `signalDrainStep`. Only reasoning-only requests are interruptible.' },
  { q: '`transient: true` + `ifIdle: persist`?', a: 'Discarded. Transient means "never persist", and persist was the only option.' },
  { q: 'What survives a crash: notification records or pending signal queues?', a: 'Records are durable (storage). The in-flight queues live in process memory and are lost.' },
]
const cheat = [
  { title: 'A signal', color: 'violet', lines: ['user | state | reactive | notification', 'Three faces: LLM message, DB message, data part', 'transient = deliver, never persist'] },
  { title: 'Routing', color: 'amber', lines: ['active here → deliver at next drain site', 'active elsewhere / suspended → blocked', 'idle → wake (default) or persist', 'ifActive: persist | discard'] },
  { title: 'Drain sites', color: 'teal', lines: ['request build', 'signalDrainStep (after tools)', 'predicate inline drain', 'reasoning-only requests: interrupt, no step spent'] },
  { title: 'Notifications', color: 'sky', lines: ['record → decide → deliver | summarize | persist | discard…', 'urgent: deliver; high+active: summary then full', 'dispatcher batches; all-low batch does not wake'] },
  { title: 'Plug-ins', color: 'lime', lines: ['SignalProvider: subscribe, poll, webhook, notify()', 'PubSub: in-process → unix socket → Redis/Valkey', 'Swap the transport, not the API'] },
  { title: 'Not yet', color: 'coral', lines: ['Not preemptive (tools run to completion)', 'Queues in memory: lost on crash', 'Handle blocked yourself', 'Treat signal text as untrusted data'] },
]
const out1 = "=== 1) Signal while push_branch is executing ===\nthread state while tool runs: active\nsendSignal accepted → { action: 'deliver' }\nrun1 text: Staggering pushes: waiting 10 minutes between pushes.\n\n=== 2) Thread idle; signal WAKES a new run ===\naccepted → wake | woken run text: Resuming normal push cadence.\n\n=== 3) ifIdle: persist ===\naccepted → { action: 'persist' } | persisted resolves: true\n\n-- doStream #2 (what the model received)\n   tool      [tool-result push_branch]\n   user      <notification source=\"chat\" channel=\"ops\" author=\"oncall\">We're getting rate limited by GitHub, please stagger pushes.</notification>"
</script>

# Module 6: Signals and notifications

<p class="lead">Forty branches, one rate limit, one human typing "please stagger pushes". An agent that stays on while the world keeps happening needs a mailbox. This module covers how news reaches a running agent, and what happens when nobody is home.</p>

<LessonHero module="06" :minutes="40" lab="Lab runs in ~6 s, no API keys" :outcomes="outcomes" mood="alarmed">

**Friday, 5:58 pm.** Your ops agent is pushing 40 branches.

GitHub starts rate-limiting. The on-call engineer types *"please stagger pushes"* into the ops channel.

The agent keeps hammering for ten more minutes. It wasn't ignoring anyone. It was in the middle of a tool call, and nobody had taught you where signals actually land.

</LessonHero>

<Journey :station="1" module="06" />

## The problem {#problem}

An always-on agent gets news it never asked for: CI failed, a reviewer commented, the user typed something, a meeting starts in ten minutes.

The *Principles* book's name for an agent like that: <Cite id="p-claw" /> Initiative needs inputs. For every single event, you have to answer four questions:

<IdeaCards :cols="4" :cards="questions" />

Back in Module 1 you drew the difference between a phone call and a letter:

<RequestVsSignal />

Signals are the letters. The interesting part is the postal service.

<Quiz module="06" id="digest" question="The agent is mid-run. A low-priority &quot;weekly leaderboard posted&quot; event arrives. What should a sensible default do?" :options="q_digest" />

<StationDone module="06" :station="1" />

<Journey :station="2" module="06" />

## Under the hood {#under-the-hood}

### One signal, three faces

[`createSignal`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/signals.ts#L561) gives a signal an `id`, `type`, `contents`, `tagName`, `attributes`, optional `transient`, and `metadata`. Its category is one of `user | state | reactive | notification`. Then it shows a different face to each audience:

<IdeaCards :cards="faces" />

One timeline, three audiences. `transient: true` means "show it to the model, never save it".

### Where does it go?

`agent.sendSignal(signal, { resourceId, threadId, ifActive?, ifIdle? })` looks at the thread and routes. This is the heart of the module, so play with it until you can predict every outcome:

<SignalVisualizer />

<Callout type="note" title="The return value is a promise of a decision">

`sendSignal` returns `{ signal, accepted, persisted? }`, where `accepted` resolves to `{ action, runId?, output? }`. Always look at `action`. One of the five answers (`blocked`) means "you need to do something".

</Callout>

### The drain sites

"Deliver" doesn't mean "now". It means "at the next safe point". There are exactly four:

<ClickMap title="Where queued signals get in" :stations="drains" />

<TryIt cmd="npm run lab:signals" :output="out1">

Scenario 1 is Friday at 5:58 pm: the notice arrives while `push_branch` runs, and the model only sees it in request #2, right after the tool result.

</TryIt>

### Notifications: signals with manners

`agent.sendNotificationSignal(input, target)` adds a policy layer on top. It writes a durable `NotificationRecord` (source, kind, `priority`, summary, `dedupeKey`, `coalesceKey`, status), then decides what to do, using your `decide` function first and the built-in default last:

| Priority | Thread idle | Thread busy |
|---|---|---|
| **urgent** | deliver | deliver |
| **high** | deliver | summary now, full item after |
| **medium** | deliver | summarize |
| **low** | summarize | summarize |

Summaries wait for a **dispatcher** (a cron workflow, once a minute) that emits one `<notification-summary>` per thread. A batch of only lows is saved **without waking** anyone. The agent pulls details when it wants them with the inbox tool.

<Quiz kind="predict" module="06" id="high-busy" question="A `high` priority notification arrives while the thread is busy, and `decide` returns nothing. What does the default policy do?" :options="q_high" />

<TryIt cmd="npm run lab:notifications">

A fake firehose emits four events through a real `SignalProvider`. Watch the urgent one wake the thread and the rest get summarized.

</TryIt>

<DeepDive title="Routing table, SignalProvider and PubSub backends">

**Full routing** ([`sendSignal` L5515](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L5515)):

| Thread state | Option | Result |
|---|---|---|
| Active, same process | `ifActive: 'deliver'` (default) | queued in `pendingSignalsByThread` ([L418](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L418)) → `deliver` |
| | `ifActive: 'persist'` / `'discard'` | stored without interrupting / dropped |
| Reserved, first request not sent yet | | joins the first request |
| Active in **another process**, or **suspended** | | `blocked` ([L5594](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L5594), [L5756](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L5756)) |
| Idle | `ifIdle: 'wake'` (default) | reserve → lease (fails open) → `agent.stream(signal, { untilIdle: true })` → `wake` |
| Idle, another process is starting a run | | queued in `pendingIdleSignalsByThread` ([L434](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L434)) |
| Idle | `ifIdle: { behavior: 'persist' }` | memory + broadcast → `persist` |
| | `{ wake, requireClaimedOwner: true }` | wakes only if a live claimed owner exists (Module 8) |

**Notifications:** [`sendNotificationSignal`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts#L9321), [`defaultNotificationDeliveryDecision`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/notifications/delivery-policy.ts#L66), [`dispatchDueNotifications`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/notifications/dispatcher.ts#L263), [`createNotificationInboxTool`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/notifications/tool.ts#L148).

**SignalProvider** ([`signal-provider.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/signals/signal-provider.ts#L97)): an abstract class with a subscription registry, optional polling ([`startPolling` L374](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/signals/signal-provider.ts#L374)), optional `handleWebhook`, and [`notify()`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/signals/signal-provider.ts#L446). Providers can contribute tools and processors. Built-ins: `WebhookSignalProvider`, `TaskSignalProvider`, `GoalSignalProvider`, `@mastra/github-signals`.

**PubSub backends** ([`events/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/events)):

| Backend | Scope | Leases |
|---|---|---|
| `EventEmitterPubSub` (default) | one process | in process |
| `UnixSocketPubSub` | one host | yes |
| `@mastra/redis-streams`, `@mastra/valkey-streams` | cluster | yes |
| `@mastra/google-cloud-pubsub` | cluster | **no** |

**Tests and docs:** [`stream-signals.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/workflows/stream-signals.test.ts), [`signal-drain-core.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/shared/steps/signal-drain-core.test.ts), [`agent/signals.test.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/signals.test.ts), [`harness/signals.mdx`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness/signals.mdx), [`harness/signal-providers.mdx`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness/signal-providers.mdx).

</DeepDive>

### What exactly is guaranteed

| You see | It means | It doesn't mean |
|---|---|---|
| `accepted` → `deliver` | Queued **in memory** for the next drain in this process | Durable. A crash before the drain loses it |
| `accepted` → `persist` | Mastra *will try* to write it to the thread | Written. `accepted` resolves **before** the write; await `result.persisted` ([source](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts#L5611), [docs](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness/signals.mdx#L164)) |
| `accepted` → `wake` | A new run was started from the signal | That the woken run has your tools or model settings (pass `streamOptions`) |
| A `SignalProvider` subscription | Registered in this process | Survives a restart. *"The base registry is in-memory and per-process"*: persist and rehydrate subscriptions in `start()` ([`signal-providers.mdx` L206](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness/signal-providers.mdx#L206)) |

<Callout type="tip" title="Ack upstream only after the write">

If a webhook hands you an event you can't lose, `await result.persisted` before you return 200. Then make the handler idempotent (`dedupeKey` / `coalesceKey` on notifications), because the sender will retry whenever you didn't ack.

</Callout>

<StationDone module="06" :station="2" />

<Journey :station="3" module="06" />

## Break it {#break-it}

Signals are young. Here's where they bend, each one checked in the lab or in the source:

<Misconception myth="A signal can interrupt my agent at any moment.">

**Cooperative, not preemptive.** A signal sent during a 10-minute tool is seen after the tool. Only requests that have streamed nothing but reasoning can be interrupted.

If your tool takes ten minutes, so does your agent's reaction time.

</Misconception>

<BookSays quote="p-control">

As of 1.76, "steer" and "interrupt" are two different mechanisms. Steering is a signal, drained at the next safe point: after the current tool call, never during it.

Interrupting a tool mid-flight is cancellation through `abortSignal`, and your tool has to honor it. A long tool should check `abortSignal` and split its work into steps.

</BookSays>

<Misconception myth="Once sendSignal accepts it, the signal is safe.">

The queues (`pendingSignalsByThread`, `pendingIdleSignalsByThread`) and provider subscriptions live in **process memory**. A crash loses accepted-but-undelivered signals. Notification *records* are durable; the in-flight queue is not (open issues #25778 and #25779).

</Misconception>

<Misconception myth="A woken run is just like a normal run.">

It gets **only the options you pass** (`streamOptions` from the delivery decision). Without them: default model, tools and approval settings. Without memory, no history either.

</Misconception>

<Quiz module="06" id="blocked" question="Your agent is suspended, waiting for a human to approve a tool call. CI sends it a signal. What happens?" :options="q_blocked" explain="Two more: a steady drip of preempted requests doesn't spend `maxSteps`, so set `stopWhen`. And signal contents are user-role text: treat outside and peer text as **data**, and keep approvals on for unattended wakes." />

### Your mission: write a delivery policy

<Callout type="tip" title="Exercise 6.1">

Write a `decide` function: calendar items always `deliver`, low-priority chat goes to the inbox only (`persist`, never wake, never summarize), and anything from `spam` is `discard`ed. Everything else falls through to the default. File: `exercises/ex1-delivery-policy.ts`.

</Callout>

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m06-signals/break-it.test.ts">

The test wakes the thread with an urgent item, then sends calendar, chat and spam while it's busy. Solution on the [lab page](./lab#break-it-exercise-6-1-a-delivery-policy).

</TryIt>

<StationDone module="06" :station="3" />

<Journey :station="4" module="06" />

## Choose wisely {#choose-wisely}

<Choose subject="signals" :rows="choose" />

<Callout type="analogy" title="Temporal signals are registered mail. Mastra signals are a smart secretary.">

**Temporal** signals are durable: written into workflow history, delivered exactly once to a handler, safe across crashes and deploys. But Temporal knows nothing about models, transcripts, priorities or "slip this in at the next safe point of an LLM loop".

**Mastra** signals have all the agent smarts and none of the durability guarantees yet. Durable signal queues and `waitForSignal` with a timeout are two of the capstone candidates in Module 10.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="06" />

<StationDone module="06" :station="4" next="./lab" next-label="On to the lab" />

## Further reading {#further-reading}

<FurtherReading module="06" />

## Wrap-up

<Podcast title="Signals, in five minutes" :minutes="5">

**Host:** What is a signal, really?

**Loopy:** A letter for an agent. It has a type, some contents and a few attributes, and it shows a different face to everyone. The model sees a user message wrapped in a notification tag. The database stores it as a signal message. And clients watching the thread get a data chunk.

**Host:** What happens when I send one?

**Loopy:** Mastra looks at the thread. If a run is active in this process, the signal is delivered at the next safe point. If the thread is idle, by default Mastra wakes it, which starts a brand-new run triggered by the signal. You can ask it to just save the signal instead. And if the run is suspended, or owned by another process, you get blocked, and it's up to you what to do next.

**Host:** What's a safe point?

**Loopy:** Building the next model request, the signal-drain step after tools, and one last drain in the loop's predicate. The one exception: if the model has only been thinking, with no text yet, Mastra can abort that request and reissue it with the signal. Free of charge, no step spent.

**Host:** So on Friday at 5:58…

**Loopy:** The notice arrived during a tool call. It waited for the tool to finish, then joined the very next request. Cooperative, not preemptive.

**Host:** And notifications?

**Loopy:** Signals with manners. Each one gets a durable record with a priority. Urgent items are delivered right away. Low ones get batched into a summary by a dispatcher, and a batch of only low items doesn't wake anybody. The agent can open its inbox tool for details.

**Host:** What should I be careful about?

**Loopy:** The queues live in memory, so a crash loses undelivered signals. Blocked results need handling. And signal text is untrusted data, so frame it, and keep approvals on.

</Podcast>

<Recall module="06" :cards="recall" />

<CheatCard module="06" title="Signals and notifications" subtitle="How news reaches a running agent" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 6](./lab):** mid-run delivery, wakes, persistence and a real `SignalProvider`.
- **[Module 7: Durability](/m07/):** what survives a `kill -9`.
- **[Module 8: Multi-agent](/m08/):** signals between agents.

</Callout>
