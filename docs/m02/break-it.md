---
pageClass: lesson
aside: false
---

<script setup>
const cmdBreak = "LAB_TARGET=exercises node --import tsx --test m02-agent-loop/break-it.test.ts"
</script>

# Break it: Module 2

<LabHeader module="02" folder="m02-agent-loop" runs="a few seconds" :tests="2" mood="alarmed">

Starters in [`labs/m02-agent-loop/exercises/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m02-agent-loop/exercises):

Each test **fails on the starter**. Fix the file until it passes, then open the solution and compare. (CI runs these same tests against `solutions/`, and checks that every starter still fails.)

</LabHeader>

<TryIt :cmd="cmdBreak" />

## Exercise 2.1: the runaway agent

**File:** `exercises/ex1-stop-on-repeat.ts`

A real Mastra `Agent` whose model calls `search({ q: 'same' })` every step. With `maxSteps: 30` the test sees 30 tool executions; it wants 3.

<Callout type="tip" title="Your mission">

Implement `stopOnRepeat(n)`, a Mastra `stopWhen` condition. Mastra calls it with `{ steps }`; inspect a step's `toolCalls` to find the tool name and args (they're inside `payload` on Mastra chunks).

</Callout>

<Callout type="note" title="What you learn">

`stopWhen` runs inside `decideContinuation` after each iteration, with the same step history the AI SDK uses, so stop conditions are portable between the two.

</Callout>

<Reveal title="Show the solution">

```ts
export function stopOnRepeat(n = 3) {
  return ({ steps }: { steps: any[] }) => {
    const calls = steps.flatMap(s => s.toolCalls ?? []).map((c: any) => {
      const p = c.payload ?? c;
      return `${p.toolName}:${JSON.stringify(p.args ?? p.input)}`;
    });
    if (calls.length < n) return false;
    const tail = calls.slice(-n);
    return tail.every(c => c === tail[0]);
  };
}
```

</Reveal>

## Exercise 2.2: parallel tool calls lose an update

**File:** `exercises/ex2-parallel-tools.ts`

The model reserves two seats **in one step** (two tool calls). The tool does read → `await` → write. Mastra runs a step's tool calls concurrently (default limit 10), so both read `10` and both write `9`. The test expects `8`.

<Callout type="tip" title="Your mission">

Fix it without changing the model script. There are two valid fixes; find both.

</Callout>

<Callout type="note" title="What you learn">

the loop guarantees **deterministic folding** of results (Module 1), not **isolation** of effects. Concurrency is a tool-author concern unless you opt out at the agent level.

</Callout>

<Reveal title="Show the solution">

- **Agent level:** `toolCallConcurrency: 1` in the call (or agent default) options serializes tool calls for every step. Verified on 1.75.0 and 1.76.0.
- **Tool level (preferred):** make the effect atomic: a mutex, a DB transaction, or an atomic decrement (`UPDATE seats SET left = left - 1`). The tool is then safe no matter who calls it: another agent, a workflow step, a retry.

The solution file does both, with a promise-chain mutex keyed by the db object. Also note the `strategy: 'called'` option, which serializes only steps that actually call approval/suspend tools.

</Reveal>
