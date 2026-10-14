# Mastra Primitives: a source-level course

**Read the course:** https://rphansen91.github.io/mastra-primitives-course/

A course on the primitives inside the open-source [Mastra](https://github.com/mastra-ai/mastra) agent framework: the agent loop, processors, memory, workflows, signals and notifications, durability, and multi-agent coordination. You read real source at a pinned commit, run labs against the published package, break things on purpose, and compare each primitive with the alternatives (Temporal, LangGraph, Inngest, the Vercel AI SDK, Restate, DBOS…). The capstone is designing and implementing a new primitive.

Every primitive is taught in **four passes**:

1. **The problem it solves**
2. **How it's built** in real source (links to `mastra-ai/mastra` at commit `f88217d1`)
3. **Where it breaks** (a deliberate break-it exercise with tests)
4. **When to choose something else** (a decision table)

## Modules

| # | Module | Status |
|---|---|---|
| 0 | Setup and how to read the Mastra codebase | full |
| 1 | First principles: agent loop from scratch, journals/idempotency/fencing, events vs requests | full: lesson, lab, break-it, solutions, quiz |
| 2 | The agent loop | full |
| 3 | Processors | full |
| 4 | Memory | lesson + lab spec |
| 5 | Workflows | lesson + lab spec |
| 6 | Signals and notifications | lesson + built labs + break-it |
| 7 | Durability | lesson + built kill -9 crash lab + break-it |
| 8 | Multi-agent coordination | lesson + built relay lab + lab spec |
| 9 | Evals and observability | lesson + lab spec |
| 10 | Capstone: building primitives | RFC template, candidate primitives, rubric |

## Run the labs

Requires Node.js 22.13+ (the `@mastra/core` engines field). No API keys: every lab uses a ~100-line mock model.

```bash
cd labs
npm install
npm test                         # 48 tests, ~1.5 min (includes a real kill -9 crash lab)
npm run lab:anatomy              # print the agent loop's hook order
npm run test:exercises           # run break-it tests against YOUR exercise files
```

Labs pin `@mastra/core@1.77.0`, `@mastra/libsql@1.26.1` and `@mastra/observability@1.20.0` (latest stable on 2026-10-14). CI also runs them against `1.75.0` (the last release before run claims), and against a floating `@latest` (informational) to show behavior changes between releases.

## Repository layout

```
docs/      VitePress site (deployed to GitHub Pages by .github/workflows/pages.yml)
labs/      npm package with all labs, exercises/, solutions/, expected-output/
.github/   CI: labs (stable + next) and Pages deploy
```

Develop the site locally:

```bash
cd docs && npm install && npm run dev
```

## License and affiliation

Course text and code are [MIT licensed](LICENSE). This is an independent course built from the public `mastra-ai/mastra` repository and public documentation; it isn't an official Mastra project. Source line references are correct at the pinned commit.

## Freshness

Every module page records the Mastra commit it was verified against (frontmatter `verified: { core, sha, date }`, shown under each module's Production readiness panel). The weekly [`freshness`](.github/workflows/freshness.yml) workflow runs `node scripts/freshness.mjs`. It lists, for each module, the cited `mastra-ai/mastra` files that have newer commits on `main`, and writes the report to the job summary. Re-verify the flagged claims, then bump `verified.sha` and `verified.date`. Run it locally with `GH_TOKEN=$(gh auth token) node scripts/freshness.mjs`.
