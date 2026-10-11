---
pageClass: lesson
aside: false
---

<script setup>
const cmd1 = "npm run lab:crash            # both scenarios\nnpm run lab:crash -- A       # just the crash + recovery\nnode --import tsx --test m07-durability/crash-lab.test.ts"
const cmd2 = "LAB_TARGET=exercises npm run lab:crash -- A\n# deploy API ledger (effects actually applied): [ 'applied (no key)', 'applied (no key)' ]\nLAB_TARGET=exercises node --import tsx --test m07-durability/crash-lab.test.ts   # fails: deploy applied 2x"
const q_crash = [{"text": "charge_card 1, slow_deploy 1", "why": "The in-flight tool has no completion record, so it re-runs."}, {"text": "charge_card 1, slow_deploy 2", "correct": true, "why": "Completed before the checkpoint → not repeated. In flight → re-run. The idempotency key makes the second deploy a no-op at the API."}, {"text": "charge_card 2, slow_deploy 2", "why": "The checkpoint sits at the tool-call step boundary, after charge_card completed. It isn't repeated."}]
</script>

# Lab 7: The kill -9 crash lab

<LabHeader module="07" folder="m07-durability" runs="~25 s" :tests="2" mood="alarmed">

A real `kill -9`. Storage is a libSQL **file**, so a fresh process sees exactly what a killed one left behind. Runs in ~25 s on 1.75.0, ~75 s on the 1.76 alpha (it waits out the claim TTL).

</LabHeader>


<TryIt :cmd="cmd1" />

## The setup

[`common.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m07-durability/common.ts) builds, in one `Mastra`:

- a **durable agent** (`createDurableAgent`, `recovery.durableAgents: 'auto'`) whose mock model chooses the next action **from the tool results in its prompt** (not a call counter), so a fresh process continues correctly: `charge_card` → `slow_deploy` (4 s) → final text;
- a **plain workflow** `send-email → slow-step (4 s) → final`;
- a fake **deploy API** with a durable ledger that dedupes on an idempotency key;
- a side-effect log tagged with the **pid** of the process that did it.

[`crash-lab.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m07-durability/crash-lab.ts) drives child processes:

- **Scenario A:** start both runs, wait until `slow_deploy` and `slow-step` are both in flight, `SIGKILL` the process, start a fresh one that does what the deployer does on boot (`restartAllActiveWorkflowRuns()` + `recoverAllDurableAgents()`).
- **Scenario B:** start both runs, and while they're in flight boot a **second replica** that runs the same boot recovery. Then count side effects per pid.

<Quiz kind="predict" module="07" id="lab-crash" question="Scenario A: `charge_card` finished, then the process is killed while `slow_deploy` is running. After recovery, how many times did each tool start?" :options="q_crash" />

## Expected output (`@mastra/core@1.75.0`, solutions)

```text
=== A) kill -9 mid-flight, then a fresh process recovers ==================
persisted runs after crash: [
  'crash-wf/wf-run-1=running',
  'durable-agentic-execution/agent-run-1=running',
  'durable-agentic-loop/agent-run-1=running'
]
active durable runs: [ 'agent-run-1' ]
recoverAllDurableAgents t+4s {"t":4,"agents":1,"recovered":1,"succeeded":1,"failed":0}
side-effect counts: {
  'WF step send-email executed': 1,          ← memoized by the snapshot
  'WF step slow-step started': 2,            ← in-flight step re-ran
  'LLM call (tool results so far: none)': 1, ← not repeated
  'TOOL charge_card executed': 1,            ← not repeated (completed before the checkpoint)
  'LLM call (tool results so far: charge_card)': 1,
  'TOOL slow_deploy started': 2,             ← in-flight tool re-ran
  'DEPLOY API applied': 1,
  'DEPLOY API deduped': 1,                   ← the idempotency key saved us
  'WF step final executed': 1,
  'LLM call (tool results so far: charge_card,slow_deploy)': 1,
  ...
}
deploy API ledger (effects actually applied): [ 'applied agent-run-1:c2' ]

=== B) second replica boots while the first is alive ======================
distinct pids per effect: {
  'WF step slow-step started': 2,            ← plain workflow ran in BOTH processes
  'WF step final executed': 2,
  'TOOL slow_deploy started': 2,             ← 1.75.0: the replica re-drove the live durable run
  'DEPLOY API applied': 1, 'DEPLOY API deduped': 1,
  'second replica recoverAllDurableAgents recovered=1': 1,
  ...
}
```

Full output: [`expected-output/m07-crash-lab.txt`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/expected-output/m07-crash-lab.txt).

### On `1.76.0-alpha.9` (CI "next" job)

```text
recoverAllDurableAgents t+0s  {"recovered":0,"skipped":1}   ← dead owner's claim still valid
recoverAllDurableAgents t+5s  {"recovered":0,"skipped":1}
...
recoverAllDurableAgents t+30s {"recovered":0,"skipped":1}
recoverAllDurableAgents t+35s {"recovered":0,"skipped":0}   ← claim expired; auto re-check recovers
```

and in scenario B, `TOOL slow_deploy started` comes from **one** pid: the claim held by the live owner keeps the replica out. The plain workflow still double-runs.

## Break it: Exercise 7.1, the double deploy

**File:** [`exercises/ex1-idempotency-key.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m07-durability/exercises/ex1-idempotency-key.ts)

The starter's `deployKey()` returns `undefined`, so the deploy API can't tell a recovery retry from a new deploy:

<TryIt :cmd="cmd2" />

<Callout type="tip" title="Your mission">

Return a key that's identical when the *same* tool call is re-executed after a crash and different for a genuinely new call. Inspect the tool's execution context: what's there on a durable agent?

</Callout>

<Reveal title="Show the solution">

```ts
export function deployKey(_input: unknown, ctx: any) {
  const toolCallId = ctx?.agent?.toolCallId ?? ctx?.toolCallId;
  const runId = ctx?.runId ?? ctx?.requestContext?.get?.('runId');
  if (!runId || !toolCallId) return undefined;
  return `${runId}:${toolCallId}`;
}
```
- `toolCallId` is stable across recovery because the checkpoint sits at the tool-call step boundary: recovery replays the persisted LLM response, it doesn't re-ask the model.
- `runId` is stable because the recovered run keeps its id. On 1.75.0 the durable tool context lacks `runId`, so `phase-run.ts` puts it in the `RequestContext`, which the snapshot persists.
- Not stable: `Date.now()`, a UUID, a process counter. Too coarse: the input alone.

Note scenario B too: with the key, the replica's duplicate deploy is also deduped. Idempotency keys protect you from *every* source of duplicates, not just crashes.

</Reveal>

## More tasks

1. **Kill earlier.** Kill during `charge_card` instead (make it slow). Which LLM calls repeat now? Where exactly is the checkpoint?
2. **Recovery off.** Set `recovery: { durableAgents: 'off' }` and rerun A. What does `listActiveRuns()` return, and why? (Hint: "running" checkpoints are skipped when nothing consumes them.)
3. **Graceful shutdown.** Replace `SIGKILL` with `SIGTERM` + `mastra.shutdown()` in the child. On 1.76 alpha, does recovery still wait out the TTL? (Read "Shutdown" in `leases.md`.)
4. **Workflow fix.** Make the plain workflow safe under scenario B without changing Mastra: give `slow-step` an idempotency key from `runId` + step id and a ledger. Then try `recovery.workflows: 'off'` and compare.
5. **Sub-agent.** Make `slow_deploy` delegate to a sub-agent with two tool calls, crash in the middle, and count what repeats.
