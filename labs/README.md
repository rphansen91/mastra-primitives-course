# Labs

Runnable labs for the [Mastra Primitives course](https://rphansen91.github.io/mastra-primitives-course/). They depend on the published `@mastra/core@1.75.0`, `@mastra/libsql@1.25.1` and `@mastra/observability@1.19.0` and use a mock model ([`shared/mock-model.ts`](shared/mock-model.ts)), so no API keys are needed.

```bash
npm install
npm test                          # everything, against solutions/ (46 tests, ~2.5 min)
npm run test:exercises            # break-it tests against exercises/ (fail until you fix them)
npm run verify:exercises-are-broken
npm run expected                  # regenerate expected-output/
```

| Folder | Module | Contents |
|---|---|---|
| `m01-first-principles/` | 1 | loop from scratch, journal/idempotency/fencing, 3 exercises |
| `m02-agent-loop/` | 2 | loop anatomy, thread reservation, 2 exercises |
| `m03-processors/` | 3 | composition, tripwires, 3 exercises |
| `m04-memory/` | 4 | history window, tool pairs, woken run with/without memory, working memory, 1 exercise |
| `m05-workflows/` | 5 | suspend → cross-process resume, double-resume race, loop-as-workflow, 1 exercise |
| `m06-signals/` | 6 | mid-run signal / wake / persist, notifications + SignalProvider, 1 exercise |
| `m07-durability/` | 7 | kill -9 crash lab (child processes, libSQL file), 1 exercise |
| `m08-multi-agent/` | 8 | coordinator → worker relay, the ping-pong, 1 exercise |
| `m09-evals/` | 9 | trace tree, rule + LLM-judge scorers, isTaskComplete loop, record/replay, 1 exercise |

Each lab script prints what it observed; `expected-output/` has the reference output (ids/pids/timestamps normalized).
