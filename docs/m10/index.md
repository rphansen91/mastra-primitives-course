---
verified:
  core: 1.76.0
  sha: 81299c921d6f499d4c62f14c38e4d4d88b4fbfae
  date: '2026-10-11'
pageClass: lesson
aside: false
---

<script setup>
const outcomes = [
  'Find a real gap and prove it with a failing test',
  'Compare at least two systems\' prior art, with their actual APIs and guarantees',
  'Place a primitive on the smallest surface that respects the house rules',
  'Name its failure modes explicitly, then write the RFC',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const deliver = [
  { title: 'An RFC', body: '2 to 5 pages, from the [template](./rfc-template). The builder below writes the skeleton.', icon: 'book', color: 'violet' },
  { title: 'A lab folder', body: '`labs/m10-<name>/`: a demo script on the mock model, tests, expected output.', icon: 'flask', color: 'teal' },
  { title: 'A break-it test', body: 'Fails on stock Mastra, passes with your primitive. Like every exercise in this course.', icon: 'skull', color: 'coral' },
  { title: 'A decision row', body: 'Use when / not when / alternatives, for the [cheat sheet](/cheatsheet).', icon: 'cards', color: 'amber' },
]
const rules = [
  { name: '1 Processor first', short: 'over core API', detail: 'If it can be a processor (or a provider or tool), it must be. Core processor API changes land separately, must be generally useful, and need human review. From `packages/core/AGENTS.md` in the open-source repo.', color: 'violet' },
  { name: '2 Steps', short: 'durable = workflow step', detail: 'Everything durable or observable is a workflow step. That\'s how it gets snapshots (Module 5) and spans (Module 9).', color: 'teal' },
  { name: '3 One timeline', short: 'MessageList', detail: 'What the model sees goes through the `MessageList`; clients see chunks; storage keeps structure (Modules 2 to 4).', color: 'sky' },
  { name: '4 Threads', short: 'unit of concurrency', detail: 'One active run per (resource, thread). Design for what happens when two runs or two instances touch one thread (Module 2).', color: 'amber' },
  { name: '5 Fail well', short: 'open vs loud', detail: 'Fail open on coordination (a missed peer advert), fail loudly on correctness (a double resume throws).', color: 'coral' },
  { name: '6 Local first', short: 'swap transports', detail: 'In-memory → Unix socket → Redis. Swap the transport, not the API (Modules 6, 8).', color: 'lime' },
  { name: '7 Untrusted', short: 'text is data', detail: 'External and peer text is data, never instructions (Modules 3, 6, 8).', color: 'sky' },
  { name: '8 Small diffs', short: 'critical paths', detail: 'Keep changes to `loop.ts`, `agent.ts` and message-list code small and reviewable.', color: 'violet' },
]
const q_place = [
  { text: 'A change to the agent loop in core', why: 'House rules 1 and 8: the biggest, riskiest surface. Only if nothing smaller works.' },
  { text: 'A tool wrapper plus a storage domain', correct: true, why: 'The gap lives inside tool execution, so wrap `execute` and keep the journal behind the storage interface. No core diff needed to prove it.' },
  { text: 'An output processor', why: 'Processors see messages and chunks. By the time a tool result is a message, the side effect already happened twice.' },
]
const q_fence = [
  { text: 'Nothing: the journal makes it exactly-once', why: 'Only if writes are fenced. Otherwise both instances run the side effect, and both write.' },
  { text: 'Both instances may run the side effect; the journal needs a fence so only the current claim generation can write', correct: true, why: 'Module 7: restart has no owner, so two replicas can both be "the" runner. A journal without fencing records a race instead of preventing it.' },
  { text: 'The second instance crashes with a clear error', why: 'Only if you build that check, and that check is the fence.' },
]
const work = [
  'Read the source and tests at the pinned commit',
  'Write a break-it test that fails on stock Mastra',
  'Study prior art in two other systems',
  'Implement the smallest surface, outside core',
  'Write the RFC from what you learned',
]
const choose = [
  { when: 'The gap shows up in a test you can write today', not: 'You can only describe it, not reproduce it', alt: 'Go back to the module\'s lab and break it first' },
  { when: 'It fits a processor, tool wrapper, provider or engine seam', not: 'It needs a new hook in `loop.ts`', alt: 'Argue the hook separately, with two independent users' },
  { when: 'Prior art agrees on the guarantee', not: 'Every system does it differently', alt: 'Write up the trade-off space first; that\'s a valuable RFC by itself' },
  { when: 'You can test it with the mock model and no keys', not: 'It only shows up with a real provider', alt: 'Record a tape (Module 9) and replay it in CI' },
]
const recall = [
  { q: 'House rule 1?', a: 'Processor over core API. If it can be a processor, provider or tool, it must be.' },
  { q: 'What comes first: the RFC or the test?', a: 'The break-it test. Write the RFC last, from what you learned building it.' },
  { q: 'What does a journal need besides storage?', a: 'A fence: only the current claim generation may write. Plus cleanup and a story for non-serializable results.' },
  { q: 'Why do signals that arrive early matter for waitForSignal?', a: 'A signal can arrive before the step starts waiting. Without buffering it\'s lost and the wait times out.' },
  { q: 'Two things every failure-mode section covers?', a: 'Any two of: crash windows, concurrency, versioning, security, cleanup. Excellent RFCs cover all five.' },
  { q: 'How much prior art?', a: 'At least two systems, with their actual APIs and guarantees, and what you borrow or reject.' },
]
const cheat = [
  { title: 'Deliver', color: 'violet', lines: ['RFC (2 to 5 pages)', 'labs/m10-<name>/ + tests', 'break-it test, decision row'] },
  { title: 'Order', color: 'teal', lines: ['read → break → prior art', '→ build small → RFC last'] },
  { title: 'Place it', color: 'sky', lines: ['processor · tool wrapper · step', 'storage domain · engine seam', 'core: last resort'] },
  { title: 'House rules', color: 'amber', lines: ['processor first · steps · one timeline', 'threads · fail well · local first', 'untrusted · small diffs'] },
  { title: 'Failure modes', color: 'coral', lines: ['crash windows · concurrency', 'versioning · security · cleanup'] },
  { title: 'Candidates', color: 'lime', lines: ['journal · idempotency keys', 'durable timers · waitForSignal', 'signal outbox · emitted parts'] },
]
</script>

# Module 10: Design a primitive

<p class="lead">You've taken Mastra apart. Now design the piece you wish existed, the way a core contributor would: prove the gap with a failing test, borrow from prior art, find the smallest surface, name what can go wrong, and write it up.</p>

<LessonHero module="10" :minutes="120" lab="Your own primitive, your own lab" :outcomes="outcomes" mood="cheer">

**You've watched the loop spin,** streamed secrets through processors, signalled running agents, suspended refunds until Thursday, and killed processes mid-charge.

Every module ended with a "Break it" list. Each item on those lists is an invitation.

</LessonHero>

<Journey :station="1" module="10" />

## The problem: find a real gap {#problem}

What you deliver:

<IdeaCards :cols="4" :cards="deliver" />

Every gap below came out of a "Break it" section in this course, with a test or a lab that proves it. Explore them, and see what other systems do:

<GapExplorer />

<Callout type="analogy" title="An architect's extension, not a new house">

A good primitive is an extension to a house people already live in. You study the foundations (the source), you check the building code (the house rules), you look at how the neighbors did theirs (prior art), and you build the smallest room that solves the problem, preferably without moving a load-bearing wall (core).

</Callout>

<StationDone module="10" :station="1" />

<Journey :station="2" module="10" />

## Under the hood: how core contributors think {#under-the-hood}

<DesignPath />

<OrderSteps module="10" id="work" prompt="Put the way of working in order." :items="work" explain="Test first, RFC last. The RFC is a write-up of something that already works, not a plan for something that might." />

### The house rules

Your design has to respect these, or justify every exception. Tap each one:

<ClickMap title="The eight house rules" :stations="rules" start-label="design" end-label="review" />

<Quiz module="10" id="place" question="You're designing **journaled tool results** (`ctx.journal.run('open-pr', fn)`). Where should it live first?" :options="q_place" />

### How a primitive actually gets accepted

From [`CONTRIBUTING.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/CONTRIBUTING.md) and the public PR automation:

- **Issue first.** A PR must link the issue it addresses (`Fixes #1234`). PRs without one are closed (L31).
- **Approval before code.** For a feature, open a feature request and wait for maintainers. A PR opened while the issue is still labeled `status: needs triage` or `status: needs approval` is closed automatically (L39–40).
- **Fail before pass.** An automated "changed test gate" runs the PR's changed tests against the base branch and expects them to **fail** there (visible on public PRs, e.g. [#24772](https://github.com/mastra-ai/mastra/pull/24772)). That's exactly this course's break-it discipline.
- **Respect the phase design.** #24772 was closed because it moved a hook across phases (Module 3).

Open, public RFC seeds that match this course's gaps:

- [#25780](https://github.com/mastra-ai/mastra/issues/25780): make interrupted-tool recovery depend on an explicit replay-safety declaration (Module 7's idempotency gap).
- [#25360](https://github.com/mastra-ai/mastra/pull/25360) (open PR): prevent duplicate evented step execution after redelivery.
- Durable signal-provider subscriptions: the docs say the registry is in-memory and per-process (Module 6).
- A signal outbox: `persist` resolves `accepted` before the write (Module 6).

<StationDone module="10" :station="2" />

<Journey :station="3" module="10" />

## Break it: how designs fail {#break-it}

Most RFCs don't fail on the happy path. They fail in a reviewer's first question: "what if the process dies here?"

<Quiz kind="predict" module="10" id="fence" question="Your journal stores each side effect's result by `runId:toolCallId:name`. Two replicas both restart the same in-flight run after a crash (Module 7). What happens?" :options="q_fence" />

<Misconception myth="If I persist it, it's durable.">

Persisting is half of it. The other half is **who is allowed to write, and when**. Without a fence (a claim generation, a CAS, a lease) two writers produce a well-recorded race. Every candidate below has a "hard parts" list, and fencing or ordering is on nearly all of them.

</Misconception>

<Misconception myth="The best primitive is the most general one.">

Reviewers merge **small** things that solve a **proven** problem. A general "durable everything" layer touches every critical path (house rule 8) and can't be tested in one lab. Start with the narrowest version that makes your break-it test pass; generalize in the next RFC.

</Misconception>

<DeepDive title="The six candidates, in full">

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

</DeepDive>

<StationDone module="10" :station="3" />

<Journey :station="4" module="10" />

## Choose wisely: build your RFC {#choose-wisely}

<Choose subject="a primitive to build" :rows="choose" />

Pick a primitive, place it, and check it against the house rules and failure modes. The builder writes the skeleton for you (nothing leaves your browser):

<RfcBuilder />

<Reflect question="Which gap from this course would you fix first, and what's the smallest thing you'd ship to prove it works?">

There's no single right answer. A strong answer names the **failing test** (e.g. "Module 7's crash lab: the charge runs twice"), the **smallest surface** (e.g. "a tool wrapper that passes `ctx.idempotencyKey` to Stripe"), and one **failure mode** the first version knowingly doesn't handle (e.g. "sub-agent delegations get one key for the whole delegation").

</Reflect>

### Grading rubric

| Criterion | Excellent |
|---|---|
| Problem | a failing test reproduces the gap; the cost of the gap is concrete |
| Prior art | at least two systems compared, with their actual APIs and guarantees |
| Design | smallest surface that solves it; processor/provider/tool first; explains why not core |
| Failure modes | crash windows, concurrency, versioning, security each considered explicitly |
| House rules | each rule addressed; any violation justified |
| Tests | break-it fails before, passes after; deterministic; no API keys |
| Clarity | someone else could implement it from the RFC |


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="10" />

<StationDone module="10" :station="4" next="./rfc-template" next-label="Open the RFC template" />

## Wrap-up

<Podcast title="Designing a primitive, in four minutes" :minutes="4">

**Host:** Where do I even start?

**Loopy:** With a "Break it" list. Every module has one, and every item is a gap you've already seen fail. Pick one you can reproduce in a test.

**Host:** Test before design?

**Loopy:** Always. The break-it test fails on stock Mastra; your primitive makes it pass. The RFC comes last, written from what you learned.

**Host:** How do I know where it belongs?

**Loopy:** House rule one: if it can be a processor, a provider or a tool, it must be. Core changes are the last resort, and they need two independent users to justify them.

**Host:** What do reviewers ask first?

**Loopy:** What if the process dies here? What if two replicas do this at once? What happens to runs started on the old code? Who can write this state? When is it cleaned up?

**Host:** And prior art?

**Loopy:** At least two systems, with their real APIs. Restate's ctx.run, Temporal's history, Inngest's waitForEvent, DBOS steps. Borrow what fits; say why you reject the rest.

</Podcast>

<Recall module="10" :cards="recall" />

<CheatCard module="10" title="Design a primitive" subtitle="Test first, smallest surface, RFC last" :cells="cheat" />

<Callout type="win" title="You finished the course">

- **[The RFC template](./rfc-template)** to start from.
- **[The cheat sheet](/cheatsheet)** for every decision table in one place.
- Fork [the course repo](https://github.com/rphansen91/mastra-primitives-course), add `labs/m10-<name>/`, and make CI green.

</Callout>
