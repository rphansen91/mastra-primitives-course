---
verified:
  core: 1.77.0
  sha: f88217d19b63d362ff97723c1a339fbf89a1bbb0
  date: '2026-10-14'
pageClass: lesson
aside: false
---

<script setup>
const outRelay = "=== Worker claims + advertises its thread; coordinator discovers peers ====\n  worker claim: true\n  peers: [\n  {\n    agentId: 'worker',\n    threadId: 'worker-auth-refactor',\n    label: 'api (auth refactor)'\n  }\n]\n\n=== Ops notification wakes the coordinator \u2192 relay tool \u2192 worker mid-run ==\n  coordinator accepted: wake\n  relay tool result: { routed: 'deliver' }\n  coordinator says: Relayed the rate-limit notice to the worker agent.\n  worker final text: Got it from the coordinator: batching pushes, max 1 per 10 min.\n\n=== Two polite agents, one relay tool each ================================\n  alice \u2192 bob (hops=1) \"Heads up: CI is rate limited.\"\n  bob \u2192 alice (hops=2) \"Thanks, noted!\"\n  alice \u2192 bob (hops=3) \"Thanks, noted!\"\n  bob \u270b stops at hop 3\n  relays sent: 3 | stopped by the guard: true"
const outcomes = [
  'Tell apart supervisor agents (subagents), workflows, signals between threads, and the deprecated agent network',
  'Compare what each one shares: transcript, run, budget, failure, crash behavior',
  'Wire thread ownership, peer discovery and a relay tool into an always-on coordinator',
  'Stop two agents from waking each other forever, in code, not in the prompt',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const needs = [
  { title: 'Delegation', body: '"Research this and give me the answer." A function call that happens to be an agent.', icon: 'compass', color: 'sky' },
  { title: 'Orchestration', body: 'A known pipeline where some steps are agents: draft → review → publish.', icon: 'map', color: 'teal' },
  { title: 'Routing', body: 'A supervisor picks which specialist handles each turn.', icon: 'cards', color: 'violet' },
  { title: 'Coordination', body: 'Tell three busy coding agents "CI is rate limited, stagger your pushes" **while they keep working**.', icon: 'mail', color: 'coral' },
]
const q_which = [
  { text: 'Sub-agent as a tool', why: 'The parent would wait for the helper to finish. The workers are already busy in their own runs.' },
  { text: 'Agent network', why: 'A network routes one task among specialists inside one run, and `.network()` is deprecated anyway. These agents are independent and long-lived.' },
  { text: 'Signals between threads', correct: true, why: 'Each worker keeps its own thread, run and budget. The notice arrives at its next safe point. Nobody waits.' },
]
const mechs = [
  { name: 'Sub-agent', short: 'agents: { researcher }', detail: 'The supervisor pattern: the model calls `agent-researcher` like any tool, and the whole sub-run is one tool call. By default the subagent gets the parent\'s conversation context; `messageFilter`, `onDelegationStart` and `onDelegationComplete` control it. [`agent/subagent.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/subagent.ts), [docs](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/subagents.mdx).', href: 'https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/subagent.ts', color: 'sky' },
  { name: 'Network (deprecated)', short: 'routing agent', detail: '**Deprecated** at the pin, to be removed in a future major. A routing agent picks agents, workflows or tools per iteration, inside one network run. Migrate to a supervisor agent. [`agents/networks.mdx`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/agents/networks.mdx), [`agent-network.test.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent-network.test.ts).', href: 'https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/agents/networks.mdx', color: 'violet' },
  { name: 'Workflow', short: 'createStepFromAgent', detail: 'An agent becomes a step in `.then / .parallel / .foreach`: snapshots, retries and suspend/resume apply (Module 5). [`workflows/agents-and-tools.mdx`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/workflows/agents-and-tools.mdx).', href: 'https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/workflows/agents-and-tools.mdx', color: 'teal' },
  { name: 'Signals', short: 'sendSignal + ownership', detail: '`otherAgent.sendSignal(signal, { resourceId, threadId })`, with [`claimThreadOwnership`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent.ts#L9220) and [`discoverThreadPeers`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent.ts#L9257). Delivery in [`thread-stream-runtime.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/thread-stream-runtime.ts#L5542).', href: 'https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent.ts#L9220', color: 'coral' },
]
const q_idle = [
  { text: 'The signal is dropped: no one is running', why: 'With `wake`, an idle thread gets a new run. With `persist`, it\'s saved for the next one.' },
  { text: 'A new run starts on the worker\'s thread, with the notice', correct: true, why: '`ifIdle: { behavior: \'wake\' }` starts a run. Add `requireClaimedOwner: true` and it only wakes if a live owner holds the thread.' },
  { text: 'The coordinator\'s run blocks until the worker is free', why: 'Signals never make the sender wait. That\'s the whole point.' },
]
const relayOrder = [
  'Worker claims its thread and advertises a peer label',
  'Coordinator discovers peers over PubSub',
  'An ops notification wakes the idle coordinator',
  'Coordinator\'s model calls the relay tool → sendSignal',
  'Worker sees the notice at its next model request',
]
const breaks = [
  { title: 'Sub-agents are opaque to durability', body: 'A crash replays the whole delegation as one in-flight tool call (Module 7).', icon: 'skull', color: 'coral' },
  { title: 'Sub-agents share latency', body: 'A slow helper blocks the parent\'s step. Its steps don\'t show in the parent\'s `maxSteps`.', icon: 'clock', color: 'amber' },
  { title: 'Signals are fire-and-forget', body: 'No request/reply correlation in core. Lost in-memory signals aren\'t retried (Module 6).', icon: 'mail', color: 'sky' },
  { title: 'Discovery is per process by default', body: '`EventEmitterPubSub` peers vanish across processes. Use Unix sockets or Redis/Valkey Streams.', icon: 'compass', color: 'violet' },
  { title: 'Peers can inject prompts', body: 'A confused or compromised peer is untrusted input. Frame its text as data and keep approvals on.', icon: 'alert', color: 'lime' },
  { title: 'Feedback loops', body: 'Two agents that relay to each other wake each other forever. You\'ll build the guard below.', icon: 'reset', color: 'teal' },
]
const q_guard = [
  { text: 'Add "don\'t reply to acknowledgements" to both system prompts', why: 'Helps sometimes. But a model can\'t be trusted to stop; one creative reply restarts the loop.' },
  { text: 'Carry a `hops` count in the signal and refuse to relay past a limit, in the tool', correct: true, why: 'Code, not a prompt. The lab\'s `nextHop()` returns `null` at `MAX_HOPS = 3`. Dedupe keys are the other common guard.' },
  { text: 'Lower `maxSteps` on both agents', why: 'Each wake is a **new** run with a fresh budget. `maxSteps` bounds one run, not a conversation between two.' },
]
const choose = [
  { when: '"Answer this sub-question" inside one turn', not: 'The helper needs to run for minutes while the parent stays responsive', alt: 'Sub-agent as tool; AI SDK tool calling `generateText`; a LangGraph subgraph' },
  { when: 'A known pipeline with agent steps', not: 'The next step depends on what the model thinks', alt: 'Workflow + `createStepFromAgent`; LangGraph graph; Temporal workflow + activities' },
  { when: 'Dynamic routing among specialists per turn', not: 'You can write the routing as plain if/else', alt: 'A supervisor agent with subagents (`.network()` is deprecated); LangGraph supervisor; OpenAI Agents SDK handoffs' },
  { when: 'Independent long-lived agents that inform each other mid-work', not: 'You need guaranteed delivery and replies on the default PubSub', alt: 'Signals + ownership + discovery; a message bus with your own mailbox; actor frameworks' },
  { when: 'Cross-host coordination', not: 'Default `EventEmitterPubSub`', alt: 'Signals over Redis/Valkey Streams PubSub; Temporal signals between workflows' },
]
const recall = [
  { q: 'What does a subagent share with its parent?', a: 'The run (the parent waits), failure (a failed tool result) and, by default, the parent\'s conversation context, which you trim with `messageFilter`. It writes to its own thread.' },
  { q: 'What crosses between two agents using signals?', a: 'Only the message. Separate threads, runs and budgets. The sender doesn\'t wait or learn the outcome.' },
  { q: 'What do claimThreadOwnership and discoverThreadPeers do?', a: 'Take a lease-backed claim on a thread and advertise it with a label; ask the PubSub directory which live owners exist.' },
  { q: 'Running vs idle target thread?', a: 'Running: `deliver` into the live run at its next safe point. Idle: `wake` a new run, or `persist` for later.' },
  { q: 'How do you stop two agents relaying forever?', a: 'A hop count (or dedupe key) carried in the signal, enforced in the tool. Not a prompt, not `maxSteps`.' },
  { q: 'Handoff (OpenAI Agents SDK) vs signal?', a: 'A handoff passes the conversation to another agent in the same run. A signal is a message between separate runs.' },
]
const cheat = [
  { title: 'Sub-agent', color: 'sky', lines: ['agents: { researcher }', 'one tool call; parent waits', 'crash = whole delegation re-runs'] },
  { title: 'Network (deprecated)', color: 'violet', lines: ['router picks per iteration', 'one network run', 'migrate to a supervisor'] },
  { title: 'Workflow', color: 'teal', lines: ['createStepFromAgent(a)', 'snapshots + retries per agent', 'fixed shape'] },
  { title: 'Signals', color: 'coral', lines: ['peer.sendSignal(s, { threadId })', 'running → deliver; idle → wake / persist', 'requireClaimedOwner'] },
  { title: 'Peers', color: 'amber', lines: ['claimThreadOwnership({ peer: { label } })', 'discoverThreadPeers()', 'PubSub: EventEmitter → Unix socket → Redis'] },
  { title: 'Safety', color: 'lime', lines: ['peer text is untrusted data', 'hop counts / dedupe keys in code', 'approvals stay on for unattended wakes'] },
]
</script>

# Module 8: Multi-agent coordination

<p class="lead">"Multi-agent" is one word for four very different shapes. You tell them apart by asking one question: what do the agents share? Then you build the shape that's hardest to get right: an always-on coordinator talking to busy workers.</p>

<LessonHero module="08" :minutes="40" lab="Coordinator relay + ping-pong lab, ~3 s" :outcomes="outcomes" mood="happy">

**Monday standup.** Someone says "let's make it multi-agent". Three people nod, and each of them is picturing something completely different.

One means a research helper. One means a pipeline. One means two always-on agents chatting while they work. By Friday they've built three incompatible things.

</LessonHero>

<Journey :station="1" module="08" />

## The problem {#problem}

"Multi-agent" hides four different needs:

<IdeaCards :cols="4" :cards="needs" />

Each needs a different answer to the same five questions: **whose transcript? whose run? who pays the step budget? what happens when one fails? and when one crashes?**

The first question matters most. The *Principles* book: <Cite id="p-split" />

<FourWays />

<Callout type="analogy" title="A kitchen">

A **sub-agent** is the chef asking the sous-chef to taste the sauce and waiting for the verdict. A **network** was the head waiter deciding which station takes each order (Mastra now deprecates it in favor of the chef-as-supervisor).

A **workflow** is the plating line: same stations, same order, every dish. **Signals** are the ticket rail: anyone can clip a note for the grill, and the grill reads it when they flip the next steak.

</Callout>

<Quiz module="08" id="which" question="Three coding agents are each mid-task. A coordinator must tell them &quot;CI is rate limited&quot; without stopping them. Which mechanism?" :options="q_which" />

<StationDone module="08" :station="1" />

<Journey :station="2" module="08" />

## Under the hood {#under-the-hood}

### Four mechanisms, five questions

<SharedCompare />

<Callout type="warn" title="Agent networks are deprecated">

<StabilityBadge id="networks" /> The docs at the pin say networks *"are deprecated and will be removed in a future major release. Replace them with supervisor agents that use `agent.stream()` or `agent.generate()`."* There's a [migration guide](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/reference/migrations/network-to-supervisor.mdx). This course keeps networks in the comparison so you can recognize them in existing code. Don't start new work on them.

Also check what a subagent sees. <StabilityBadge id="subagents" /> By default, *"subagents receive the full conversation context from the parent agent"* ([`subagents.mdx` L247](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/docs/src/content/en/docs/subagents.mdx#L247)). That matters for data handling. Use `messageFilter` to drop sensitive or bulky messages before delegation.

</Callout>

<BookSays quote="p-isolated">

The book defines the *isolated* subagent, then the *forked* one, which has the parent's full context up to the fork. Mastra's default is the forked kind.

A subagent receives the **parent's conversation** unless you pass `delegation: { messageFilter }`. If the filter throws, delegation falls back to the unfiltered context (unless `hookErrorStrategy: 'throw'`). Lab 8.3 proves it with a mock model: a card number from earlier in the parent conversation shows up in the helper's prompt until the filter removes it.

</BookSays>

Networks are also a reminder that primitives get replaced. Mastra's write-up of how they evolved opens with:

<FounderQuote id="f-flawed">

`AgentNetwork` became `NewAgentNetwork`, then `.network()`. As of 1.77, `.network()` is itself deprecated in favor of supervisor agents. Expect your multi-agent code to move at least once.

</FounderQuote>

<ClickMap title="Where each one lives in the source" :stations="mechs" start-label="most coupled" end-label="least coupled" />

### Ownership and discovery

- [`claimThreadOwnership`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent.ts#L9220) takes a **lease-backed claim** on a thread and advertises it as a peer with a label.
- [`discoverThreadPeers`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/agent/agent.ts#L9257) asks over PubSub (request/reply) who's out there.
- `sendSignal(…, { ifIdle: { behavior: 'wake', requireClaimedOwner: true } })` wakes a peer **only if** a live owner exists.

<StabilityBadge id="thread-ownership" /> Treat ownership and discovery as experimental. The methods are public, but the docs don't cover them, and the one product feature built on them (cross-agent communication in Mastra Code) is *"experimental and off by default"*. Pin exact versions if you build on them.

With the default `EventEmitterPubSub` this works inside one process. With `UnixSocketPubSub`, across processes on one host. With Redis/Valkey Streams, across a cluster.

<Quiz kind="predict" module="08" id="idle" question="The coordinator relays with `ifIdle: { behavior: 'wake' }`, but the worker finished its task a minute ago. What happens?" :options="q_idle" />

### The always-on coordinator

Step through the lab's relay, then flip to ping-pong and turn the guard off:

<RelayVisualizer />

<OrderSteps module="08" id="relay" prompt="Put the coordinator relay in order." :items="relayOrder" explain="Ownership first (so discovery finds the worker), then the wake, then the relay tool, then delivery at the worker's next safe point." />

<NotifyFlow />

<TryIt cmd="npm run lab:relay && npm run lab:ping-pong" :output="outRelay">

Two agents on one `Mastra` (shared in-process PubSub). The worker is blocked in `run_tests` when the relayed notice arrives.

</TryIt>

The production version, as a recipe:

1. **Ingestion:** a `SignalProvider` per source family; classify each event to a priority (an LLM classifier, rules, or Mastra's `Classifier`); `notify()` with a `dedupeKey`.
2. **Policy:** `notifications.deliveryPolicy.decide` maps your labels onto `deliver / summarize / persist / discard`; return `streamOptions` so woken runs get the right model/tools/approval settings.
3. **One coordinator thread** with storage-backed memory and the inbox tool (summaries say "check the inbox"; the agent pulls details).
4. **Time:** threaded schedules send signals into the coordinator thread (morning brief, meeting prep).
5. **Relay:** the coordinator discovers peers and `sendSignal`s into their threads; running workers get the message at their next safe point.
6. **Safety:** all inbound and peer text is untrusted; tool approval stays on for outward actions on unattended wakes; idempotent tools.
7. **Deployment:** more than one instance needs a PubSub with leases; persist provider subscriptions.

<DeepDive title="Case study: mastracode agent connections">

mastracode (the coding agent in [`mastracode/`](https://github.com/mastra-ai/mastra/tree/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode)) lets separate sessions on one machine message each other. [`createMastraCodeAgentController`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/index.ts#L510) wires:

- [`agent-connections/tools.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/agent-connections/tools.ts): `agent_connections_list`, `agent_connect` / `agent_disconnect`, and `agent_signal_send`, which sends a **notification** (`source: 'agent-connection'`, `kind: 'peer-signal'`, with `expectsReply`, `messageId`, `replyTo`) and wakes the peer only with `requireClaimedOwner` (or persists, for low priority);
- [`session-advertisement.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/agent-connections/session-advertisement.ts): each session claims its thread and advertises a peer label, and yields ownership on exit;
- [`messaging-processor.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/agent-connections/messaging-processor.ts): an **output processor** that reminds/retries when a peer expected a reply and the agent didn't send one;
- [`untrusted-text.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/agent-connections/untrusted-text.ts): peer text is framed as **untrusted data**;
- [`utils/signals-pubsub.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/utils/signals-pubsub.ts): a `UnixSocketPubSub` per resource, plus a shared directory for cross-project discovery;
- [`plugins/signal-lane.ts`](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/plugins/signal-lane.ts): plugin-contributed signal providers kept out of the constructor so they can be hot-removed.

Every piece is an existing primitive (notifications, ownership, processors, PubSub). No new core API was needed: the house rules working as intended.
</DeepDive>

### Pattern: an async expert that answers via signals

A blocking subagent makes the parent wait. For slow research (minutes, not seconds), a pattern that composes the primitives in this course works better:

1. The parent calls an `ask_expert` **tool** that enqueues the question and returns a `replyId` **immediately**. The parent keeps working.
2. A separate expert agent runs on **its own thread**, with one question at a time per parent thread (a FIFO queue), so follow-ups keep their context.
3. Answers come back with `parent.sendSignal({ type: 'notification', tagName: 'expert-reply', attributes: { replyId, moreComing } }, { resourceId, threadId })`. The `replyId` correlates the answer with the question, and `moreComing` streams partial answers.
4. Budgets keep it honest: heartbeat signals while working, a stall watchdog, a soft cap on total time, and a processor that nudges the expert to answer as the budget runs out.
5. Guards: the expert can't call itself (recursion guard), and there's a kill switch.

Every piece is a primitive from Modules 3, 4, 6 and 8, and every caveat from them applies. The reply signal sits in memory until it's drained, so persist anything you can't lose.

Cross-process delivery needs a distributed PubSub. The `replyId` makes duplicates harmless.

<StationDone module="08" :station="2" />

<Journey :station="3" module="08" />

## Break it {#break-it}

<IdeaCards :cards="breaks" />

<Misconception myth="maxSteps protects me from runaway multi-agent loops.">

`maxSteps` bounds **one run**. When Bob relays to Alice, Alice gets a **new** run with a fresh budget, and her relay gives Bob a new one.

Nothing in the loop exceeds any single limit. You need a guard that travels with the message.

</Misconception>

<Misconception myth="A sub-agent is just another agent, so it gets its own durability.">

Inside the parent's run, a sub-agent is **one tool call**. Module 7's journal can't see inside it, so a crash re-runs the whole delegation: every model call and tool the helper made. If the helper's work must survive crashes, make it a workflow step or its own thread.

</Misconception>

### Your mission: two polite agents

<Callout type="tip" title="Exercise 8.1">

Alice and Bob each acknowledge every notice they receive, and each acknowledgement is a notice. In the starter they relay 12 times until the lab's safety cap stops them.

Make `nextHop()` stop the conversation after 3 hops. File: `exercises/ex1-hop-guard.ts`.

</Callout>

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m08-multi-agent/break-it.test.ts">

Fails until the relay count is at most 4 and the conversation reports `stopped`. Solution on the [lab page](./lab#break-it-exercise-8-1-two-polite-agents).

</TryIt>

<Quiz module="08" id="guard" question="Which fix actually stops the ping-pong?" :options="q_guard" />

<StationDone module="08" :station="3" />

<Journey :station="4" module="08" />

## Choose wisely {#choose-wisely}

<Choose subject="a multi-agent mechanism" :rows="choose" />

<Callout type="analogy" title="OpenAI Agents SDK: handoffs">

A handoff transfers the **conversation** to another agent: the new agent continues the same run with the same transcript. That's routing within one run, closest to Mastra's deprecated network, or a supervisor agent today.

Signals are the opposite: separate runs and transcripts that exchange messages. Know which one you want before you pick.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="08" />

<StationDone module="08" :station="4" next="./lab" next-label="On to the lab" />

## Further reading {#further-reading}

<FurtherReading module="08" />

## Wrap-up

<Podcast title="Multi-agent, in four minutes" :minutes="4">

**Host:** Everyone says multi-agent. What does Mastra actually offer?

**Loopy:** Three you'd start with today: a supervisor agent with subagents, a workflow with agent steps, and signals between threads. There's a fourth, the agent network, but it's deprecated. You'll still see it in older code.

**Host:** How do I pick?

**Loopy:** Ask what they share. A subagent shares the parent's run: the parent waits and gets one tool result. By default it also sees the parent's conversation, which surprises people, so filter it. A network shares one routed run. A workflow shares a run but passes typed data between steps. Signals share nothing but the message.

**Host:** And the coordinator pattern?

**Loopy:** Workers claim their threads and advertise a label. The coordinator discovers them over PubSub. A notification wakes the coordinator; its model calls a relay tool, which signals a worker's thread. If the worker is mid-run, the notice arrives at its next model request.

**Host:** What goes wrong?

**Loopy:** Signals are fire-and-forget, discovery is per-process unless you change the PubSub, peer text can carry prompt injection, and two polite agents can wake each other forever, because each wake is a fresh run with a fresh step budget.

**Host:** So the fix for that last one?

**Loopy:** A hop count that travels with the signal, enforced in the tool. Code, not a prompt.

</Podcast>

<Recall module="08" :cards="recall" />

<CheatCard module="08" title="Multi-agent" subtitle="Four shapes, one question: what's shared?" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 8: relay and ping-pong](./lab):** the coordinator relay and Exercise 8.1.
- **[Module 9: Observability and evals](/m09/):** see every one of these runs as a trace, and score them.
- Read the tests: [`agent-connections/__tests__/`](https://github.com/mastra-ai/mastra/tree/f88217d19b63d362ff97723c1a339fbf89a1bbb0/mastracode/sdk/src/agent-connections/__tests__) includes a real cross-process Unix-socket suite (ownership fencing, lease takeover, request/reply).

</Callout>
