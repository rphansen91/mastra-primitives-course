---
title: Adopting Mastra in production
pageClass: wide
aside: false
---

<script setup>
const ALL = ['agent', 'tool-concurrency', 'processors', 'processor-caching', 'memory', 'last-messages', 'observational-memory', 'wm-state-signals', 'workflows', 'workflow-recovery', 'dynamic-workflows', 'temporal-runner', 'workers', 'schedules', 'signals', 'notifications', 'signal-providers', 'distributed-pubsub', 'cross-agent', 'durable-agents', 'run-claims', 'subagents', 'networks', 'thread-ownership', 'background-tasks', 'goals', 'scorers', 'datasets', 'tracing', 'server-responses'];
const strategies = [
  { title: 'Adopt', icon: 'check', color: 'lime', body: 'Mastra is the agent runtime: loop, tools, processors, memory, workflows, evals. **Fits when** your agents are request-scoped or human-paced, one instance (or sticky routing) is enough, and the stable surface covers your needs.', tag: 'least code · most coupling' },
  { title: 'Augment', icon: 'wrench', color: 'amber', body: 'Mastra runs the agent loop; a proven system owns the guarantee Mastra is thin on: **Temporal / Restate / DBOS** for durability, a **queue** for delivery, your **DB** for authorization, your **APM** for traces. **Fits most production systems.**', tag: 'the usual answer' },
  { title: 'Build', icon: 'puzzle', color: 'coral', body: 'You need a guarantee no framework gives (for example exactly-once effects across a custom ledger), or your constraints rule out a TypeScript runtime. Build the primitive (Module 10), ideally *on* Mastra\'s public seams, and plan to upstream it.', tag: 'most code · most control' },
];
const checklist = [
  { title: 'Versions and upgrades', items: [
    { text: 'Pin **exact** versions of every `@mastra/*` package (no `^` or `~`), and commit the lockfile.', why: 'Minor releases changed observable behavior between 1.75.0 and 1.76.0 (M6, M7, M9).' },
    { text: 'Run a behavior canary on every upgrade: your own tests, plus labs like this course\'s, on the pinned version **and** `@latest`.' },
    { text: 'Read the changelog for every beta feature you use before upgrading.', why: 'Beta: "breaking changes may occur without a major version bump".' },
    { text: 'Inventory any deprecated APIs in use (`.network()`, `lastMessages`) and schedule the migration.' },
  ] },
  { title: 'Data and state', items: [
    { text: 'A durable store (Postgres, or a libSQL **file**/Turso) for memory, snapshots and claims. Never in-memory outside tests.' },
    { text: 'Authorization on every `resourceId`/`threadId`, derived from the authenticated user server-side.' },
    { text: 'A retention and PII policy for messages, embeddings, notification records and traces.' },
    { text: 'Observability storage separated from transactional storage at scale (ClickHouse or an exporter).' },
  ] },
  { title: 'Side effects and retries', items: [
    { text: 'Every external side effect is idempotent, keyed on stable ids (`runId:toolCallId`).', why: 'Recovery, double resume, and replica races all re-run steps (M5, M7).' },
    { text: 'Tool-call concurrency chosen per agent (default 10 in parallel).' },
    { text: '`maxSteps`, a repeat-detecting `stopWhen`, and a cost cap on every agent.' },
    { text: 'Decide fail-open vs. fail-closed for each guardrail processor, and test the error path.' },
  ] },
  { title: 'Multi-instance', items: [
    { text: 'Either sticky routing per thread, or a distributed PubSub (Redis/Valkey Streams) on every instance.' },
    { text: 'A fencing store if more than one instance may recover durable agents; otherwise leader-elect recovery.' },
    { text: 'Plain-workflow boot recovery (`recovery.workflows`) enabled on exactly one instance, or every step idempotent.' },
    { text: '`mastra.shutdown()` wired to SIGTERM so deploys checkpoint and release claims.' },
  ] },
  { title: 'Operations', items: [
    { text: 'Tracing on from day one, with `SensitiveDataFilter` or equivalent redaction.' },
    { text: 'Alerts on runs stuck in `running` past the claim TTL, on tripwire rates, and on token spend.' },
    { text: 'A golden dataset per agent, with rule-based scorers as the CI gate and judge scores as trends.' },
    { text: 'An owner and an exit plan for every beta or experimental feature in use.' },
  ] },
];
const q_adopt = [
  { text: 'Adopt: turn on `recovery.durableAgents: \'auto\'` on all four replicas and you\'re done', why: 'Only safe with a shared claim (fencing store or shared lease), and recovery still re-runs the in-flight tool. A payment needs an idempotency key either way.' },
  { text: 'Augment: Mastra for the loop, idempotency keys on the payment tool, a fencing store, and either a durable engine or leader-elected recovery', correct: true, why: 'Each guarantee lives where it\'s strongest. Mastra\'s beta durability is a bonus, not the only line of defense.' },
  { text: 'Build: write your own agent loop with a journal', why: 'Possible, but you\'d re-implement M2–M4 and M9 to get one guarantee. Augment first.' },
];
</script>

