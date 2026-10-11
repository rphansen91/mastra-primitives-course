---
pageClass: lesson
aside: false
---

<script setup>
const cmdLab = 'npm run lab:workflows\nnode --import tsx --test m05-workflows/lab.test.ts'
const outEx = 'not ok 1 - [exercises] ex5.1: the manager is asked exactly once\n    manager emailed 2x'
const q_proc = [
  { text: 'The resumer: it re-runs fetch, approve, apply and notify', why: 'Completed steps aren\'t re-run. `fetch`\'s result is read from the snapshot.' },
  { text: 'The starter did fetch + the email; the resumer did apply + notify', correct: true, why: 'The new process only knows the run id and the libSQL file. Everything else (step results, position, suspended path) comes from the snapshot.' },
  { text: 'It fails: the starter process holds the run in memory', why: 'The starter exited. That\'s the point: nothing in memory is needed.' },
]
const q_snap = [
  { text: 'Once, when the run finishes', why: 'Then a crash would lose everything.' },
  { text: 'Once per iteration, as the iteration starts, plus start and finish', correct: true, why: 'Six snapshots for three iterations: pending, three "iteration #N starting", the last iteration\'s success, and the run\'s success.' },
  { text: 'Once per model token', why: 'Far too many writes. Snapshots are per step.' },
]
</script>

# Lab 5: Suspend, crash, resume

<LabHeader module="05" folder="m05-workflows" runs="~5 s, two processes" :tests="3" mood="happy">

Tuesday's refund, for real: a four-step workflow on a libSQL **file**, a suspend, and a resume from a **separate Node process**. Then the agent loop rebuilt as `dowhile`, with a spy on every snapshot. Mock model, no API keys.

</LabHeader>

<TryIt :cmd="cmdLab" />

## 5.1 Suspend → snapshot → resume elsewhere

[`suspend-resume.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m05-workflows/suspend-resume.ts) starts `fetch → approve → apply → notify`. `approve` emails the manager and calls `suspend()`. The script then reads the snapshot straight from storage with `loadWorkflowSnapshot`:

```text
=== 1) Start: fetch → approve suspends ====================================
status: suspended

=== 2) The snapshot on disk while suspended ===============================
{
  status: 'suspended',
  suspendedPaths: { approve: [ 1 ] },
  stepResults: [ 'fetch', 'approve' ],
  suspendPayload: { ask: 'Refund $49?' }
}
```

`suspendedPaths: { approve: [1] }` says where in the graph to come back to: step index 1.

<Quiz kind="predict" module="05" id="lab-proc" question="A child process ([`phase-resume.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m05-workflows/phase-resume.ts)) opens the same file and calls `resume({ step: 'approve', resumeData: { approved: true } })`. Who does what?" :options="q_proc" />

```text
=== 3) A NEW process resumes with { approved: true } ======================
result: { status: 'success', result: { message: 'Refunded $49' } }
starter : [ 'fetch', 'EMAIL manager: Approve refund of $49 for order-1042?' ]
resumer : [ 'apply refund $49', 'notify customer: Refunded $49' ]
```

## 5.2 Two callers, one suspension

The script suspends a second run and fires two `resume()` calls in the same tick:

```text
=== 4) Two callers resume the same run at once ============================
  won → success
  lost → This suspended workflow run was already resumed by another caller.
         Workflow "refund" run "<uuid>" moved from "suspended" to "running"
         before this resume could claim it. Only one resume() call may continue
         a given suspension; re-read the run state before resuming again.
```

That error comes from [`#claimResume`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts#L4882): a compare-and-set on the run status in storage. It works across processes because the store does the check.

## 5.3 The agent loop as a workflow

[`loop-as-workflow.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m05-workflows/loop-as-workflow.ts) builds Module 1's weather loop as `createWorkflow().dowhile(iteration, predicate)` and wraps the storage to log every snapshot write.

<Quiz kind="predict" module="05" id="lab-snap" question="Three iterations (two tool calls, one answer). How often is a snapshot written?" :options="q_snap" />

```text
=== Snapshots written to storage while it ran =============================
  #1 run pending: no steps yet
  #2 run running: iteration #1 starting, input carries 1 messages
  #3 run running: iteration #2 starting, input carries 3 messages
  #4 run running: iteration #3 starting, input carries 5 messages
  #5 run running: iteration success, output carries 6 messages
  #6 run success: iteration success, output carries 6 messages

=== Same loop with the predicate capped at 2 iterations ===================
  iterations: 2 | last message: {"city":"Oslo","tempC":9}
```

The capped run is `maxSteps` in miniature: the predicate is the only thing that ends a `dowhile`.

<MascotSays mood="alarmed">

While writing this lab, `await buildRefundWorkflow()` hung forever. A `Workflow` has a `.then()` method (the builder), so JavaScript treats it as a promise and waits for it to "resolve". That's why the helper returns `{ workflow }`.

</MascotSays>

## Break it: Exercise 5.1, the double email {#break-it-exercise-5-1-the-double-email}

**File:** [`exercises/ex1-approve-step.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m05-workflows/exercises/ex1-approve-step.ts)

```ts
execute: async ({ inputData, resumeData, suspend }) => {
  notifyManager(`Approve refund of $${inputData.amount} for ${inputData.orderId}?`);
  if (!resumeData) return suspend({ ask: `Refund $${inputData.amount}?` });
  return { ...inputData, approved: resumeData.approved };
},
```

The test runs the refund, then resumes with `{ approved: false }`. It expects the manager to be emailed **once** and nothing to be refunded.

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m05-workflows/break-it.test.ts" :output="outEx" />

**Task:** make it pass by changing only the step.

<Reveal title="Show the solution and why">

```ts
execute: async ({ inputData, resumeData, suspend }) => {
  if (resumeData) return { ...inputData, approved: resumeData.approved };
  // First execution only: ask once, then park the run.
  notifyManager(`Approve refund of $${inputData.amount} for ${inputData.orderId}?`);
  return suspend({ ask: `Refund $${inputData.amount}?` });
},
```

- **Why:** on resume, `execute` runs **from the top** with `resumeData` set. Handle the resume branch first, and put side effects only on the first-execution path.
- **Still not exactly-once:** if the process dies between `notifyManager` and the snapshot write, the restart sends it again. For "exactly once" email, give the send an idempotency key (`runId + step`) that the provider dedupes on.
- The decline path is the `apply` step's job: it checks `approved` and skips the payment.

</Reveal>

## More tasks

1. **Crash in the middle.** Add `process.exit(1)` to `apply` after the payment log line, then restart with `restartAllActiveWorkflowRuns()`. How many payments? (Module 7 has the full crash lab.)
2. **Resume with bad data.** Call `resume` with `{ approved: 'yes' }`. What does the `resumeSchema` do?
3. **Parallel approvals.** Require two managers with `.parallel([approveA, approveB])`. What do `suspendedPaths` look like after one approves?
4. **Thin snapshots.** Add `shouldPersistSnapshot` to skip writes while `running`. Re-run 5.3: which snapshots disappear, and what would a crash lose?
