---
layout: home
hero:
  name: Mastra Primitives
  text: Understand the core. Then build the next primitive.
  tagline: A source-level course on the agent loop, processors, memory, workflows, signals, durability and multi-agent coordination in the open-source Mastra framework, with runnable labs that need no API keys.
  actions:
    - theme: brand
      text: Start with the method
      link: /guide/method
    - theme: alt
      text: Module 0, setup
      link: /m00/
    - theme: alt
      text: Cheat sheet
      link: /cheatsheet
features:
  - title: Four passes per primitive
    details: "The problem it solves, how it is built in real source (pinned links), where it breaks (a break-it exercise), and when to choose something else (a decision table)."
  - title: Runnable, keyless labs
    details: "Every lab uses a 100-line mock model and the published @mastra/core package. npm test runs them all, including a real kill -9 crash lab. CI runs them on every push."
  - title: Built for framework designers
    details: "The capstone is an RFC plus an implementation of a new primitive: journaled tool results, idempotency keys, durable timers, waitForSignal, durable signal queues."
---

## What this course is

Most agent-framework tutorials teach you an API. This course teaches the **primitives underneath**: what an agent loop really is, why it is built as a workflow, where processors hook in, how a signal reaches a model mid-run, what "durable" does and does not mean, and how agents coordinate. You read the real [mastra-ai/mastra](https://github.com/mastra-ai/mastra) source at a pinned commit, run small labs against the published package, break things on purpose, and compare each primitive with the alternatives (Temporal, LangGraph, Inngest, the Vercel AI SDK, Restate, DBOS and others).

The goal: by the end you can **explain each primitive from first principles, predict how it fails, and design a new one** that fits Mastra's house rules.

## Who it is for

- Engineers building production agents on Mastra who want to stop guessing.
- Contributors who want to work on Mastra's core (the loop, processors, signals, durability).
- Anyone designing an agent framework and looking for a worked, source-level case study.

## Prerequisites

- Comfortable TypeScript and async JavaScript (Promises, async iterators, streams).
- Node.js **22.13 or newer** (`@mastra/core` declares `engines.node >=22.13.0`; the labs also use the built-in test runner and `import.meta.dirname`).
- Basic familiarity with LLM tool calling (what a tool call and a tool result are).
- Optional: a local clone of `mastra-ai/mastra` for reading source and running its tests (Module 0).

No API keys, no accounts, no network calls in the labs.

## How the course is organized

| # | Module | Depth |
|---|---|---|
| 0 | [Setup and how to read the Mastra codebase](/m00/) | Full |
| 1 | [First principles: a loop from scratch, durability, events vs requests](/m01/) | Full: lesson, lab, break-it, solutions, quiz |
| 2 | [The agent loop](/m02/) | Full |
| 3 | [Processors as the extension point](/m03/) | Full |
| 4 | [Memory](/m04/) | Lesson + lab spec |
| 5 | [Workflows](/m05/) | Lesson + lab spec |
| 6 | [Signals and notifications](/m06/) | Lesson + **built labs** + break-it |
| 7 | [Durability](/m07/) | Lesson + **built kill -9 crash lab** + break-it |
| 8 | [Multi-agent coordination](/m08/) | Lesson + built relay lab |
| 9 | [Evals and observability](/m09/) | Lesson + lab spec |
| 10 | [Capstone: building primitives](/m10/) | RFC template + candidate primitives + grading rubric |

Every module ends with **where it falls down**, a comparison with at least one other framework, pointers to real source **and tests**, and a decision table that also feeds the cumulative [cheat sheet](/cheatsheet).

## Running the labs in 60 seconds

```bash
git clone https://github.com/rphansen91/mastra-primitives-course
cd mastra-primitives-course/labs
npm install
npm test                 # all labs + break-it solutions (~45 s, includes the crash lab)
npm run lab:anatomy      # print the agent loop's hook order
npm run lab:crash        # kill -9 a durable agent mid-tool and watch recovery
```

See [Running the labs](/guide/labs) for the exercise workflow.

## Versions this course was verified against

- Source links: `mastra-ai/mastra` at commit [`81299c94`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae) (the `@mastra/core@1.76.0` release tag, published 2026-10-11).
- Labs: published **`@mastra/core@1.76.0`** + `@mastra/libsql@1.26.0` (pinned, so the source links and the package match). CI also runs every lab on the previous stable, `1.75.0`, and on a floating `@latest`, so you can see behavior change between versions. Modules 6, 7 and 9 show real differences.

::: info Not an official Mastra project
This is an independent course built from the public repository and public docs. Line references were correct at the pinned commit; on newer commits, search for the symbol name.
:::
