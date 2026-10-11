# Running the labs

All labs live in [`labs/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs), a single npm package that depends on the **published** `@mastra/core` (pinned to `1.76.0`) and `@mastra/libsql` (`1.26.0`). Nothing calls a real model.

```bash
cd labs
npm install
npm test
```

`npm test` runs every lab test and every break-it test against the **solutions** (31 tests, about 45 seconds, most of it the crash lab).

## The mock model

[`labs/shared/mock-model.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/shared/mock-model.ts) is a dependency-free implementation of the AI SDK `LanguageModelV2` interface (`specificationVersion: 'v2'`, `doGenerate`, `doStream`). Mastra accepts any object with that shape, which is the first lesson: **to the agent loop, a model is just an async function from a prompt to a stream of parts.**

```ts
import { scriptedModel } from '../shared/mock-model.ts';

// a fixed script (last step repeats)…
const { model, prompts } = scriptedModel([
  { toolCalls: [{ name: 'check_ci', args: { pr: 42 } }] },
  { text: 'PR 42 failed on a Docker Hub 429.' },
]);

// …or a function of the prompt, which keeps working across process restarts
const { model: m2 } = scriptedModel((call, prompt) =>
  JSON.stringify(prompt).includes('rate limited') ? { text: 'staggering' } : { text: 'ok' },
);
```

A step can emit `text`, `textChunks` (several deltas, for stream-processor labs), `reasoning`, `toolCalls`, a `delayMs` to simulate a slow model, or an `error`. `prompts` records exactly what the loop sent, which is how the labs assert things like "the signal joined the very next request".

## Lab scripts

| Command | Module | What it shows |
|---|---|---|
| `npm run lab:loop-from-scratch` | 1 | A 190-line agent loop with hooks and a signal queue |
| `npm run lab:anatomy` | 2 | Exact hook and chunk order of a Mastra run |
| `npm run lab:thread-reservation` | 2 | One active run per thread |
| `npm run lab:processors` | 3 | Processor composition and tripwires |
| `npm run lab:signals` | 6 | Mid-run delivery, idle wake, persist |
| `npm run lab:notifications` | 6 | SignalProvider → priority → deliver/summarize, dispatcher |
| `npm run lab:crash` | 7 | kill -9 mid-tool, recovery, and the two-replica double run |
| `npm run lab:relay` | 8 | Coordinator discovers a peer and relays into its running loop |

Expected output for each is checked in under [`labs/expected-output/`](https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/expected-output). Regenerate with `npm run expected` (ids, pids and timestamps are normalized).

## The break-it workflow

Each full module has `exercises/` (starter code with a deliberate bug) and `solutions/`:

```bash
# run the break-it tests against YOUR exercise files (they fail until fixed)
LAB_TARGET=exercises node --import tsx --test m03-processors/break-it.test.ts

# or every exercise at once
npm run test:exercises
```

Edit the file in `exercises/`, re-run, and stop when it's green. Then read the matching file in `solutions/`: solutions explain *why*, and several of them document a limitation that becomes a capstone candidate.

CI runs `npm run verify:exercises-are-broken`, which asserts that every starter file still fails its tests. If a Mastra release silently fixes one of the bugs for you, CI tells us and the exercise gets updated.

## Testing against a newer Mastra

```bash
npm i --no-save @mastra/core@1.75.0 @mastra/libsql@1.25.1   # previous stable
npm test
```

The crash-lab test adapts its expectations to the installed version (Module 7 explains the difference). CI runs this "next" job too, as an informational check.

## Reading the Mastra source and tests

Module 0 covers cloning `mastra-ai/mastra` and running its own test suites. The course links always point at commit `81299c94`, so line numbers match what you see.
