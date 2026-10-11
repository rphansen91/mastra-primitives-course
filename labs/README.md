# Labs

Runnable labs for the [Mastra Primitives course](https://rphansen91.github.io/mastra-primitives-course/). They depend on the published `@mastra/core@1.75.0` and `@mastra/libsql@1.25.1` and use a mock model ([`shared/mock-model.ts`](shared/mock-model.ts)), so no API keys are needed.

```bash
npm install
npm test                          # everything, against solutions/ (31 tests, ~45 s)
npm run test:exercises            # break-it tests against exercises/ (fail until you fix them)
npm run verify:exercises-are-broken
npm run expected                  # regenerate expected-output/
```

| Folder | Module | Contents |
|---|---|---|
| `m01-first-principles/` | 1 | loop from scratch, journal/idempotency/fencing, 3 exercises |
| `m02-agent-loop/` | 2 | loop anatomy, thread reservation, 2 exercises |
| `m03-processors/` | 3 | composition, tripwires, 3 exercises |
| `m06-signals/` | 6 | mid-run signal / wake / persist, notifications + SignalProvider, 1 exercise |
| `m07-durability/` | 7 | kill -9 crash lab (child processes, libSQL file), 1 exercise |
| `m08-multi-agent/` | 8 | coordinator → worker relay |

Each lab script prints what it observed; `expected-output/` has the reference output (ids/pids/timestamps normalized).
