---
verified:
  core: 1.76.0
  sha: 7aec8b0d95b7b8865741f0e15228490e089b3608
  date: '2026-10-13'
pageClass: lesson
aside: false
---

<script setup>
const W = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts'
const B = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae'
const T = 'https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae'
const outcomes = [
  'Read a workflow as a step graph with typed inputs and outputs',
  'Say exactly what a snapshot holds, when it is written, and what it does not buy you',
  'Use suspend/resume safely, including across processes and racing callers',
  'See the agent loop as "just another workflow": <code>dowhile(iteration, predicate)</code>',
  'Choose between a Mastra workflow, an agent loop and a durable-execution engine',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const needs = [
  { title: 'Pause for days', body: 'Wait for a human, a webhook, a deadline. Without holding a process hostage.', icon: 'pause', color: 'violet' },
  { title: 'See every step', body: 'Which step ran, with what input, how long, and what it returned.', icon: 'eye', color: 'sky' },
  { title: 'Retry one step', body: 'The email provider hiccuped. Don\'t re-charge the card to retry the email.', icon: 'reset', color: 'amber' },
  { title: 'Survive a restart', body: 'Deploys happen. The run should pick up where it was.', icon: 'skull', color: 'coral' },
]
const q_shape = [
  { text: '"Answer the user\'s question, using tools as needed"', why: 'The model decides the next action. That\'s an agent loop (Module 2).' },
  { text: '"Validate the refund, wait for a manager, pay, email the customer"', correct: true, why: 'A known shape with a human pause in the middle: a workflow with suspend/resume.' },
  { text: '"Tell the coding agent CI is rate limited, mid-run"', why: 'An outside event reaching a running agent: a signal (Module 6).' },
]
const parts = [
  { name: 'createStep', short: 'typed unit of work', detail: '`inputSchema`, `outputSchema`, optional `suspendSchema` / `resumeSchema`, `retries`, and `execute({ inputData, resumeData, suspend, state, requestContext, … })`. Agents and tools can be steps directly (`createStepFromAgent`, `createStepFromTool`).', href: W, color: 'sky' },
  { name: 'createWorkflow', short: 'the builder', detail: '`.then` [L2063](' + W + '#L2063), `.parallel` [L2546](' + W + '#L2546), `.branch`, `.foreach`, `.dowhile` [L2670](' + W + '#L2670), `.map` [L2375](' + W + '#L2375), `.sleep` [L2264](' + W + '#L2264), `.commit()` [L2852](' + W + '#L2852) freezes the graph.', href: W + '#L2063', color: 'violet' },
  { name: 'createRun / start', short: 'one execution', detail: '`workflow.createRun()` [L2883](' + W + '#L2883) then `run.start()` [L4212](' + W + '#L4212). A run has an id; the snapshot is stored under `(workflowName, runId)`.', href: W + '#L4212', color: 'teal' },
  { name: 'snapshot', short: 'after every step', detail: 'The default engine\'s `persistStepUpdate` writes step results, execution path, suspended paths, the serialized graph, retry counts and requestContext to `workflow_snapshots`. `shouldPersistSnapshot` can thin writes ([entry.ts L195](' + B + '/packages/core/src/workflows/handlers/entry.ts#L195)).', href: B + '/packages/core/src/workflows/default.ts', color: 'amber' },
  { name: 'suspend / resume', short: 'pause for a human', detail: '`suspend(payload)` marks the path suspended. `run.resume({ step, resumeData })` [L4781](' + W + '#L4781) continues, even in another process. The resume is **CAS-claimed** (`#claimResume` [L4882](' + W + '#L4882)). Tool approval in agents uses the same mechanism.', href: W + '#L4781', color: 'coral' },
  { name: 'engines', short: 'default · evented · Inngest · Temporal', detail: 'Same definition, different runtime. Seams: `wrapDurableOperation` ([default.ts L173](' + B + '/packages/core/src/workflows/default.ts#L173), a no-op by default) and `executeSleepDuration` ([L140](' + B + '/packages/core/src/workflows/default.ts#L140), `setTimeout` by default).', href: T + '/packages/core/src/workflows/evented', color: 'lime' },
]
const q_resume = [
  { text: 'Only the code after `suspend()`', why: 'There\'s no "after" to jump to. JavaScript can\'t resume a function in the middle.' },
  { text: 'The whole `execute`, from the top, with `resumeData` set', correct: true, why: 'Verified in Lab 5: `approve:start resume=undefined`, then `approve:start resume={"approved":true}`. Anything before your `resumeData` check runs twice.' },
  { text: 'The whole workflow, from `fetch`', why: 'Completed steps come from the snapshot. Only the suspended step re-executes.' },
]
const out1 = "=== 2) The snapshot on disk while suspended ===============================\n{\n  status: 'suspended',\n  suspendedPaths: { approve: [ 1 ] },\n  stepResults: [ 'fetch', 'approve' ],\n  suspendPayload: { ask: 'Refund $49?' }\n}\n\n=== 3) A NEW process resumes with { approved: true } ======================\nresult: { status: 'success', result: { message: 'Refunded $49' } }\nstarter : [ 'fetch', 'EMAIL manager: Approve refund of $49 for order-1042?' ]\nresumer : [ 'apply refund $49', 'notify customer: Refunded $49' ]\n\n=== 4) Two callers resume the same run at once ============================\n  won → success\n  lost → This suspended workflow run was already resumed by another caller. ..."
const out2 = "=== The agent loop as createWorkflow().dowhile(iteration, predicate) ======\n  iteration 0: model → tool weather(Lisbon)\n  iteration 1: model → tool weather(Oslo)\n  iteration 2: model → \"Lisbon (24°C) is warmer than Oslo (9°C).\"\n  status: success | iterations: 3 | messages: 6\n\n=== Snapshots written to storage while it ran =============================\n  #1 run pending: no steps yet\n  #2 run running: iteration #1 starting, input carries 1 messages\n  #3 run running: iteration #2 starting, input carries 3 messages\n  #4 run running: iteration #3 starting, input carries 5 messages\n  #5 run running: iteration success, output carries 6 messages\n  #6 run success: iteration success, output carries 6 messages"
const breaks = [
  { title: 'The in-flight step re-runs', body: 'Snapshots are written **between** steps. A step that charged a card and then died charges again. Make steps idempotent.', icon: 'reset', color: 'coral' },
  { title: 'No owner on restart', body: '`restartAllActiveWorkflowRuns()` has no claim. A second replica runs the in-flight step **concurrently** (Module 7\'s crash lab shows two pids).', icon: 'cards', color: 'amber' },
  { title: 'Timers are setTimeout', body: 'On the default engine, a restart during a 1-hour `sleep` restarts the sleep (or the step). The evented engine stores waiting steps.', icon: 'clock', color: 'sky' },
  { title: '`waitForEvent` is gone', body: 'It throws `WORKFLOW_WAIT_FOR_EVENT_REMOVED`. Correlated, timeout-bounded events need suspend/resume plus your own timer.', icon: 'mail', color: 'violet' },
  { title: 'Retries are simple', body: 'Fixed delay, in memory. No exponential backoff, jitter, schedule-to-close timeouts or heartbeats.', icon: 'bolt', color: 'lime' },
  { title: 'No versioning', body: 'A restart replays against whatever code is deployed **now**, even if the step graph changed under a running workflow.', icon: 'alert', color: 'teal' },
]
const q_race = [
  { text: 'Both resumes run; the refund is paid twice', why: 'That\'s exactly what the claim prevents.' },
  { text: 'One wins; the other throws "already resumed by another caller"', correct: true, why: 'The resume flips `suspended → running` with a compare-and-set. The loser gets a clear error. Re-read the run state before trying again.' },
  { text: 'The second waits and then resumes again after the first finishes', why: 'There\'s nothing left to resume: the run isn\'t suspended any more.' },
]
const choose = [
  { when: 'The shape of the work is known: steps, branches, fan-out', not: 'The model should decide the next action', alt: 'The agent loop (Module 2)' },
  { when: 'You need human-in-the-loop pauses (suspend/resume)', not: 'You need durable timers and events at scale on the default engine', alt: 'The evented engine; Inngest / Temporal runners; Temporal or Restate directly' },
  { when: 'You want per-step observability and time travel', not: 'Steps aren\'t idempotent and several replicas auto-restart runs', alt: 'One instance with `recovery.workflows: \'off\'`, or an engine with ownership (Temporal)' },
  { when: 'The same definition should run in-process now, on Inngest or Temporal later', not: 'Long-running workflows must survive code deploys mid-run', alt: 'Temporal (`patched()` / versioning), Restate, DBOS' },
]
const recall = [
  { q: 'When does the default engine write a snapshot?', a: 'After every step (and when a run starts, suspends and finishes), to `workflow_snapshots` under `(workflowName, runId)`.' },
  { q: 'What runs again when a suspended step resumes?', a: 'Its whole `execute`, from the top, with `resumeData` set. Guard pre-suspend side effects with `if (resumeData)`.' },
  { q: 'Two callers resume the same run at once?', a: 'One wins (CAS `suspended → running`); the other throws "already resumed by another caller".' },
  { q: 'What does the agent loop look like as a workflow?', a: '`createWorkflow().dowhile(iterationStep, predicate)`. Each iteration\'s input is in the snapshot.' },
  { q: 'Why can\'t you `await` a workflow?', a: 'It has a `.then()` method (the builder), so JavaScript treats it as a promise and waits forever. Return `{ workflow }` from async helpers.' },
  { q: 'Biggest difference from Temporal?', a: 'Mastra snapshots step **results** and resumes from the graph position. Temporal records an event history and replays workflow **code** deterministically, with durable timers and versioning.' },
]
const cheat = [
  { title: 'Build', color: 'violet', lines: ['createStep({ inputSchema, outputSchema, execute })', '.then .parallel .branch .foreach .dowhile .map .sleep', '.commit() freezes the graph'] },
  { title: 'Run', color: 'teal', lines: ['createRun() → start({ inputData })', 'status: running | suspended | success | failed', 'snapshot after every step'] },
  { title: 'Suspend / resume', color: 'coral', lines: ['return suspend(payload)', 'resume({ step, resumeData }), any process', 'execute re-runs from the top', 'CAS-claimed: one winner'] },
  { title: 'Engines', color: 'sky', lines: ['default (in process)', 'evented (PubSub + workers)', 'Inngest, Temporal (experimental)'] },
  { title: 'Gotchas', color: 'amber', lines: ['In-flight step re-runs after a crash', 'No owner on restart', 'sleep = setTimeout', 'Never await a workflow object'] },
  { title: 'Choose', color: 'lime', lines: ['Known shape → workflow', 'Model decides → agent loop', 'Durable timers / versioning → Temporal, Restate, DBOS'] },
]
</script>

# Module 5: Workflows

<p class="lead">A $49 refund waits three days for a manager. A workflow is a known shape written down as data, which is what lets Mastra pause that run, resume it on a different machine, and show you every step. It turns out Mastra's agent loop is one too.</p>

<LessonHero module="05" :minutes="40" lab="Suspend/resume lab, ~5 s, two processes" :outcomes="outcomes" mood="thinking">

**Tuesday, 4:40 pm.** A customer asks for a $49 refund.

Policy says a manager must approve anything over $25. The manager is boarding a plane and will look at it Thursday.

Your code is a nice chain of `await`s, and your servers will be redeployed at least twice before Thursday. When the manager finally taps **Approve**, which process remembers what it was doing?

</LessonHero>

<Journey :station="1" module="05" />

## The problem {#problem}

Some work has a known shape: fetch → validate → wait for a human → pay → notify. Nested `await`s are fine, right up until you need any of these:

<IdeaCards :cols="4" :cards="needs" />

Then you need the shape **as data**: a graph of steps with typed inputs and outputs, and run state written somewhere that outlives the process.

<Callout type="analogy" title="Sheet music vs jazz">

An agent loop is a jazz solo: the model decides what comes next. A workflow is sheet music: the bars are written down before anyone plays.

You can stop the orchestra mid-symphony, hand the score to a different orchestra, and they'll pick up at bar 47. That's a snapshot.

</Callout>

<Quiz module="05" id="shape" question="Which job is shaped like a workflow?" :options="q_shape" />

<StationDone module="05" :station="1" />

<Journey :station="2" module="05" />

## Under the hood {#under-the-hood}

### The step graph

```ts
const refund = createWorkflow({ id: 'refund', inputSchema, outputSchema })
  .then(fetchOrder)
  .then(approve)   // calls suspend() until a manager answers
  .then(apply)
  .then(notify)
  .commit();
```

Each builder method appends a node to a serializable graph:

<BuilderShapes />

<ClickMap title="The parts of a workflow" :stations="parts" start-label="define" end-label="run anywhere" />

Two rules from the *Principles* book hold for Mastra at 1.76.

**`.branch()` is not if/else.** Every condition that's true runs its step: <Cite id="p-no-else" /> If nothing matches, nothing runs, so write the fallback yourself. (Verified: the default engine evaluates every condition and runs all the truthy ones, [`control-flow.ts` L396](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/handlers/control-flow.ts#L396).)

**One model call per step.** Snapshots, spans and retries work at step granularity, so <Cite id="p-one-call" />

### Suspend, resume, snapshot

A step that waits for a manager is the workflow version of tool approval. The product case for it, from Mastra's tool-approval launch post:

<FounderQuote id="f-teammates" />

`suspend()` is how a workflow asks. The snapshot is what lets it wait until Thursday without holding a process open.

This is Tuesday's refund. Run it, let it suspend, then try every ending. Turn on the bug, turn on the crash:

<WorkflowTimeline />

<Quiz kind="predict" module="05" id="resume" question="A step called `suspend()` on Tuesday. On Thursday you call `run.resume({ step: 'approve', resumeData: { approved: true } })`. Which code runs?" :options="q_resume" />

<WorkflowStates />

<TryIt cmd="npm run lab:workflows" :output="out1">

Starts the refund on a libSQL **file**, suspends, then spawns a **brand-new process** that resumes it. The log shows which pid did what. Then two callers race to resume one run.

</TryIt>

### The agent loop is a workflow

Module 2 showed that Mastra's loop is `dowhile(iteration, predicate)`. In the lab you build Module 1's loop the same way, in about 40 lines, and spy on the snapshots:

<TryIt cmd="tsx m05-workflows/loop-as-workflow.ts" :output="out2">

Each iteration's **input** (the transcript so far) is in the snapshot. Compare with [`loop-builder.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts#L263).

</TryIt>

<MascotSays mood="alarmed">

A trap found while building the lab: a workflow has a `.then()` method (it's the builder), so `return workflow` from an `async` function makes JavaScript treat it as a promise. Your `await` then waits forever. Return `{ workflow }` instead.

</MascotSays>

<DeepDive title="Engines, scheduled workflows and time travel">

- **Default engine** ([`default.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/default.ts)): in process. `persistStepUpdate` writes the snapshot after every step.
- **Evented engine** ([`workflows/evented/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/evented)): steps as PubSub events processed by workers; needs a store with atomic concurrent updates.
- **Inngest / Temporal** ([`workflows/inngest`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/workflows/inngest), [`workflows/temporal`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/workflows/temporal)): the same definition on another platform, through `wrapDurableOperation` and `executeSleepDuration`.
- **`waitForEvent`** ([L2360](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts#L2360)) is removed: it throws `WORKFLOW_WAIT_FOR_EVENT_REMOVED`. Use suspend/resume.
- **Restart** ([L4860](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts#L4860)) and **time travel** ([L5648](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts#L5648)) operate on the same run state. So do scheduled workflows; the notification dispatcher in Module 6 is one. `timeTravel()` rejects a *running* snapshot, but it does **not** atomically claim the run: two concurrent callers can both pass the status check, so guard duplicates in your app ([docs note](https://github.com/mastra-ai/mastra/blob/7aec8b0d95b7b8865741f0e15228490e089b3608/docs/src/content/en/docs/workflows/time-travel.mdx), [#26560](https://github.com/mastra-ai/mastra/pull/26560)).
- The workflow is Mastra's universal "unit of observable, resumable work": the agent loop, prepare-stream and processors are all workflow steps, which is why they all get spans (Module 9).

</DeepDive>

### Shutdown, leases and the Temporal runner

- `mastra.shutdown({ drainTimeout })` gives in-flight evented runs (including durable agents) up to `drainTimeout` ms, **default 5000**, to settle before workers and PubSub are torn down. Runs past the deadline are abandoned with a warning ([`mastra/index.ts` L7679](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/mastra/index.ts#L7679)). Before [#23168](https://github.com/mastra-ai/mastra/pull/23168), shutdown could tear down PubSub under a run mid-step. Wire `shutdown()` to SIGTERM.
- Background tasks use the same idea as Module 7's run claims: a persisted, expiring **execution lease** that fences stale owners ([#24841](https://github.com/mastra-ai/mastra/pull/24841)). Once you've seen claims + fencing, you'll find the pattern in several places.
- The Temporal runner is still marked *"experimental and not ready for production use"* in the docs ([`workflow-runners.mdx` L22](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/deployment/workflow-runners.mdx#L22)), and `@mastra/temporal` is pre-1.0 (0.4.14 on npm). Go by what the package and docs say, not by marketing copy.

<Callout type="note" title="The book vs Mastra 1.76: timers and retries">

<BookRef book="principles" chapter="ch. 9, &quot;Workflows&quot;" page="49–50" /> lists `.sleep()` and `.sleepUntil()` next to the other operators, and describes loops, retries and timeouts as special cases of those operators.

At 1.76, two details differ. On the default engine, `sleep` is an in-process timer, so a restart during a long sleep doesn't resume at the original deadline.

The evented engine persists waiting steps. Retries are also a separate setting, not an operator: per-step `retries` and workflow-level `retryConfig: { attempts, delay }`, with no backoff.

</Callout>

<StationDone module="05" :station="2" />

<Journey :station="3" module="05" />

## Break it {#break-it}

Verified in Module 7's crash lab or read from source at the pinned commit:

<IdeaCards :cards="breaks" />

<Misconception myth="When a step resumes, execution continues right after the suspend() call.">

It can't: JavaScript has no way to re-enter a function in the middle. The step's `execute` runs **again from the top**, this time with `resumeData`. Anything before your `if (resumeData)` check (an email, a charge, a log line you count on) happens twice.

</Misconception>

<Misconception myth="A snapshot after every step means every step runs exactly once.">

Completed steps run once. The step that was **running** when the process died has no "done" record, so it runs again on restart. Snapshots give you exactly-once for finished steps and at-least-once for the in-flight one, which is Module 1's journal rule, again.

</Misconception>

### Your mission: the manager who got two emails

<Callout type="tip" title="Exercise 5.1">

The `approve` step emails the manager, then suspends. On Thursday the manager declines, and gets the same "please approve" email again, a second after clicking.

Fix the step so the manager is asked **exactly once** and a declined refund is never applied. File: `exercises/ex1-approve-step.ts`.

</Callout>

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m05-workflows/break-it.test.ts">

Fails with `manager emailed 2x` until you fix it. Solution on the [lab page](./lab#break-it-exercise-5-1-the-double-email).

</TryIt>

<Quiz kind="predict" module="05" id="race" question="Two managers tap **Approve** on the same suspended run within a millisecond. What happens?" :options="q_race" />

<StationDone module="05" :station="3" />

<Journey :station="4" module="05" />

## Choose wisely {#choose-wisely}

<Choose subject="a Mastra workflow" :rows="choose" />

<Callout type="analogy" title="Temporal: the court stenographer">

Temporal keeps a stenographer in the room: an **event history** of every activity result, timer and signal. On recovery it replays your workflow **code** against that history, so your code must be deterministic, and in-flight code changes need versioning (`patched()`).

Mastra keeps a **photo of the whiteboard** after each step: the step results and where you are in the graph. No determinism rules for your code, so it's simpler to adopt, but coarser: the step is the unit of exactly-once, and ownership and versioning are on you. `@mastra/temporal` (experimental) compiles Mastra workflows into Temporal workflows and activities when you want the stenographer.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="05" />

<StationDone module="05" :station="4" next="./lab" next-label="On to the lab" />

## Further reading {#further-reading}

<FurtherReading module="05" />

## Wrap-up

<Podcast title="Workflows, in four minutes" :minutes="4">

**Host:** What is a Mastra workflow?

**Loopy:** A graph of typed steps, built with then, parallel, branch, foreach and dowhile, and frozen with commit. Because it's data, Mastra can snapshot it, draw it, and run it on different engines.

**Host:** What's in a snapshot?

**Loopy:** The run's status, every finished step's result, where you are in the graph, any suspended paths, and the request context. The default engine writes one after every step.

**Host:** So how does the refund wait until Thursday?

**Loopy:** The approve step calls suspend. The snapshot says suspended, and the process can go away. On Thursday any process can call resume with the manager's answer. Completed steps aren't repeated; their results come from the snapshot.

**Host:** What's the trap?

**Loopy:** On resume, the suspended step's execute runs again from the top. If you sent an email before checking resumeData, you send it twice. And if two people resume at once, only one wins: the other gets an "already resumed" error.

**Host:** And crashes?

**Loopy:** The step that was running when the process died runs again. Make steps idempotent. Also, restart has no owner, so two replicas can both re-run it.

**Host:** When would I reach for Temporal instead?

**Loopy:** When you need durable timers, rich retries, ownership and versioning for long-running code. Mastra is simpler to adopt; Temporal gives stronger guarantees.

</Podcast>

<Recall module="05" :cards="recall" />

<CheatCard module="05" title="Workflows" subtitle="Known shapes, snapshots, suspend and resume" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 5: suspend, crash, resume](./lab):** two processes, one run, and the double-email exercise.
- **[Module 6: Signals](/m06/):** how news reaches a run that's already going.
- **[Module 7: Durability](/m07/):** the crash lab, where in-flight steps really do run twice.

</Callout>
