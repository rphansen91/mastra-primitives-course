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

Most agent-framework tutorials teach you an API. This course teaches the **primitives underneath**: the 15 things that happen inside `agent.stream()`, where processors hook in, how a signal reaches a model mid-run, what "durable" does and doesn't mean (as of 1.76), and how agents coordinate.

You read the real [mastra-ai/mastra](https://github.com/mastra-ai/mastra) source at a pinned commit, run small labs against the published package, and break things on purpose. Each primitive is compared with the alternatives: Temporal, LangGraph, Inngest, the Vercel AI SDK, Restate, DBOS and others.

The premise is the one the *Principles of Building AI Agents* foreword states: <Cite id="p-foreword" />

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
| 4 | [Memory](/m04/) | Lesson + built lab + break-it |
| 5 | [Workflows](/m05/) | Lesson + built two-process lab + break-it |
| 6 | [Signals and notifications](/m06/) | Lesson + **built labs** + break-it |
| 7 | [Durability](/m07/) | Lesson + **built kill -9 crash lab** + break-it |
| 8 | [Multi-agent coordination](/m08/) | Lesson + built relay and subagent-context labs + break-it |
| 9 | [Evals and observability](/m09/) | Lesson + built lab + break-it |
| 10 | [Capstone: building primitives](/m10/) | RFC template + candidate primitives + grading rubric |

Every module ends with **where it falls down**, a comparison with at least one other framework, pointers to real source **and tests**, a decision table that feeds the cumulative [cheat sheet](/cheatsheet), and **further reading** from Mastra's free books and its founders' essays (all collected on the [reading list](/reading)).

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

::: info Independent course, not affiliated with or endorsed by Mastra
This course is built from the public repository, public docs, Mastra's free books and its founders' public writing. Quotes are short, verbatim and attributed, with links to the source; none of them implies endorsement. Line references were correct at the pinned commit; on newer commits, search for the symbol name.
:::
