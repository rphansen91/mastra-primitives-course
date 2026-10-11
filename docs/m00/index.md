# Module 0: Setup and how to read the Mastra codebase

**Goal:** get the labs running, get a local clone of Mastra you can grep and test, and learn a reading strategy for a large TypeScript monorepo so the rest of the course goes fast.

## 0.1 Run the course labs

```bash
node -v            # must be >= 22.13 (@mastra/core engines)
git clone https://github.com/rphansen91/mastra-primitives-course
cd mastra-primitives-course/labs
npm install
npm test           # 31 tests, ~45 s
```

If `npm test` is green you have everything you need for Modules 1 to 3 and the built labs in 6 to 8. Details: [Running the labs](/guide/labs).

## 0.2 Clone Mastra at the course's pinned commit

All source links in this course point to commit [`81299c94`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae). Check out the same commit so line numbers match:

```bash
git clone https://github.com/mastra-ai/mastra
cd mastra
git checkout 81299c921d6f499d4c62f14c38e4d4d88b4fbfae
```

### Building and testing Mastra itself (optional, heavy)

The monorepo needs Node `^22.19` and pnpm via corepack. These steps worked on a 15 GB Linux machine:

```bash
corepack enable                       # pnpm 11
pnpm install --frozen-lockfile
NODE_OPTIONS=--max-old-space-size=6144 pnpm turbo build --filter ./packages/core --concurrency=2
cd packages/core
pnpm exec vitest run src/loop/shared/steps/signal-drain-core.test.ts src/agent/signals.test.ts src/notifications
```

Gotchas you will hit:
- **Low memory:** keep turbo `--concurrency` low; the full build is large.
- **Vitest 4:** `--poolOptions` is gone; use `--maxWorkers=2`.
- **`NO_COLOR` and `FORCE_COLOR` both set:** Node prints a warning to child-process stderr, and subprocess tests that assert "stderr is empty" fail. Run those with `env -u NO_COLOR`.
- **Workspace deps:** packages that import other workspace packages need those built first (`pnpm turbo build --filter "<pkg>^..."`).

## 0.3 A map of the territory

| Area | Where | Size at pinned SHA |
|---|---|---|
| Core framework (`@mastra/core`) | [`packages/core/src`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src) | |
| Agent class | [`agent/agent.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/agent.ts) | ~11,000 lines |
| Thread run registry, signal routing, leases | [`agent/thread-stream-runtime.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/thread-stream-runtime.ts) | ~5,900 lines |
| Signal data model | [`agent/signals.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/signals.ts) | 702 lines |
| The loop | [`loop/loop.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop.ts), [`loop/loop-builder.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts), [`loop/workflows/agentic-execution/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/workflows/agentic-execution), [`loop/shared/steps/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/shared/steps) | |
| Prepare-stream workflow | [`agent/workflows/prepare-stream/index.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/workflows/prepare-stream/index.ts#L230) | |
| Processors | [`processors/index.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts#L625), [`processors/runner.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/runner.ts#L329), built-ins in [`processors/processors/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/processors) | |
| Memory | [`memory/memory.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/memory/memory.ts#L121), [`packages/memory`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/memory) | |
| Workflows | [`workflows/workflow.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts), [`workflows/default.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/default.ts), [`workflows/evented/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/evented) | |
| Signal providers | [`signals/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/signals) | |
| Notifications | [`notifications/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/notifications) | |
| Durable agents | [`agent/durable/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/durable) (start with [`leases.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/durable/leases.md) and [`run-recovery.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/durable/run-recovery.md)) | |
| Events / PubSub | [`events/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/events) | |
| Agent controller (harness) | [`agent-controller/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent-controller) | |
| Evals / scorers | [`evals/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals), [`observability/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/observability) | |
| mastracode (coding agent) | [`mastracode/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/mastracode) | |
| Harness docs | [`docs/src/content/en/docs/harness/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness) | |

## 0.4 The house rules, in the repo's own words

Read [`packages/core/AGENTS.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/AGENTS.md) before anything else. Two lines shape the whole course:

> Before adding a feature, check whether it can be a processor. Processors are self-contained and need no changes to core internals…

> Non-serializable per-run state (MessageList, processor states, converted tools) belongs in `runScope`, never on step input/output schemas.

Also read [`.mastracode/resources/CRITICAL_PATHS.md`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/.mastracode/resources/CRITICAL_PATHS.md) and [`.github/CODEOWNERS`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/.github/CODEOWNERS): they tell you which files (the loop, `agent.ts`, message-list code) are fragile and owned, and so where a new primitive should **not** start.

## 0.5 A reading strategy for an 11,000-line file

1. **Start from a test, not from the top of the file.** Find the behavior in a `*.test.ts`, then jump to the code it exercises. Tests name the invariants.
2. **Follow one request end to end.** For the loop: `Agent.stream()` → `#execute` → prepare-stream workflow → `loop()` → `AgenticLoopBuilder.build()`. Write the call chain down.
3. **Grep for the noun, not the verb.** `rg -n "pendingSignalsByThread"` finds every place a queue is touched; that's the real state machine.
4. **Find where state lives.** In memory (a `Map` on a runtime)? In storage (a domain like `notifications` or `workflow_snapshots`)? On PubSub? Durability questions are answered here.
5. **Read the `.md` files that live next to code.** `agent/durable/leases.md` and `run-recovery.md` are design docs written by the people who maintain the code.
6. **Use the labs as a debugger.** Every lab records the prompts the model received. When a doc and the code disagree, run it.

## 0.6 Check your setup

- [ ] `npm test` in `labs/` is green.
- [ ] You can open [`loop-builder.ts#L206`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts#L206) and find `signalDrainStep`.
- [ ] You can explain in one sentence what `runScope` is for.
- [ ] (Optional) You ran one Mastra test file locally.

Next: [Module 1, first principles](/m01/).
