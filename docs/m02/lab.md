---
pageClass: lesson
aside: false
---

<script setup>
const cmd1 = "npm run lab:anatomy"
const cmd2 = "npm run lab:thread-reservation"
const q_same = [{"text": "At 10 ms: runs are independent", "why": "On different threads, yes. On one thread, Mastra keeps one active run."}, {"text": "At ~300 ms, after the first finishes, with the first exchange in its prompt", "correct": true, "why": "The second waits for the first, then loads the thread history, which now includes answer 1."}, {"text": "Never: it throws \"thread busy\"", "why": "It waits instead of failing."}]
</script>

# Lab 2: Loop anatomy and thread reservation

<LabHeader module="02" folder="m02-agent-loop" runs="~3 s" :tests="3" mood="happy">

Two experiments against the published package: the full hook order for one tool call, and what happens when two requests hit the same thread.

</LabHeader>


## 2.1 Anatomy

<TryIt :cmd="cmd1" />

[`anatomy.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m02-agent-loop/anatomy.ts) builds an agent with one tool (`check_ci`), an input processor and an output processor that log every hook, plus `onStepFinish` and `onIterationComplete` callbacks. The mock model calls the tool, then answers.

Expected output ([full file](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/expected-output/m02-anatomy.txt)):

```text
=== fullStream chunk types ================================================
start → step-start → tool-call → tool-result → step-finish → step-start → text-start → text-delta → text-end → step-finish → finish

=== Prompt sent on each model step ========================================
-- doStream #1
   system    You triage CI.
   user      Why is PR 42 red?
-- doStream #2
   system    You triage CI.
   user      Why is PR 42 red?
   assistant [tool-call check_ci]
   tool      [tool-result check_ci: {"pr":42,"status":"failed","reason":"docker hub 429"}]
```

The test ([`lab.test.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m02-agent-loop/lab.test.ts)) pins the full 15-line hook order. If a Mastra release reorders hooks, the test tells you.

## 2.2 Thread reservation

<TryIt :cmd="cmd2" />

<Quiz kind="predict" module="02" id="lab-same" question="Two `stream()` calls on the **same thread**, 10 ms apart, with a 300 ms model. When does the second one start?" :options="q_same" />

Two `stream()` calls 10 ms apart, with a 300 ms model:

```text
=== Same thread: serialized ===============================================
  first started
  first finished: answer 1
  second started
  second finished: answer 2
  request #2: system Be brief. / user first / assistant answer 1 / user second

=== Different threads: concurrent =========================================
  first started
  second started
  ...
```

On the same thread, the second call **doesn't start until the first finishes**, and its prompt contains the first exchange (loaded from memory). On different threads they overlap.

## Tasks

1. **Hook hunting.** Add `processLLMRequest` and `processToolResult` to the logging processors in `anatomy.ts`. Where do they land in the order? Update the test.
2. **Two tool calls in one step.** Script the model to call `check_ci` twice in step 1. How many `tool-result` chunks, how many `step-finish`? What does prompt #2 look like?
3. **Abort.** Pass an `abortSignal` and abort during the tool. Which chunks do you get? Is `processOutputResult` called?
4. **Without memory.** Remove `memory` from the reservation lab. Do the runs still serialize? Why or why not? (Hint: what identifies a thread?)
5. **Read along.** With the anatomy output open, walk [`loop-builder.ts` L263-416](https://github.com/mastra-ai/mastra/blob/f88217d19b63d362ff97723c1a339fbf89a1bbb0/packages/core/src/loop/loop-builder.ts#L263) and label each output line with the step that produced it.
