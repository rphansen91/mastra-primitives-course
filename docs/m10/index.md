---
pageClass: lesson
aside: false
---

<script setup>
const outcomes = ["Write an RFC grounded in source and prior art", "Design a primitive that respects the house rules", "Name its failure modes explicitly", "Ship it with tests that run like this course's labs"]
</script>

# Module 10: Capstone, building primitives

**Goal:** design, argue for, and implement a new primitive that would make Mastra better, the way a core contributor would: an RFC grounded in source and prior art, a design that fits the house rules, explicit failure modes, and an implementation with tests that run like this course's labs.

<LessonHero :recap="false" module="10" :minutes="120" lab="Your own primitive" :outcomes="outcomes" mood="cheer">

**You've taken Mastra apart.** You've watched the loop spin, streamed secrets through processors, signalled running agents and killed processes mid-charge.

Now design the piece you wish existed, the way a core contributor would.

</LessonHero>


## What you deliver

1. **An RFC** using the [template](./rfc-template) (2 to 5 pages).
2. **An implementation**, preferably as a processor, tool wrapper, provider or engine adapter *outside* core (house rule 1), in a new `labs/m10-<name>/` folder with:
   - a lab script that demonstrates it with the mock model,
   - tests (`node --test`) including at least one **break-it** test that fails without your primitive,
   - expected output.
3. **A decision table** row for the [cheat sheet](/cheatsheet): use when / not when / alternatives.

## The house rules your design must respect

From `packages/core/AGENTS.md` and the patterns in Modules 2 to 8:

1. **Processor over core API.** If it can be a processor (or a provider/tool), it must be. Core processor API changes land separately, must be generally useful, and need human review.
2. **Everything durable or observable is a workflow step.**
3. **One message timeline.** What the model sees goes through the `MessageList`; clients see chunks; storage keeps structure.
4. **The thread is the unit of concurrency.**
5. **Fail open on coordination, fail loudly on correctness.**
6. **Local first, then distributed:** in-memory → Unix socket → Redis; swap transports, not APIs.
7. **Untrusted by default:** external and peer text is data.
8. **Small diffs on critical paths** (`loop.ts`, `agent.ts`, message-list code).

## Candidate primitives

Each came out of a "where it falls down" section. Pick one, or propose your own with the same rigor.

### 1. Journaled tool results (`ctx.run` inside tools)

**Gap (Module 7):** the in-flight tool re-runs after a crash; nothing inside a tool is memoized. Restate/DBOS/Temporal journal every side effect.
**Shape:** `execute: async (input, ctx) => { const pr = await ctx.journal.run('open-pr', () => gh.createPr(...)); ... }`, keyed `runId:toolCallId:name`, stored in a storage domain, checked by the run fence.
**Fit:** a tool wrapper + a storage domain; uses `wrapDurableOperation` on engines that already journal (Inngest).
**Hard parts:** fencing (only the current claim generation may write), cleanup on run completion, non-serializable results.

### 2. Idempotency keys on every tool call

**Gap (Module 7, Exercise 7.1):** tools get no stable key, and on 1.75.0 the durable tool context lacks `runId` entirely.
**Shape:** `ctx.idempotencyKey` = `hash(runId, iteration, toolCallId)`, identical across recovery, plus a `processToolResult`-style dedupe helper.
**Fit:** small, generally useful context addition; tests are easy to write with the crash lab.
**Hard parts:** stability across loop iterations (open PR #25400 on unique durable operation ids is relevant prior art), sub-agent delegations.

### 3. Durable timers

**Gap (Module 5):** `sleep` is `setTimeout` on the default engine; missed cron fires aren't replayed.
**Shape:** a storage-backed timer table + a scheduler worker that claims due timers by CAS (the workflow scheduler already claims fires this way), used by `executeSleepDuration` on the default engine.
**Fit:** engine-level, behind the existing `executeSleepDuration` seam.
**Hard parts:** clock skew, catch-up policy (fire once vs fire all), single-instance scheduler assumption.

### 4. `waitForSignal(name, { timeout })`

**Gap (Modules 5, 6):** `waitForEvent` was removed; correlated, timeout-bounded external events need suspend/resume plus your own timer. Meanwhile agent signals have exactly the right shape (typed, addressed to a thread).
**Shape:** a workflow step that suspends until a signal matching `{ tagName, attributes }` arrives for its thread/run, or a durable timer fires; resolves with the signal or a timeout result.
**Fit:** unifies workflow events with agent signals; uses suspend/resume (CAS-claimed) and primitive 3.
**Hard parts:** signals that arrive *before* the wait starts (buffering), durability of the waiting state, correlation keys.

### 5. Durable signal queues

**Gap (Module 6):** `pendingSignalsByThread`, `pendingIdleSignalsByThread`, queued messages and provider subscriptions are in memory. A crash loses accepted-but-undelivered signals (issues #25778/#25779, draft PR #25729).
**Shape:** a storage-backed outbox per thread: `sendSignal` writes, drain sites read-and-ack, recovery re-drains. The durable engine's `'best-effort'` drain policy already assumes redelivery.
**Fit:** behind the thread runtime; "swap the transport, not the API".
**Hard parts:** exactly-once into the transcript (dedupe by signal id on drain), ordering, interaction with `transient`.

### 6. Processor-emitted parts (from Module 3)

**Gap:** `processOutputStream` is one-chunk-in/one-chunk-out (plus `data-*` via `writer`), so buffering processors can't flush cleanly.
**Shape:** allow returning an array of parts, or a `writer.emit(part)` for text parts, with ordering guarantees.
**Fit:** a core processor API change, so it needs the "separate PR, generally useful" bar. Argue it with at least two independent processors that need it (redaction, batching, citation insertion).

## How to work

1. **Read** the relevant source and tests at the pinned commit, and at least one competitor's docs for prior art.
2. **Write the break-it test first.** It should fail on stock Mastra (like `verify:exercises-are-broken`).
3. **Implement outside core** if at all possible. Use the published package.
4. **Run it under both versions** (`1.75.0` and the alpha), and explain any difference.
5. **Write the RFC last**, from what you learned.

## Grading rubric

| Criterion | Excellent |
|---|---|
| Problem | a failing test reproduces the gap; the cost of the gap is concrete |
| Prior art | at least two systems compared, with their actual APIs and guarantees |
| Design | smallest surface that solves it; processor/provider/tool first; explains why not core |
| Failure modes | crash windows, concurrency, versioning, security each considered explicitly |
| House rules | each rule addressed; any violation justified |
| Tests | break-it fails before, passes after; deterministic; no API keys |
| Clarity | someone else could implement it from the RFC |
