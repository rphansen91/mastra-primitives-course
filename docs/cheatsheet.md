---
pageClass: wide
aside: false
---

# Decision-table cheat sheet

Every module's "when to choose something else" table in one place. **Bold** = the Mastra primitive.

## Choosing the primitive

| I need… | Use | Not | Alternatives |
|---|---|---|---|
| One LLM call with tools in a script | AI SDK `generateText` + `stopWhen` | a full agent with memory | **Agent** if it grows |
| A model that decides which tools to call in a conversation | **Agent loop** (M2) | a workflow (the shape isn't known) | LangGraph agent, OpenAI Agents SDK |
| A known sequence/branch/fan-out of steps | **Workflow** (M5) | an agent loop | Temporal, Inngest, LangGraph graph, plain code |
| A pause for human approval | **Workflow suspend/resume** or **tool approval** (M5) | polling | Temporal signals, LangGraph `interrupt` |
| Cross-cutting behavior at a loop phase (guardrails, redaction, budgets, context) | **Processor** (M3) | a new `Agent` option | AI SDK model middleware (model-level only), LangChain middleware |
| A hard step budget | **`maxSteps`** (M2) | | |
| A reasoned stop ("loop detected", "goal met") | **`stopWhen`** / goals (M2) | `maxSteps` alone | |
| Safe parallel tools with shared state | atomic tools; **`toolCallConcurrency`** (M2) | relying on result ordering | DB transactions |
| History across requests | **Memory: threads + `messageHistory: { maxTokens }`** (M4; `lastMessages` is deprecated) | stuffing the prompt by hand | LangGraph checkpointer |
| Facts about the user that persist | **Working memory** (M4) | long raw history | a database; Zep/Letta-style services |
| Relevant old messages | **Semantic recall** (M4) | a bigger history window | a RAG tool |
| Tell a busy agent something without a second run | **`sendSignal` (deliver)** (M6) | a new `stream()` on the same thread | Temporal signals (durable, no agent semantics) |
| Wake an idle agent on an event | **`sendSignal` (wake)** + memory (M4, M6) | cron polling inside a tool | a queue consumer calling `stream()` |
| Priority-aware interrupt vs digest | **Notifications + delivery policy** (M6) | ad-hoc `if` in a webhook | |
| An external event source (GitHub, chat, webhooks) | **SignalProvider** (M6) | custom polling loops | AgentController channels for chat |
| Survive crashes mid-run | **Durable agent** + `recovery.durableAgents: 'auto'` + fencing store (M7) | a plain `Agent.stream()` | `createInngestAgent`, Temporal, Restate, DBOS |
| Exactly-once external effects | **Idempotency keys** (`runId:toolCallId`) (M1, M7) | trusting recovery | Restate `ctx.run`, outbox pattern |
| Multiple replicas sharing a DB | fencing store + leased PubSub; `recovery.workflows: 'off'` unless steps are idempotent (M7) | defaults | single instance; leader election |
| Answer a sub-question within a turn | **Subagent** on a supervisor (M8) | signals | LangGraph subgraph |
| Route among specialists per turn | **Supervisor agent + subagents** (M8; `.network()` is deprecated) | if/else in a tool | OpenAI handoffs, LangGraph supervisor |
| Long-lived agents informing each other mid-work | **Signals** + ownership + discovery (M8; ownership/discovery are experimental) | sub-agents (they block) | message bus + mailbox |
| Quality checks in CI and production | **Scorers** + `runEvals` (M9) | eyeballing traces | Braintrust, LangSmith |
| Deterministic agent tests without keys | mock model / record-replay tapes (M9; Mastra's `_llm-recorder` is a private internal package) | live models in CI | VCR-style HTTP recording |

## Per-module tables

### M1 First principles

| Primitive | Use when | Don't when | Alternatives |
|---|---|---|---|
| Hand-written loop | learning; one short tool-using call | memory, streaming, guardrails, recovery | AI SDK, Mastra Agent |
| Journal | expensive/external effects that must survive restarts | pure cheap computation | Temporal activities, Restate `ctx.run`, DBOS steps, Inngest `step.run` |
| Idempotency key | any retried external write | reads; naturally idempotent writes | dedupe tables, outbox |
| Fencing token | >1 worker can hold a run | strictly single instance | optimistic concurrency, single-writer queues |
| Signal mailbox | information for a busy agent | caller needs an answer now | request/response |

### M2 Agent loop

| Use when | Don't when | Alternatives |
|---|---|---|
| the model picks tools, in a thread | control flow is known | workflow; plain code |
| streaming + memory + processors + signals together | one LLM call in a script | AI SDK |
| many callers share threads | custom topologies | LangGraph; workflow with agent steps |
| you may want durability later | every step durable today at scale | Temporal / Restate / Inngest + durable agents |

### M3 Processors

| Use when | Don't when | Alternatives |
|---|---|---|
| behavior is cross-cutting | it's one tool's logic | the tool |
| you need a hook at a loop phase | you need different control flow | workflow |
| it should ship as a package | it must persist across runs | memory, state signals |
| guardrails, redaction, budgets, context | it reacts to external events mid-run | signals |

### M4 Memory

| Use when | Don't when | Alternatives |
|---|---|---|
| conversations span requests | single-shot tasks | explicit context |
| one config for history + working memory + recall | a full knowledge base | RAG as a tool |
| always-on agents woken by signals | exact auditable state machines | workflow state; your DB |
| long threads under a budget | cross-agent transactional memory | a database; LangGraph store |

### M5 Workflows

| Use when | Don't when | Alternatives |
|---|---|---|
| known shape | the model should decide | agent loop |
| human-in-the-loop pauses | durable timers/events at scale on the default engine | evented engine; Inngest/Temporal; Restate |
| per-step observability, time travel | non-idempotent steps + replicas + auto restart | single instance + `recovery.workflows: 'off'`; Temporal |
| one definition, several engines | in-flight versioning across deploys | Temporal `patched()`, Restate, DBOS |

### M6 Signals and notifications

| Use when | Don't when | Alternatives |
|---|---|---|
| a busy agent must learn something now | the sender needs a synchronous answer | `generate()`; agent-as-tool |
| priority-aware interrupt/digest | every event must be durable exactly-once | durable queue → idempotent `sendSignal` |
| external sources into threads | pure fan-out | PubSub |
| chat interjections | | LangGraph `interrupt`/`Command` |

### M7 Durability

| Use when | Don't when | Alternatives |
|---|---|---|
| long runs must survive crashes, tools idempotent | un-keyable effects | durable-engine activities |
| single instance or fencing store + claims | multi-replica on ≤1.75.x, or without a shared claim, with auto recovery | leader election; `createInngestAgent` |
| portable agent code across engines | durable timers/signals/versioning needed today | Temporal, Restate, DBOS, Cloudflare/Vercel Workflows |

### M8 Multi-agent

| Need | Choose | Alternatives |
|---|---|---|
| sub-question in a turn | sub-agent as tool | LangGraph subgraph |
| known pipeline | workflow + agent steps | Temporal |
| dynamic routing | supervisor agent (subagents) | OpenAI handoffs |
| independent long-lived agents | signals + ownership + discovery | message bus |
| cross-host | Redis/Valkey Streams PubSub | Temporal signals |

### M9 Evals and observability

| Use when | Don't when | Alternatives |
|---|---|---|
| spans that mirror loop structure | vendor SDK already standard | export to Langfuse/Braintrust/Datadog/OTel |
| one scorer definition live + traces + CI | huge offline experimentation | Braintrust, LangSmith |
| deterministic mechanics tests | provable incident replay | build a journal; Temporal history |
