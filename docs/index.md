---
layout: page
title: Mastra Primitives
titleTemplate: A source-level course on the Mastra agent framework
description: A source-level course on the agent loop, processors, memory, workflows, signals, durability and multi-agent coordination in the open-source Mastra framework, with runnable labs that need no API keys.
sidebar: false
aside: false
footer: false
---

<main class="home" id="main">

<CourseHome />

<div class="vp-doc home-prose">

## What this course is

Most agent-framework tutorials teach you an API. This course teaches the **primitives underneath**: the 15 things that happen inside `agent.stream()`, where processors hook in, how a signal reaches a model mid-run, what "durable" does and doesn't mean (as of 1.77), and how agents coordinate.

You read the real [mastra-ai/mastra](https://github.com/mastra-ai/mastra) source at a pinned commit, run small labs against the published package, and break things on purpose. Each primitive is compared with the alternatives: Temporal, LangGraph, Inngest, the Vercel AI SDK, Restate, DBOS and others.

The premise is the one the *Principles of Building AI Agents* foreword states: <Cite id="p-foreword" />

The goal: by the end you can **explain each primitive from first principles, predict how it fails, and design a new one** that fits Mastra's house rules.

Every module ends with **where it falls down**, a comparison with at least one other framework, pointers to real source **and tests**, a decision table that feeds the cumulative [cheat sheet](/cheatsheet), and **further reading** from Mastra's free books and its founders' essays (all collected on the [reading list](/reading)).

<div class="home-cols">
<div>

## Who it is for

- Engineers building production agents on Mastra who want to stop guessing.
- Contributors who want to work on Mastra's core (the loop, processors, signals, durability).
- Anyone designing an agent framework and looking for a worked, source-level case study.

</div>
<div>

## Prerequisites

- Comfortable TypeScript and async JavaScript (Promises, async iterators, streams).
- Node.js **22.13 or newer** (`@mastra/core` declares `engines.node >=22.13.0`; the labs also use the built-in test runner and `import.meta.dirname`).
- Basic familiarity with LLM tool calling (what a tool call and a tool result are).
- Optional: a local clone of `mastra-ai/mastra` for reading source and running its tests (Module 0).

No API keys, no accounts, no network calls in the labs.

</div>
</div>

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

- Source links: `mastra-ai/mastra` at commit [`f88217d1`](https://github.com/mastra-ai/mastra/tree/f88217d19b63d362ff97723c1a339fbf89a1bbb0) (the `@mastra/core@1.77.0` release commit, published 2026-10-14).
- Labs: published **`@mastra/core@1.77.0`** + `@mastra/libsql@1.26.1` (pinned, so the source links and the package match). CI also runs every lab on `1.75.0` (the last release before run claims) and on a floating `@latest`, so you can see behavior change between versions. Modules 6, 7 and 9 show real differences.

## About the author

<div class="author">
<div class="mono" aria-hidden="true">RH</div>
<div>

**Ryan Hansen** wrote this course by reading the Mastra source at a pinned commit, building every lab against the published package and breaking things on purpose. Corrections are welcome: [open an issue](https://github.com/rphansen91/mastra-primitives-course/issues) or a pull request on [GitHub](https://github.com/rphansen91/mastra-primitives-course).

<p class="indep"><strong>Independent course, not affiliated with or endorsed by Mastra.</strong> This course is built from the public repository, public docs, Mastra's free books and its founders' public writing. Quotes are short, verbatim and attributed, with links to the source; none of them implies endorsement. Line references were correct at the pinned commit; on newer commits, search for the symbol name. Course text and code are MIT licensed.</p>

</div>
</div>

## FAQ

<div class="faq">

<details><summary>Do I need API keys or an account?</summary>

No. Every lab uses a small scripted mock model and the published `@mastra/core` package: no API keys, no accounts, no network calls. `npm test` runs them all, including a real `kill -9` crash lab.

</details>

<details><summary>What do I need installed?</summary>

Node.js 22.13 or newer, and comfort with TypeScript and async JavaScript. A local clone of `mastra-ai/mastra` is optional; Module 0 shows how to use one for reading source and running its tests.

</details>

<details><summary>How long does it take?</summary>

The module estimates add up to about eight and a half hours of reading, plus the labs. Each lab runs in seconds; the whole suite takes about 45 seconds. The capstone is open-ended.

</details>

<details><summary>Which Mastra version does it cover?</summary>

`@mastra/core@1.77.0`, with source links pinned to the matching release commit. CI also runs the labs on `1.75.0` and on `@latest`, and each module's Production readiness panel shows the date it was last verified.

</details>

<details><summary>Where is my progress stored?</summary>

Only in your browser (`localStorage`). Nothing is sent anywhere. Each module's tracker has a reset button.

</details>

<details><summary>Is there a certificate?</summary>

Yes. Finish every lesson, lab, break-it and quiz page and the [certificate page](/certificate) will draw a PNG with your name on it, right in your browser.

</details>

<details><summary>Where do the quotes come from?</summary>

Short, verbatim excerpts from Mastra's free books and its founders' public writing, each attributed and linked. The [reading list](/reading) collects them all.

</details>

</div>

</div>

</main>
