// "Production readiness" content per module: the review a cautious platform team would write
// before letting the primitive near a critical path. Claims are verified against the pinned
// commit (the @mastra/core@1.77.0 release commit) and the labs; stability ids come from stability.ts.
export type Prod = {
  ids: string[];
  verdict: string;
  safe: string[];
  caution: string[];
  failures: { mode: string; guard: string }[];
  guardrails: string[];
  alternatives: string[];
  check: { question: string; options: { text: string; correct?: boolean; why: string }[] };
};

export const PROD: Record<string, Prod> = {
  '01': {
    ids: ['agent', 'tool-concurrency', 'durable-agents', 'run-claims'],
    verdict: 'Nothing in this module ships as is. It gives your review its vocabulary. Every later module is judged against these guarantees: **journal, idempotency, fencing, safe points, deterministic order.**',
    safe: [
      'The concepts. They\'re framework-neutral and map one-to-one onto Temporal, Restate and DBOS.',
      'The from-scratch loop as a **test oracle**: about 100 lines you can diff against Mastra\'s behavior when an upgrade surprises you.',
    ],
    caution: [
      'Don\'t ship the from-scratch loop. It has no persistence, no tracing, no backpressure and no auth.',
      'Mastra exposes a seam for a journal (`wrapDurableOperation`), but it\'s a **no-op on the default engine** (Module 5).',
    ],
    failures: [
      { mode: 'A tool side effect repeats after a retry or crash', guard: 'An idempotency key from stable ids (run id + tool call id) that the downstream API dedupes on' },
      { mode: 'Two workers act on the same run', guard: 'A fencing token or generation checked on every write (Module 7: run claims in 1.76.0)' },
      { mode: 'Prompt order depends on which tool finished first', guard: 'Fold results back in **call order**; replay tests (Module 9)' },
      { mode: 'A runaway loop burns tokens', guard: '`maxSteps` + a repeat-detecting `stopWhen` + a cost cap' },
    ],
    guardrails: [
      'For each agent, write down which guarantees it needs **before** you pick a framework',
      'Every external side effect carries an idempotency key',
      'Every loop has a step cap and a loop-detection stop',
      'Ordering is deterministic, so replays match',
    ],
    alternatives: [
      'Temporal, Restate or DBOS for durable execution with a real journal',
      'The AI SDK\'s `generateText` with `stopWhen` for simple single-process agents',
      'Your own loop, only if you need a guarantee no framework gives (and you\'ll own it forever)',
    ],
    check: {
      question: "Your team picks a framework with \"durable agents\" for an agent that calls a payment API. What do you still need?",
      options: [
        { text: "Nothing: durable means exactly-once", why: "Durable means *resumable*. Every engine re-runs the step that was in flight at the crash." },
        { text: "An idempotency key the payment API dedupes on, built from stable ids", correct: true, why: "Recovery, retries and replica races all re-run in-flight work. Only the downstream dedupe makes the charge effectively-once." },
        { text: "A longer timeout on the payment call", why: "Timeouts change *when* you retry, not *whether* the charge repeats." },
      ],
    },
  },
  '02': {
    ids: ['agent', 'tool-concurrency', 'distributed-pubsub', 'background-tasks', 'goals'],
    verdict: 'The loop is mature core code, and it\'s a workflow under the hood. The production risks are **concurrency defaults and per-process state**, not the loop itself.',
    safe: [
      '`agent.generate()` / `agent.stream()`, `maxSteps`, `stopWhen`, `onIterationComplete`',
      'Tool results folded back in call order',
      'Hook order is stable and testable (Lab 2 pins it, and it\'s identical on 1.75.0 through 1.77.0)',
    ],
    caution: [
      'Tool calls in one step run **concurrently, up to 10 by default** (forced to 1 when any available tool can require approval or suspend). Your tools must tolerate that.',
      'One active run per thread is coordinated through PubSub. The default `EventEmitterPubSub` covers **one process**.',
      'Background tasks (1.29.0+) and goals (1.43.0+) are newer loop features. Expect churn.',
    ],
    failures: [
      { mode: 'Two tool calls race on read → await → write', guard: '`toolCallConcurrency: 1`, or atomic and idempotent tools (Lab 2 break-it)' },
      { mode: 'The same thread is driven from two instances', guard: 'Redis or Valkey Streams PubSub, or route each thread to one instance' },
      { mode: 'The model repeats the same tool call forever', guard: 'A repeat-detecting `stopWhen` + `maxSteps`' },
      { mode: 'An upgrade reorders hooks', guard: 'Exact version pins + a hook-order test like Lab 2\'s' },
    ],
    guardrails: [
      'Pin `@mastra/core` to an exact version (no `^`); upgrade deliberately with the labs as a canary',
      'Set `maxSteps` and a `stopWhen` on every agent',
      'Choose `toolCallConcurrency` per agent. 10 is a default, not a safety property',
      'Before scaling out, set up a distributed PubSub or sticky routing per thread',
    ],
    alternatives: [
      'The AI SDK\'s `generateText` / `streamText` with tools and `stopWhen` (the model layer Mastra builds on)',
      'LangGraph, for explicit graph-level control of the loop',
      'OpenAI Agents SDK, if you\'re committed to one provider',
    ],
    check: {
      question: "You scale an agent from 1 to 3 replicas behind a round-robin load balancer, with the default config. Two requests for the same thread land on different replicas. What keeps the thread to one active run?",
      options: [
        { text: "Mastra's one-run-per-thread rule, everywhere", why: "That rule is coordinated over PubSub, and the default `EventEmitterPubSub` only covers one process." },
        { text: "Nothing, by default. You need a distributed PubSub (Redis/Valkey Streams) or sticky routing per thread", correct: true, why: "Per-process defaults are the most common surprise when scaling out." },
        { text: "The database's row locks on the thread", why: "Storage isn't used as a run lock for threads." },
      ],
    },
  },
  '03': {
    ids: ['processors', 'processor-caching', 'tracing'],
    verdict: 'Processors are the right place for guardrails, and the API is stable. They\'re **your code on the hot path**: test them like code, order them on purpose, and keep LLM-backed checks cheap.',
    safe: [
      'Input, output and per-step hooks; tripwires that abort a run',
      'Composition order is deterministic (Lab 3: `hi[X][Y]`)',
      'Each processor gets its own span (`<phase> processor: <id>`), so you can see it in traces',
    ],
    caution: [
      'Processor **response caching is beta**',
      'Mastra adds built-in processors around yours. 1.76.0 added one (`unsupported-file-handler`) that shows up in traces',
      'Streaming redaction must handle secrets split **across chunks** (Exercise 3.1)',
      'Output stream processors **fail closed** since #25826 (1.76.0): a throw stops the run instead of passing raw output through. Good for safety, but a buggy processor is now an outage',
    ],
    failures: [
      { mode: 'A secret split across two stream chunks slips through', guard: 'A boundary-aware redactor that buffers to a safe point (Exercise 3.1)' },
      { mode: 'Reordering processors changes the output', guard: 'An order test pinned in CI' },
      { mode: 'An LLM-based guardrail doubles latency and cost', guard: 'A cheap rule first, the LLM check only when needed; measure it with spans' },
      { mode: 'A guardrail fails open on its own error', guard: 'Output stream processors fail closed by default now; for others, decide fail-open vs fail-closed and test the throw path' },
    ],
    guardrails: [
      'Unit-test every processor with a mock model (Lab 3)',
      'Pin a processor-order test',
      'Use tripwires to fail closed on policy violations',
      'Watch processor spans for latency (Module 9)',
    ],
    alternatives: [
      'AI SDK `wrapLanguageModel` middleware (wraps a single model call; it never sees tools or the loop)',
      'An LLM gateway or proxy for org-wide policy, independent of the framework',
      'Moderation or PII APIs called from inside a processor',
    ],
    check: {
      question: "Your guardrail processor calls a moderation API, and the API times out. What should the review ask first?",
      options: [
        { text: "Whether the timeout fails the run (closed) or lets the output through (open), and whether that was chosen on purpose and tested", correct: true, why: "Every guardrail has an error path. Leaving it implicit is how policy gets bypassed under load." },
        { text: "Whether the processor is registered first", why: "Order matters for composition, but it doesn't decide what happens on error." },
        { text: "Whether response caching is on", why: "Caching (beta) can reduce calls, but the error path still needs a decision." },
      ],
    },
  },
  '04': {
    ids: ['memory', 'last-messages', 'observational-memory', 'wm-state-signals'],
    verdict: 'Memory is stable storage plus a **selection policy**. The default selection (the last 10 messages) is deprecated and rarely what production needs, and **access control is your job**.',
    safe: [
      'Threads and resources on a durable store (Postgres, libSQL file, Turso)',
      'Token-bounded history with `messageHistory: { maxTokens }`',
      'Semantic recall and working memory, when you configure them on purpose',
    ],
    caution: [
      '`lastMessages` (default 10) is **deprecated** in favor of `messageHistory`',
      'The docs: *"The memory system doesn\'t enforce access control."* Verify that the caller owns `resourceId` before every query',
      'A thread\'s `resourceId` can\'t change after creation',
      'Observational memory is newer (`@mastra/memory` 1.1.0); working memory as state signals is **experimental**',
      'Before 1.77.0, observational memory could lose buffered observations when a reflection, background buffering and activation overlapped ([#25906](https://github.com/mastra-ai/mastra/pull/25906)). 1.77.0 and the store adapters released with it fix this and add a `supersededBy` column at startup. If you manage the schema yourself (`disableInit: true`), add that column before upgrading, and upgrade every process that shares the database',
    ],
    failures: [
      { mode: 'A fact from message 1 is gone by message 11', guard: 'Working memory or semantic recall; a token budget instead of a count' },
      { mode: 'Tenant A reads tenant B\'s thread', guard: 'Derive `resourceId` server-side from auth; never trust a client value' },
      { mode: 'Long tool results blow the context window', guard: '`messageHistory.maxTokens` + a tool-result truncation processor' },
      { mode: 'Prompt-cache hit rate collapses on long threads', guard: 'A sliding `lastMessages` window changes the prompt prefix every turn. Token trimming removes history in chunks (`atMaxRemoveTokens`, default 25%), and transient signals or appended reminders keep the prefix stable' },
      { mode: 'Trimming splits a tool call from its result', guard: 'Trim by call/result pairs, and test it (Lab 4)' },
      { mode: 'Observations vanish when reflection and buffering overlap', guard: 'Run `@mastra/core` 1.77.0+ with a matching store adapter on **every** process; older processes neither set nor check `supersededBy`' },
    ],
    guardrails: [
      'Set history explicitly. Don\'t inherit a deprecated default',
      'A durable store anywhere beyond a demo; in-memory storage loses everything on restart',
      'An authorization check on `resourceId` in your app layer',
      'A retention and PII policy for stored messages. Embeddings are copies too',
    ],
    alternatives: [
      'Your own message table + retrieval in the database you already run',
      'Dedicated memory services (for example Zep, Mem0, Letta)',
      'A vector database queried directly from a tool',
    ],
    check: {
      question: "A client sends `resourceId` in the request body, and the server passes it straight to memory. What's the risk?",
      options: [
        { text: "None: Mastra checks thread ownership", why: "The docs say it plainly: *\"The memory system doesn't enforce access control.\"*" },
        { text: "Cross-tenant reads: anyone can load another user's threads and working memory", correct: true, why: "Derive `resourceId` from the authenticated identity on the server, every time." },
        { text: "Only a performance risk, because of semantic recall", why: "The problem is authorization, not speed." },
      ],
    },
  },
  '05': {
    ids: ['workflows', 'workflow-recovery', 'dynamic-workflows', 'temporal-runner', 'workers', 'schedules'],
    verdict: 'Workflows are solid for step graphs with suspend/resume. The default engine **isn\'t a durable-execution engine**: timers, retries and versioning are much thinner than Temporal\'s.',
    safe: [
      '`createWorkflow` / `createStep` with `.then`, `.parallel`, `.branch`, `.dowhile`, `.foreach`',
      'Suspend/resume across processes, with a snapshot after every step',
      'Boot-time restart of RUNNING/WAITING runs (`recovery.workflows: \'auto\'`, on by default)',
    ],
    caution: [
      'Timers on the default engine are `setTimeout`. A restart re-runs the sleep or the step',
      'Retries are a fixed `delay`: no exponential backoff, jitter or heartbeats',
      'No run versioning. A restart replays against the code deployed **now**',
      'Boot restart takes **no ownership claim**: two replicas can re-run the same in-flight step',
      'Dynamic workflows and workers are **beta**; `@mastra/temporal` is **experimental** and pre-1.0 (0.4.14)',
      '`mastra.shutdown({ drainTimeout })` gives in-flight evented runs a deadline (default 5000 ms); runs past it are abandoned',
    ],
    failures: [
      { mode: 'A double resume runs a step twice', guard: 'Idempotent steps keyed on run id + step id (Lab 5 race)' },
      { mode: 'A deploy changes the graph under suspended runs', guard: 'Drain or migrate runs before changing step ids; version workflow ids (`refund-v2`)' },
      { mode: 'A replica restart double-runs in-flight steps', guard: '`recovery.workflows: \'off\'` on all but one instance, or idempotent steps' },
      { mode: 'A one-hour sleep restarts on every crash', guard: 'The evented engine, Inngest, or Temporal for durable timers' },
    ],
    guardrails: [
      'Make every step idempotent (it may run more than once)',
      'Use a durable store for snapshots (Postgres or libSQL file, not in-memory)',
      'Decide which instance runs boot recovery',
      'Put a version in workflow ids when the graph changes incompatibly',
    ],
    alternatives: [
      'Temporal, for durable timers, event history, versioning (`patched`) and heartbeats',
      'Restate or DBOS, for journaled steps with less infrastructure',
      'Inngest, as a Mastra workflow runner with step memoization',
    ],
    check: {
      question: "You rename a workflow step and deploy while 200 runs are suspended on it. What happens when they resume?",
      options: [
        { text: "Mastra resumes each run on the version that started it", why: "There's no run versioning on the default engine." },
        { text: "They resume against the code deployed now. Nothing checks the graph, so a renamed step can fail to resume", correct: true, why: "Drain or migrate suspended runs first, or put a version in the workflow id." },
        { text: "Suspended runs are cancelled on deploy", why: "Snapshots persist, which is exactly why the mismatch matters." },
      ],
    },
  },
  '06': {
    ids: ['signals', 'notifications', 'signal-providers', 'distributed-pubsub', 'cross-agent'],
    verdict: 'Signals are a well-designed mailbox with a stable API (since 1.39.0). Delivery is only as durable as your **PubSub and storage**: on the defaults, assume at-most-once for anything not persisted.',
    safe: [
      '`sendSignal` with `ifActive` / `ifIdle` behaviors (`deliver`, `persist`, `discard`, `wake`)',
      'Notification inbox records, priorities, batching and the inbox tool (needs storage with `notifications` support)',
      'Custom `SignalProvider`s (1.42.0+)',
    ],
    caution: [
      'Pending signals for an active run are queued **in memory**. A crash loses undelivered ones',
      'Even `persist` isn\'t an outbox: `accepted` resolves **before** the storage write. Await `result.persisted` before you ack the upstream event',
      'The default `EventEmitterPubSub` covers one process. The distributed backends (Redis/Valkey Streams) are **pre-1.0 packages**',
      'Notification timing **changed in 1.76.0** (a summary joins the first request; tag attributes are sorted)',
      'Cross-agent communication is **experimental** and off by default',
      'A woken run gets only the options you pass it',
    ],
    failures: [
      { mode: 'A signal is accepted, then the process dies before the drain', guard: '`persist` (an inbox record) for anything you can\'t lose, ack upstream only after `await result.persisted`, and handle redelivery idempotently' },
      { mode: 'The thread is owned by another instance', guard: 'Redis or Valkey Streams PubSub so delivery and leases span instances' },
      { mode: 'An event storm wakes agents again and again', guard: 'Priorities, batching, `dedupeKey` / `coalesceKey`, and a pure `decide`' },
      { mode: 'External event text injects instructions', guard: 'Signals reach the model as **user-role** messages. Treat event content as untrusted input' },
    ],
    guardrails: [
      'Classify each signal type: may it be lost? Persist the ones that may not',
      'Run a distributed PubSub before you run more than one instance',
      'Pass explicit `streamOptions` for woken runs, and test them',
      'Don\'t string-match signal tags in tests (the format changed in a minor release)',
    ],
    alternatives: [
      'A message queue (SQS, Pub/Sub, Kafka) with your own consumer that calls `agent.stream`',
      'Temporal signals on a workflow that drives the agent',
      'Webhooks into a job queue',
    ],
    check: {
      question: "On the default in-memory transport, which signal can you afford to lose in a crash?",
      options: [
        { text: "\"CI is green, FYI\" to a busy agent", correct: true, why: "Informational and repeatable. If it's lost, nothing breaks." },
        { text: "\"Refund approved, execute it\"", why: "This is a command with money attached. Persist it (inbox record or a durable queue) and handle it idempotently." },
        { text: "Both: Mastra persists every accepted signal", why: "Pending signals for an active run are queued in memory until the next drain." },
      ],
    },
  },
  '07': {
    ids: ['durable-agents', 'run-claims', 'workflow-recovery', 'distributed-pubsub'],
    verdict: 'Durable agents are **beta** and changed materially in 1.76.0. They\'re reasonable for single-instance or fencing-store deployments with **idempotent tools**. They don\'t yet replace a durable-execution engine.',
    safe: [
      'HITL snapshots (`pending`, `paused`, `suspended`) are always persisted',
      'Recovery from the last step boundary: completed LLM calls and tools aren\'t repeated',
      'Run claims with fencing since 1.76.0 (InMemory, Postgres, libSQL, Turso). The adapters released with 1.77.0 add MySQL, MSSQL, Oracle, DSQL, Spanner, MongoDB, DynamoDB, Convex, Cloudflare (Durable Objects and D1), Redis, Upstash and Valkey',
    ],
    caution: [
      '**Beta**: *"Breaking changes may occur without a major version bump"*',
      'Recovery re-runs the in-flight step. LLM calls cost again, tools re-execute, and a sub-agent delegation re-runs whole',
      '`recovery.durableAgents` is `off` by default: `running` checkpoints are written only at step boundaries reached during the `mastra.shutdown()` drain (1.76.0+), so a hard crash leaves nothing to recover',
      'Closures (`stopWhen`, `onIterationComplete`) don\'t survive recovery in another process: only `maxSteps` does. Non-JSON `RequestContext` values are dropped; `eagerToolExecution` throws',
      'Memory writes are fenced only if the **memory** store supports fencing too',
      'Without a fencing store, the claim is a PubSub lease: stale writers are *not* rejected, and Redis/Valkey Streams are pre-1.0 packages',
      'The tool context has no `runId` (1.75.0 through 1.77.0): pass it through `RequestContext`',
    ],
    failures: [
      { mode: 'kill -9 during a tool call', guard: 'An idempotency key = run id + tool call id (Exercise 7.1)' },
      { mode: 'Two replicas recover the same run', guard: 'A fencing store or a shared Redis/Valkey lease; otherwise leader-elect recovery' },
      { mode: 'Plain workflows double-run when replicas boot', guard: '`recovery.workflows: \'off\'` except on one instance, or idempotent steps' },
      { mode: 'A hung execution holds the claim', guard: '`recover(runId, { force: true })` (1.76.0+)' },
      { mode: 'A recovered run ignores your `stopWhen` guard', guard: 'Put hard limits in `maxSteps` or a registered processor; closures stay in the dead process' },
      { mode: 'An ops script calls `recover()` on a run waiting for approval', guard: 'Suspended runs are refused (409): use `resume()`' },
      { mode: 'Rolling deploys orphan runs for 30 s', guard: 'Call `mastra.shutdown({ drainTimeout })` on SIGTERM (default 5000 ms): it checkpoints at step boundaries and releases claims' },
    ],
    guardrails: [
      'Pin the exact version. Re-run a crash lab on every upgrade',
      'Make every tool idempotent, including tools used by sub-agents',
      'Use a fencing store for workflows **and** memory',
      'Wire `mastra.shutdown()` to SIGTERM',
      'Alert on runs stuck in `running` longer than the claim TTL',
    ],
    alternatives: [
      '`createInngestAgent` (Inngest step memoization)',
      'Temporal, Restate or DBOS, with model and tool calls as activities or journaled steps',
      'A workflow that calls the agent from a step with idempotent tools (Module 5)',
    ],
    check: {
      question: "On 1.77.0 with Postgres storage, three replicas run `recovery.durableAgents: 'auto'`. One crashes in the middle of `charge_card`. What's still your job?",
      options: [
        { text: "Nothing: claims and fencing make it exactly-once", why: "Claims stop two live executions. Recovery still re-runs the in-flight tool." },
        { text: "Make `charge_card` idempotent (run id + tool call id), and alert on runs stuck past the claim TTL", correct: true, why: "Fencing decides *who* recovers. Idempotency decides whether the effect repeats." },
        { text: "Turn recovery off on two of the replicas", why: "With a fencing store, every replica can recover safely. The tool still repeats." },
      ],
    },
  },
  '08': {
    ids: ['subagents', 'networks', 'workflows', 'signals', 'thread-ownership', 'cross-agent'],
    verdict: 'Use **supervisor agents** for delegation and **workflows** for fixed pipelines; both are stable. Agent networks are **deprecated**. Peer-to-peer signaling between long-lived agents is the frontier: experimental pieces, at-most-once by default.',
    safe: [
      'Supervisor agents: `agents: { … }` on a parent, with delegation hooks and `messageFilter` (1.8.0+)',
      'Agents as workflow steps (`createStepFromAgent`), with snapshots and retries',
      '`sendSignal` between threads inside one process',
    ],
    caution: [
      '`.network()` is **deprecated**: *"will be removed in a future major release"*',
      'By default, subagents receive the **full parent conversation**. Filter it',
      '`claimThreadOwnership` / `discoverThreadPeers` are undocumented; the feature built on them is experimental',
      'Discovery and delivery cross processes only with Unix-socket or Redis/Valkey PubSub',
    ],
    failures: [
      { mode: 'A subagent sees PII it doesn\'t need', guard: '`messageFilter` to strip or trim the context' },
      { mode: 'A crash replays a whole delegation, including the helper\'s completed tool calls', guard: 'Idempotency keys on **sub-agent** tools too; long helpers as workflow steps or separate threads' },
      { mode: 'Two agents wake each other forever', guard: 'A hop budget carried in the signal (Exercise 8.1)' },
      { mode: 'A failed delegation gets ignored by the parent', guard: '`onDelegationComplete` with `bail()` or explicit feedback' },
    ],
    guardrails: [
      'No new `.network()` code; plan the migration for existing code',
      'Set a `messageFilter` policy on every supervisor',
      'Cap delegations with `modifiedMaxSteps` and an iteration limit',
      'A hop or TTL budget on agent-to-agent messages',
    ],
    alternatives: [
      'LangGraph supervisor and multi-agent graphs',
      'OpenAI Agents SDK handoffs',
      'A message bus between independent services, each running one agent',
    ],
    check: {
      question: "A new project needs a router agent that picks among three specialists. A teammate copies a `.network()` example. What's your review?",
      options: [
        { text: "Approve: networks are the routing primitive", why: "They're deprecated and will be removed in a future major release." },
        { text: "Use a supervisor agent with subagents, and set a `messageFilter`, because subagents get the parent's full context by default", correct: true, why: "Same coordination on the supported API, without leaking the conversation to every helper." },
        { text: "Use signals between the agents", why: "Signals are for independent, long-lived agents. This is per-turn delegation." },
      ],
    },
  },
  '09': {
    ids: ['tracing', 'scorers', 'datasets'],
    verdict: 'Tracing and scorers are stable and worth adopting **first**: they\'re how you\'ll catch every other failure in this course. Budget for the storage, and keep CI gates deterministic.',
    safe: [
      '`@mastra/observability` tracing with exporters (OTel, Langfuse, Braintrust, Datadog and others)',
      'Rule-based and LLM-judge scorers; `runEvals` over datasets',
      'Datasets and experiments (1.4.0+)',
      'Test helpers shipped in the package: `@mastra/core/test-utils/llm-mock` (`createMockModel`)',
    ],
    caution: [
      'The trace shape **changed in 1.76.0** (a new built-in processor span)',
      'Span links are new in 1.77.0: an MCP tool call and the server span that handled it now link across traces. Exporters only send links if they support them',
      'The docs warn observability data *"can quickly overwhelm general-purpose databases"*: route it to ClickHouse or an external exporter',
      'LLM-judge scores aren\'t deterministic',
      'Record/replay tapes are a course pattern (~30 lines), not a Mastra feature',
      'Goals (1.43.0+) gate the loop on a judge model with a run budget (`maxRuns`, default 50). A judge is a model call per iteration: budget for it',
    ],
    failures: [
      { mode: 'Prompt drift silently changes behavior', guard: 'Replay tapes + a CI gate on rule scorers (Lab 9)' },
      { mode: 'A flaky judge fails CI', guard: 'Gate on rule scorers; track judge scores as trends over a dataset' },
      { mode: 'Traces capture secrets or PII', guard: '`SensitiveDataFilter` span processor + exporter-side redaction' },
      { mode: 'Trace writes slow the app database', guard: 'Composite storage with ClickHouse, or an external exporter' },
    ],
    guardrails: [
      'Tracing on from day one, with redaction',
      'Assert on the spans you care about, not on exact span counts',
      'Keep a golden dataset per agent; run it on every model or prompt change',
      'Separate observability storage from transactional storage at scale',
    ],
    alternatives: [
      'OpenTelemetry straight to your existing APM',
      'Hosted eval and observability platforms (Langfuse, Braintrust, LangSmith, Arize)',
      'Promptfoo or a plain test runner for offline evals',
    ],
    check: {
      question: "Your CI gate asserts that the trace has exactly 9 spans. After the upgrade to 1.76.0 it fails. What's the right fix?",
      options: [
        { text: "Update the count to 11", why: "That passes today and breaks on the next built-in processor." },
        { text: "Assert on the spans you care about (`tool_call`, `model_inference`, their nesting), not on totals", correct: true, why: "1.76.0 added a built-in request-processor span. Gates should track behavior, not framework internals." },
        { text: "Pin 1.75.0 forever", why: "Pinning is right, but freezing is how you miss fixes like run claims." },
      ],
    },
  },
  '10': {
    ids: ['durable-agents', 'run-claims', 'signals', 'workflows'],
    verdict: 'A primitive you add is production-ready when it passes the same review you gave Mastra\'s: a **pinned version**, a break-it test on stock Mastra, defined crash and multi-instance behavior, and an exit plan if upstream ships something different.',
    safe: [
      'Building on public exports (processors, tools, workflows, `RequestContext`, storage adapters)',
      'Designing as an adapter you can delete when upstream catches up',
    ],
    caution: [
      'Internal or undocumented APIs (`#private` fields, undocumented `Agent` methods) can change in a minor release',
      'Upstream moves fast: run claims and new processors both landed in 1.76.0',
      'A private fork drifts. Upstream through a public RFC or PR instead',
      'The contribution rules are strict: a PR must link an issue, feature PRs are closed while the issue is still `status: needs approval`, and an automated gate checks that changed tests fail on the base branch',
    ],
    failures: [
      { mode: 'A minor upgrade breaks your primitive', guard: 'CI on the pinned version **and** `@latest` (this course\'s Labs workflow)' },
      { mode: 'Upstream ships an overlapping feature', guard: 'Keep the primitive behind your own interface; migrate behind it' },
      { mode: 'The primitive is correct on one instance and wrong on two', guard: 'A multi-process test (like the Module 7 crash lab) in the RFC\'s test plan' },
    ],
    guardrails: [
      'Prove the RFC\'s break-it test fails on stock Mastra and passes with the primitive',
      'Document crash, retry and multi-instance behavior',
      'Name an owner and an exit plan',
      'Check upstream issues and PRs before building (Module 10\'s gap list)',
    ],
    alternatives: [
      'Wait: check the open issues and PRs; it may be in flight',
      'Use a dedicated engine for that guarantee (Temporal, Restate, a queue) and integrate',
      'Contribute it upstream',
    ],
    check: {
      question: "Your primitive reads a private field on `Agent` to work. What's the production risk?",
      options: [
        { text: "None, if the tests pass", why: "Tests pass on the pinned version. Private internals can change in any minor release." },
        { text: "It can break silently on a minor upgrade. Build on public exports, and run CI on the pin and on `@latest`", correct: true, why: "That's why this course's Labs workflow runs both." },
        { text: "Only a licensing risk", why: "The risk is breakage, not licensing." },
      ],
    },
  },
};