# Adopting Mastra in production

<p class="lead">One minor release, 1.75.0 → 1.76.0, brought new run claims, a different number of model calls in a notification flow, and a new span in every trace. This page is a decision guide for a platform team: what to adopt, what to augment with proven infrastructure, and what to build. Every claim links to evidence in a module, a lab, or the Mastra source at the pinned release (<code>@mastra/core@1.76.0</code>).</p>

This page is deliberately skeptical. Speed like Mastra's is a strength if you **pin, test and upgrade on purpose**. It's a risk if you don't.

The gap it covers is the one the *Patterns* book opens with: <Cite id="pat-demo" />

Skepticism is also the honest position from inside. One of Mastra's founders, writing about operating agents:

<FounderQuote id="f-ai-ops" />

That was written in January 2025. The questions it raises (rollbacks, drift, on-call) are still open as of 1.76, which is why this page leans on infrastructure you already trust.

## Three strategies

<IdeaCards :cols="3" :cards="strategies" />

## Decide per requirement

Score your system one requirement at a time. Most real systems end up in **augment**: Mastra for the agent, proven infrastructure for the guarantee Mastra is thin on.

| Requirement | Adopt Mastra | Augment | Build | Evidence |
|---|---|---|---|---|
| Request/response agents, chat, copilots | <Status kind="yes" /> | | | The stable core ([M2](./m02/)–[M4](./m04/), [M9](./m09/)) covers it |
| Runs that must survive crashes mid-tool-call | <Status kind="caveat" /> durable agents are **beta** | <Status kind="yes" /> Temporal / Restate / DBOS, or Inngest | | [M7](./m07/#production-readiness): recovery re-runs the in-flight step; tools must be idempotent |
| Multi-replica deployment | <Status kind="caveat" /> needs a fencing store + distributed PubSub (pre-1.0 packages) | <Status kind="yes" /> sticky routing or a queue in front | | [M2](./m02/#production-readiness), [M6](./m06/#production-readiness), [M7](./m07/#production-readiness): default PubSub is per-process; workflow boot restart has no claim |
| Long timers, versioned long-running processes | <Status kind="no" /> default-engine timers are `setTimeout` | <Status kind="yes" /> Temporal | | [M5](./m05/#production-readiness): no run versioning, fixed-delay retries |
| Guaranteed delivery of external events | <Status kind="caveat" /> `persist` to the inbox | <Status kind="yes" /> a durable queue → `agent.stream` | | [M6](./m06/#production-readiness): pending queues live in memory |
| Multi-tenant data isolation | <Status kind="caveat" /> your app must enforce it | <Status kind="yes" /> authz in your API layer | | [M4](./m04/#production-readiness): *"The memory system doesn't enforce access control."* |
| Delegation among specialist agents | <Status kind="yes" /> supervisor agents | | | [M8](./m08/#production-readiness): networks are deprecated; subagents see the parent context by default |
| Agents coordinating peer-to-peer across hosts | <Status kind="no" /> experimental pieces | <Status kind="yes" /> a message bus | <Status kind="build" /> if it's core to your product | [M8](./m08/#production-readiness): ownership/discovery are undocumented; cross-agent is experimental |
| Org-wide guardrails and model policy | <Status kind="yes" /> processors per agent | <Status kind="yes" /> plus an LLM gateway | | [M3](./m03/#production-readiness): processors are per-agent code on the hot path |
| Evals and tracing in CI | <Status kind="yes" /> scorers + tracing | <Status kind="yes" /> export to your APM or eval platform | | [M9](./m09/#production-readiness): stable; move trace storage off the app DB at scale |

<Quiz module="adopt" id="payments" question="A team runs an agent that charges cards, on four replicas behind a load balancer. Which plan would you approve?" :options="q_adopt" />

## The stability map

Every primitive the course teaches, with its status at the pinned release and a link to the source of that status. Hover a badge for what the status means.

<StabilityPanel :ids="ALL" title="Stability at @mastra/core@1.76.0" />

<Callout type="warn" title="The docs disagree with themselves once">

The durable-agents page marks durable agents **beta**. The signals page refers to *"experimental durable and evented agents"*. When the docs disagree, plan for the more cautious label.

</Callout>

## Reference shapes

<Reveal title="Shape 1: one instance (or sticky routing per thread)" kicker="simplest" color="lime" icon="check">

- Postgres (or a libSQL file) for storage, default `EventEmitterPubSub`.
- `recovery.workflows: 'auto'` (default). Durable agents only if you accept beta, with `recovery.durableAgents: 'auto'`.
- Idempotency keys on every side-effecting tool. `mastra.shutdown()` on SIGTERM.
- **Fails when** the instance dies: in-memory signal queues and in-flight timers are lost; recovery re-runs in-flight steps.

</Reveal>

<Reveal title="Shape 2: several replicas sharing state" kicker="needs care" color="amber" icon="alert">

- Postgres for storage (a fencing store for workflows **and** memory).
- `RedisStreamsPubSub` or `ValkeyStreamsPubSub` on every instance (pin exactly: pre-1.0).
- `recovery.durableAgents: 'auto'` everywhere *only* with that shared claim; `recovery.workflows` on one instance unless steps are idempotent.
- Alerts on runs stuck in `running`, and on claim conflicts (`DURABLE_AGENT_EXECUTION_CONFLICT`).

</Reveal>

<Reveal title="Shape 3: Mastra inside a durable engine" kicker="strongest guarantees" color="violet" icon="bolt">

- A Temporal / Restate / DBOS workflow owns the process; each agent turn (or each tool call) is an activity or journaled step.
- Mastra provides the loop, processors, memory and scorers; the engine provides timers, retries, versioning and ownership.
- **Costs**: two runtimes to operate, and you must keep agent steps idempotent and replay-safe.

</Reveal>

## Checklist

Tick it off for the system you're reviewing. It's saved in your browser.

<Checklist id="adopting" :groups="checklist" />

## Questions to ask in the design review

1. Which guarantees does this agent need: at-most-once, at-least-once, or effectively-once side effects? Where is each enforced?
2. What happens on `kill -9` during a tool call? During a model stream? During a `sleep`? (Run Module 7's crash lab against your setup.)
3. What happens with two instances? Who recovers, who receives signals, who owns the thread?
4. Which features in use are beta, experimental or deprecated (see the map above)? Who owns the upgrade?
5. What does an upgrade from the pinned version to `@latest` change in your traces, prompts and model-call counts?
6. Where do tenant boundaries get enforced, and is any `resourceId` client-controlled?
7. What's the exit plan if a beta API changes shape?

## Further reading {#further-reading}

<FurtherReading module="adopting" />

<MascotSays mood="thinking">

Skepticism isn't a no. The point is to know which guarantee comes from Mastra, which from your infrastructure, and which from nobody yet.

</MascotSays>
