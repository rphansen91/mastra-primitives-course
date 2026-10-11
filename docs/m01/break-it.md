# Break it: Module 1

Three starter files in [`labs/m01-first-principles/exercises/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m01-first-principles/exercises) each contain one deliberate bug. Run the tests against them:

```bash
LAB_TARGET=exercises node --import tsx --test m01-first-principles/break-it.test.ts
```

Three tests fail. Fix the files until all pass, then compare with [`solutions/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m01-first-principles/solutions).

## Exercise 1.1: the runaway loop

**File:** `exercises/ex1-loop-guard.ts`

A model calls `search({ q: 'same thing' })` forever. `maxSteps: 25` eventually stops it, after 25 identical tool calls, with `finishReason: 'max-steps'`, which tells an operator nothing.

**Task:** implement `stopOnRepeat(n)` so the loop stops with `'loop-detected'` after `n` identical consecutive calls (same tool name **and** same args). Different args must not count as a loop.

**Why it matters:** budgets protect your wallet; policies explain what happened. Mastra separates them the same way (`maxSteps` vs `stopWhen`), and Module 2 repeats this exercise on a real Mastra agent.

::: details Solution
```ts
export function stopOnRepeat(n = 3): StopCondition {
  return steps => {
    const calls = steps.flatMap(s => s.turn.toolCalls ?? []).map(c => `${c.name}:${JSON.stringify(c.args)}`);
    if (calls.length < n) return undefined;
    const tail = calls.slice(-n);
    return tail.every(c => c === tail[0]) ? 'loop-detected' : undefined;
  };
}
```
`JSON.stringify` is key-order sensitive. A production version would canonicalize args first.
:::

## Exercise 1.2: journal keys by position

**File:** `exercises/ex2-journal-keys.ts`

The workflow journals each effect under `step-${counter}`. The first attempt runs with `flag=false` (`getUser` is step-0) and crashes. Between crash and replay the flag flips (a config change, a `Date.now()` branch, a different LLM answer), so the replay runs `getOrders` first, also as step-0, and **gets the user back as its orders**.

**Task:** make the keys identify the effect, so a replay can never hand one effect another effect's result.

**Why it matters:** this is the "non-determinism" problem every replay engine fights. Temporal fails the workflow task with a non-determinism error; Restate and DBOS key by step name or ordinal and validate. Mastra keys workflow results by step id and its durable operation ids by `runId + execution path + phase`. Look at [`durable-operation-ids.test.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/packages/core/src/workflows/durable-operation-ids.test.ts).

::: details Solution
Key by the step's name (`getOrders`, `getUser`). For a step called in a loop, add the iteration (`getPage:3`). A stronger engine also records the *order* of keys and fails loudly when a replay asks for keys in a different order.
:::

## Exercise 1.3: a lease without fencing

**File:** `exercises/ex3-fencing.ts`

Worker A acquires the lease (token 1) and stalls past its TTL. Worker B acquires (token 2) and writes. A wakes up and writes its stale result. The starter store is last-writer-wins, so **A's stale write overwrites B's**.

**Task:** reject writes whose token is lower than the highest token seen for that key.

**Why it matters:** a lease alone is not mutual exclusion in a distributed system. The *storage layer* must check, because the stale worker doesn't know it's stale. That's why Mastra's run fencing is implemented inside the storage adapters ([`stores/pg/src/storage/db/run-fencing.ts`](https://github.com/mastra-ai/mastra/blob/ebe143c4916cf20b671a84f942d65d5df469f6cd/stores/pg/src/storage/db/run-fencing.ts)), not in the agent.

::: details Solution
```ts
write(key: string, value: string, token: number) {
  const hi = this.#highest.get(key) ?? 0;
  if (token < hi) throw new FenceConflict(`stale token ${token} < ${hi} for ${key}`);
  this.#highest.set(key, token);
  this.data.set(key, value);
}
```
In a SQL store this is one conditional `UPDATE … WHERE fence_token <= $token`, checked atomically with the write.
:::
