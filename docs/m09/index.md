---
verified:
  core: 1.76.0
  sha: 81299c921d6f499d4c62f14c38e4d4d88b4fbfae
  date: '2026-10-11'
pageClass: lesson
aside: false
---

<script setup>
const B = 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae'
const outObs = "=== 1) The trace of one agent run (model_chunk spans hidden) ==============\n  agent_run        agent run: 'ci-helper'\n    model_generation llm: 'mock'\n      model_step       step: 0\n        processor_run    llm request processor: provider-history-compat\n        processor_run    llm request processor: unsupported-file-handler\n        model_inference  inference: 0\n        tool_call        tool: 'check_ci'\n      model_step       step: 1\n        processor_run    llm request processor: provider-history-compat\n        processor_run    llm request processor: unsupported-file-handler\n        model_inference  inference: 1\n\n=== 2) Rule-based scorer over a 3-item dataset (runEvals) =================\n  Why did CI fail?         \u2192 1 (names the failure reason)\n  Is CI green?             \u2192 0 (does not name the failure reason)\n  What broke the build?    \u2192 1 (names the failure reason)\n  average: 0.6666666666666666\n\n=== 3) LLM-judge scorer (the judge is a mock model too) ===================\n  score: 0 | unsupported: the build uses Rust\n  judge saw: system    You are a strict grader.\n  judge saw: user      Tool result: {\"status\":\"failed\",\"reason\":\"lint error in auth.ts\"} Answer: CI failed because the build uses Rus\n\n=== 4) isTaskComplete: a scorer keeps the loop going ======================\n  model calls: 3\n  feedback the model saw: assistant #### Completion Check Results Overall: \u274c NOT COMPLETE **citations** (citations) Score: 0 \u274c\n  result.text: Draft 1: Mastra is a TypeScript agent framework.Draft 2: Mastra is a TypeScript agent framework. Mastra is a TypeScript agent framework [1].\n\n=== 5) Record once, replay deterministically, catch prompt drift ==========\n  tape dc3ae83bd1 \u2192 tool check_ci\n  tape d95ce05e46 \u2192 text\n  replay, same code:      CI failed on PR 42: lint error in auth.ts. | misses: 0\n  replay, new instructions: [\n  'call 1: prompt fcdcb0443f not on tape (expected dc3ae83bd1)',\n  'call 2: prompt 0c8b68d71b not on tape (expected d95ce05e46)'\n]"
const outcomes = [
  'Read a trace: one span per loop step, processor, inference and tool call',
  'Write scorers as a four-stage pipeline: rule-based and LLM-judge',
  'Run one scorer live, over traces, in CI, and inside the loop (isTaskComplete)',
  'Use record/replay for deterministic tests that catch prompt drift',
  'Know what traces are not: an authoritative, replayable history',
  'Review it like a platform team: what\'s stable, beta or deprecated, how it fails, which guardrails it needs (Production readiness)'
]
const questions = [
  { title: 'What woke it?', body: 'A signal? A schedule? A user? Which one, and with what text?', icon: 'bolt', color: 'amber' },
  { title: 'What did it see?', body: 'Which processors rewrote the prompt, and what the tool actually returned.', icon: 'eye', color: 'sky' },
  { title: 'What repeated?', body: 'Did a tool call run twice after recovery? (Module 7.)', icon: 'reset', color: 'coral' },
  { title: 'Was it any good?', body: 'And will the processor change you ship today make answers worse?', icon: 'star', color: 'violet' },
]
const q_shape = [
  { text: 'One span for the run, with the final answer', why: 'That\'s just a log line. You couldn\'t tell which step, tool or processor did what.' },
  { text: 'agent run → model generation → one model step per loop turn → processors, inference and tool calls inside each step', correct: true, why: 'The loop, processors and tools are all workflow steps (Modules 2, 3, 5), so the trace has the loop\'s shape, for free.' },
  { text: 'One span per token', why: 'There are `model_chunk` spans, but they sit inside inferences. The lab hides them because there are so many.' },
]
const parts = [
  { name: 'Spans', short: 'from workflow steps', detail: 'Agent run → model generation → model step → `<phase> processor: <id>` → inference → tool call. Processors can set `spanType` / `spanName` ([`processors/index.ts` L625](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts#L625)).', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/processors/index.ts#L625', color: 'sky' },
  { name: 'Exporters', short: 'Langfuse, Braintrust, OTel…', detail: 'Packages under [`observability/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/observability): Langfuse, Braintrust, Datadog, Arize, Laminar and OpenTelemetry. The lab uses `TestExporter` from `@mastra/observability`.', href: 'https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/observability', color: 'teal' },
  { name: 'Scorers', short: 'createScorer', detail: '[`createScorer`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals/base.ts#L1982): `preprocess → analyze → generateScore → generateReason`, each a function or a judge prompt.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals/base.ts#L1982', color: 'violet' },
  { name: 'Datasets', short: 'runEvals', detail: '[`runEvals`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals/run/index.ts) runs a target over data with scorers, with per-item callbacks. Over stored traces: [`evals/scoreTraces/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals/scoreTraces).', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/evals/run/index.ts', color: 'lime' },
  { name: 'Completion', short: 'isTaskComplete', detail: 'Scorers that **drive** the loop: the loop\'s completion step (Module 2, step ⑦) runs them and keeps going, with feedback, until they pass.', href: 'https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/loop/loop-builder.ts#L263', color: 'coral' },
  { name: 'Replay', short: '_llm-recorder', detail: 'Mastra\'s own tests replay recorded model responses ([`packages/_llm-recorder`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/_llm-recorder)). The lab\'s `recorder.ts` is a ~30-line version.', href: 'https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/_llm-recorder', color: 'amber' },
]
const q_loop = [
  { text: 'Just the final draft, with the citation', why: 'That\'s what you\'d hope. The lab shows otherwise.' },
  { text: 'All three drafts, concatenated', correct: true, why: 'Lab output: `Draft 1: …Draft 2: … Mastra is a TypeScript agent framework [1].` The completion loop **continues** the same run; text accumulates.' },
  { text: 'Nothing: the run fails after two failed checks', why: 'Failed checks add feedback and the loop continues, up to `maxSteps`.' },
]
const order = ['preprocess', 'analyze', 'generateScore', 'generateReason']
const breaks = [
  { title: 'No event-sourced history', body: 'No per-run journal of every request, response, signal and claim, like Temporal\'s. Traces are sampled and exported, not authoritative.', icon: 'book', color: 'coral' },
  { title: 'No replay against new code', body: 'Time travel **re-executes** a workflow from a step. It doesn\'t replay recorded model outputs through changed processors.', icon: 'reset', color: 'amber' },
  { title: 'Judges are models too', body: 'They drift, cost money and need their own evals. Use rules wherever the property is checkable.', icon: 'flask', color: 'violet' },
  { title: 'Mock tests can lie', body: 'They prove the loop\'s mechanics, not that a real model calls the tool. Pair them with recorded and live evals.', icon: 'alert', color: 'sky' },
  { title: 'Signals are hard to attribute', body: 'Which notification caused a wake should be a first-class span attribute. Check what your exporter shows.', icon: 'bolt', color: 'lime' },
  { title: 'Scorers read the wrong part', body: 'An agent\'s output is a list of messages of parts. After a tool call, part 0 isn\'t text. That\'s Exercise 9.1.', icon: 'puzzle', color: 'teal' },
]
const q_drift = [
  { text: 'The replay returns the recorded answers anyway', why: 'That would hide the change: you\'d test old behavior against new code.' },
  { text: 'Every call misses the tape: the system prompt is in every request', correct: true, why: 'Lab output: 2 misses after changing instructions. A loud miss is the feature: re-record and review the diff.' },
  { text: 'Only the first call misses', why: 'The instructions are in **every** request, so every hash changes.' },
]
const choose = [
  { when: 'You want spans that match loop, processor and tool structure with no extra code', not: 'You already standardize on a vendor SDK', alt: 'Export Mastra spans to it (Langfuse, Braintrust, Datadog, OTel)' },
  { when: 'One scorer definition should run live, on traces and in CI', not: 'You need large-scale offline experimentation', alt: 'Braintrust / LangSmith experiments; your own data pipeline' },
  { when: 'Deterministic CI for agent mechanics', not: 'You need provable replay of production incidents', alt: 'Build the journal (Module 10 candidate); Temporal-style history' },
  { when: 'A quality bar should keep the agent working (isTaskComplete)', not: 'Each check is an expensive judge call on every iteration', alt: 'A rule-based completion scorer; a workflow with an explicit review step' },
]
const recall = [
  { q: 'Why does a Mastra trace have the loop\'s shape?', a: 'The loop, processors and tools are workflow steps, and each step gets a span.' },
  { q: 'The four stages of a scorer?', a: '`preprocess → analyze → generateScore → generateReason`. Each is a function or an LLM judge prompt; only generateScore is required.' },
  { q: 'Four places one scorer can run?', a: 'Live on an agent (with sampling), over stored traces, in CI with `runEvals`, and inside the loop with `isTaskComplete`.' },
  { q: 'What does a failing completion scorer do?', a: 'Adds "Completion Check Results … NOT COMPLETE" feedback and the loop continues. `result.text` accumulates.' },
  { q: 'What does record/replay key on, and why?', a: 'A hash of the prompt. Same code → 0 misses; a prompt change → loud misses instead of stale answers.' },
  { q: 'Exercise 9.1 bug?', a: 'The scorer read `output[0].content.parts[0].text`; after a tool call part 0 is a tool-invocation. Join every text part.' },
]
const cheat = [
  { title: 'Trace', color: 'sky', lines: ['agent_run → model_generation', 'model_step → processor_run, model_inference, tool_call', 'TestExporter for tests'] },
  { title: 'Scorer', color: 'violet', lines: ['createScorer({ id, description, judge? })', '.preprocess .analyze .generateScore .generateReason', 'scorer.run({ input, output })'] },
  { title: 'Run it', color: 'lime', lines: ['agent scorers + sampling', 'scoreTraces', 'runEvals({ target, data, scorers })'] },
  { title: 'Loop', color: 'coral', lines: ['isTaskComplete: { scorers, strategy }', 'fail → feedback → continue', 'result.text accumulates'] },
  { title: 'Replay', color: 'amber', lines: ['tape keyed by prompt hash', 'same code → 0 misses', 'changed prompt → loud miss'] },
  { title: 'Gotchas', color: 'teal', lines: ['output = messages of parts', 'judges drift', 'traces aren\'t a journal'] },
]
</script>

# Module 9: Observability and evals

<p class="lead">Everything in Modules 2 to 8 is invisible by default. This module makes agent behavior into data you can read (traces), grade (scorers), gate on (CI) and replay (tapes), using the same structure the loop already has.</p>

<LessonHero module="09" :minutes="35" lab="Observe lab, ~3 s, no API keys" :outcomes="outcomes" mood="thinking">

**3:07 am.** Your always-on agent sent a customer a very confident, very wrong answer. In the morning, everyone asks the same question: *why?*

Which signal woke it? Which processor rewrote the prompt? Did a tool call repeat after recovery? Right now, you can't tell.

</LessonHero>

<Journey :station="1" module="09" />

## The problem {#problem}

At 3 am you need four answers:

<IdeaCards :cols="4" :cards="questions" />

Unit tests with a mock model (this course's labs) prove **mechanics**. They can't prove **quality**, and they don't help you debug a run that already happened.

<Callout type="analogy" title="A flight recorder and a driving test">

A **trace** is the flight recorder: after the fact, you can see every instrument at every moment. A **scorer** is the driving examiner with a checklist: did it signal, did it stop, did it name the failure reason? You want both. The recorder tells you what happened; the examiner tells you whether it was good.

</Callout>

<Quiz kind="predict" module="09" id="shape" question="You turn on tracing and run the CI helper from Module 2 (one tool call, then an answer). What does the trace look like?" :options="q_shape" />

<StationDone module="09" :station="1" />

<Journey :station="2" module="09" />

## Under the hood {#under-the-hood}

### Traces have the loop's shape

<TraceExplorer />

### Scorers are tiny pipelines

<ScorerPipeline />

<ScorerPlayground />

<OrderSteps module="09" id="stages" prompt="Order a scorer's stages." :items="order" explain="Extract what you need, analyze it (with a function or a judge), turn the analysis into a number, then explain the number." />

<ClickMap title="The observability toolbox" :stations="parts" start-label="see" end-label="test" />

<Quiz kind="predict" module="09" id="loop" question="`isTaskComplete` with a `citations` scorer. The model writes Draft 1 (no citation), Draft 2 (no citation), then a sentence with `[1]`. What's `result.text`?" :options="q_loop" />

<TryIt cmd="npm run lab:observe" :output="outObs">

All five experiments in one run: trace tree, rule scorer over a dataset, LLM judge (also a mock), the completion loop, and record/replay.

</TryIt>

<DeepDive title="Time travel, exporters and the single-rooted trace">

- **Time travel:** workflow [`timeTravel`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/workflows/workflow.ts#L5648) re-executes a run from a chosen step with new context ([docs](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/workflows/time-travel.mdx)). With snapshots (Module 5) it's a "what if this step had returned X" debugger.
- **Durable recovery** keeps a single-rooted trace across a crash; see the crash-recovery tests in [`agent/durable/__tests__/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/agent/durable/__tests__).
- **Tracing docs:** [`observability/tracing/overview.mdx`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/observability/tracing/overview.mdx). **Evals docs:** [`docs/evals/`](https://github.com/mastra-ai/mastra/tree/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/evals).
- **Classifier scorers** wrap Mastra's `Classifier` primitive, the same one you might use to triage notifications (Module 6).

</DeepDive>

### Goals: a scorer that gates the loop

Goals (1.43.0+) put Module 9's judge *inside* Module 2's loop. A goal is a durable, thread-scoped objective, and after each iteration a judge model scores the output: `1` when the objective is met, `0` otherwise. The loop continues with feedback until the judge passes or the **run budget** runs out (`maxRuns`, default **50**). The objective is then marked `paused` ([`goals.mdx` L13–17, L62–76](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/docs/src/content/en/docs/harness/goals.mdx#L13)). Without a judge, the goal step does nothing. `goal.tools` lets the judge verify the work rather than grade the text alone. Budget for it: that's one more model call per iteration.

<Callout type="note" title="Test utilities that ship in the package">

`@mastra/core/test-utils/llm-mock` exports `createMockModel` and `MastraLanguageModelV2Mock` ([`llm-mock.ts`](https://github.com/mastra-ai/mastra/blob/81299c921d6f499d4c62f14c38e4d4d88b4fbfae/packages/core/src/test-utils/llm-mock.ts)). The course's ~100-line mock model teaches the mechanics. In your own repo, start with the shipped helpers.

</Callout>

<StationDone module="09" :station="2" />

<Journey :station="3" module="09" />

## Break it {#break-it}

<IdeaCards :cards="breaks" />

<Misconception myth="If it's in the trace, I can replay the run.">

A trace is an **observation**: sampled, exported, shaped for humans. It doesn't hold every byte of every request, and nothing in Mastra re-feeds it through your code. Replay needs a tape keyed to the exact prompts (like the lab's recorder) or an authoritative journal (Module 10).

</Misconception>

<Misconception myth="An LLM judge is more trustworthy than a rule, because it understands the answer.">

A judge is another model call: it can drift, be fooled, and cost money on every item. If the property is checkable ("mentions the failure reason", "has a citation", "valid JSON"), a rule is cheaper, deterministic and never wrong about what it checks. Save judges for what rules can't express, and test the judge's prompt (the lab asserts what the judge saw).

</Misconception>

### Your mission: the scorer that only scores zeros

<Callout type="tip" title="Exercise 9.1">

The `mentions-reason` scorer should give 1 to answers that name the CI failure reason. Over the 3-item dataset it should score `[1, 0, 1]`. The starter scores `[0, 0, 0]`. Toggle the playground above to "reads the first part" to see why, then fix `exercises/ex1-mentions-reason.ts`.

</Callout>

<TryIt cmd="LAB_TARGET=exercises node --import tsx --test m09-evals/break-it.test.ts">

Solution on the [lab page](./lab#break-it-exercise-9-1-the-scorer-that-only-scores-zeros).

</TryIt>

<Quiz kind="predict" module="09" id="drift" question="You recorded a tape, then changed the agent's `instructions`. You replay. What happens?" :options="q_drift" />

<StationDone module="09" :station="3" />

<Journey :station="4" module="09" />

## Choose wisely {#choose-wisely}

<Choose subject="Mastra tracing and evals" :rows="choose" />

<Callout type="analogy" title="LangSmith: the hosted lab notebook">

LangSmith traces LangChain and LangGraph runs from callbacks and hosts datasets and experiments with LLM-as-judge evaluators. Mastra's difference: scorers are a **framework primitive** (they run in your process and can gate the loop through task completion), and tracing comes from the workflow-step structure rather than callbacks. Many teams use both: Mastra scorers in CI, spans exported to a hosted tool.

</Callout>


## Production readiness {#production-readiness}

The review a cautious platform team would write before putting this module's primitives on a critical path. Every badge links to its source at the pinned release. For the course-wide decision, see [Adopting Mastra in production](../adopting).

<ProdReadiness module="09" />

<StationDone module="09" :station="4" next="./lab" next-label="On to the lab" />

## Wrap-up

<Podcast title="Observability and evals, in four minutes" :minutes="4">

**Host:** Why does tracing "just work" in Mastra?

**Loopy:** Because the agent loop, processors and tool calls are all workflow steps, and each step gets a span. The trace has the loop's shape: agent run, model generation, one model step per turn, and inside each step the processors, the inference and the tool calls.

**Host:** What's a scorer?

**Loopy:** A four-stage pipeline: preprocess, analyze, generate a score, generate a reason. Each stage is a function, or a prompt for a judge model. One definition runs live on an agent, over stored traces, in CI with runEvals, or inside the loop with isTaskComplete.

**Host:** Inside the loop?

**Loopy:** If the scorer fails, the loop adds "not complete" feedback and keeps going. One surprise from the lab: the final text accumulates every attempt.

**Host:** And replay?

**Loopy:** Record the model's answers keyed by a hash of each prompt. Replay in CI with no keys. If your change alters a prompt, you get a loud miss instead of a stale answer.

**Host:** What's missing?

**Loopy:** An authoritative history. Traces are observations, not a journal, and nothing replays recorded outputs through changed code. That's a great Module 10 project.

</Podcast>

<Recall module="09" :cards="recall" />

<CheatCard module="09" title="Observability and evals" subtitle="Read it, grade it, replay it" :cells="cheat" />

<Callout type="win" title="Where next">

- **[Lab 9: observe the course](./lab):** five experiments and Exercise 9.1.
- **[Module 10: Design a primitive](/m10/):** turn one of these gaps into an RFC.

</Callout>
