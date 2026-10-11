---
pageClass: lesson
aside: false
---

<script setup>
const cmdBreak = "LAB_TARGET=exercises node --import tsx --test m03-processors/break-it.test.ts"
</script>

# Break it: Module 3

<LabHeader module="03" folder="m03-processors" runs="a few seconds" :tests="6" mood="alarmed">

Five tests fail on the starters in [`exercises/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/m03-processors/exercises).

Each test **fails on the starter**. Fix the file until it passes, then open the solution and compare. (CI runs these same tests against `solutions/`, and checks that every starter still fails.)

</LabHeader>

<TryIt :cmd="cmdBreak" />


## Exercise 3.1: the redactor that leaks across chunks

**File:** `exercises/ex1-stream-redactor.ts`

The redactor runs `text.replace(/sk-[a-z0-9]+/g, '[REDACTED]')` on each `text-delta`. The tests stream secrets split three ways:

| Deltas | Per-chunk result |
|---|---|
| `"your key is sk-ab"`, `"c123 ok"` | `your key is [REDACTED]c123 ok`: the tail leaks |
| `"s"`, `"k-abc123 then more"` | nothing matches: the whole secret leaks |
| `"ends with sk-ab"`, `"c9"` | `c9` leaks at the end of the stream |

<Callout type="tip" title="Your mission">

Make it correct across boundaries. Keep a buffer in `state`, emit only text that can no longer be part of a secret, flush the rest when the text block ends.

</Callout>

<Reveal title="Show the solution">

```ts
const MAYBE_SECRET_SUFFIX = /(?:^|[^a-z0-9-])(s|sk|sk-[a-z0-9]*)$/;
export function split(buf: string) {
  const m = buf.match(MAYBE_SECRET_SUFFIX);
  const cut = m ? buf.length - m[1]!.length : buf.length;
  return { emit: buf.slice(0, cut).replace(SECRET, '[REDACTED]'), hold: buf.slice(cut) };
}
// processOutputStream: buffer + split on text-delta; on text-end, emit the redacted tail
// as a text-delta IN PLACE OF text-end (one chunk in, one chunk out).
```
**The limitation you just found:** the processor contract can't emit an extra chunk, so the final text block loses its `text-end` when a tail is flushed. The text is correct; the chunk sequence isn't. A "processor can emit additional parts" capability, or a built-in buffering helper, is a good capstone RFC.

</Reveal>

## Exercise 3.2: state that outlives the run

**File:** `exercises/ex2-per-run-state.ts`

A "max 3 model steps per run" budget counts in a module-level `let steps = 0`. Run 1 uses 3 steps. Run 2 trips on its **first** step: `step budget of 3 exceeded`. In a server this is a cross-user bug.

<Callout type="tip" title="Your mission">

Keep the count per run.

</Callout>

<Reveal title="Show the solution">

```ts
processInputStep: async ({ messageList, abort, state }) => {
  state.steps = ((state.steps as number) ?? 0) + 1;
  if ((state.steps as number) > max) abort(`step budget of ${max} exceeded`);
  return messageList;
}
```
`state` is scoped to this processor for this run and persists across steps (the lab verified `[[0,1],[1,2],[2,3],[3,4]]` for steps 0 to 3). Framework internals use `runScope` for the same reason (`AGENTS.md`).

</Reveal>

## Exercise 3.3: fail open vs fail closed

**File:** `exercises/ex3-fail-open.ts`

An enrichment processor adds CRM context. The CRM is down and throws, and `agent.generate` rejects with `[Agent:enrich] - Input processor error`. The user gets nothing.

<Callout type="tip" title="Your mission">

On error, push a message to `errors` and pass the messages through unchanged. The positive-path test (CRM up) must still see `CRM: tier=vip` in the prompt.

</Callout>

<Reveal title="Show the solution">

Wrap the dependency call in `try/catch`; on failure record and `return messages`. Then decide **per processor**: guardrails fail closed (`abort`), enrichers fail open. Make the choice explicit in the processor's name or options so reviewers can see it. Mastra's house rule "fail open on coordination, fail loudly on correctness" is the same idea at framework level.

</Reveal>
