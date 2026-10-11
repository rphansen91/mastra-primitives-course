---
pageClass: lesson
aside: false
---

<script setup>
const cmd1 = "cd labs\nnpm run lab:loop-from-scratch\nnode --import tsx --test m01-first-principles/lab.test.ts"
const q_fold = [{"text": "Oslo, then Lisbon: completion order", "why": "That would make the prompt depend on timing. Replays and tests would flake."}, {"text": "Lisbon, then Oslo: the order the model called them", "correct": true, "why": "Results are folded in **call** order (`c1`, `c2`), whatever order they finish in."}, {"text": "Whichever the model mentions first in its text", "why": "The fold is mechanical. It never reads the text."}]
</script>

# Lab 1: A loop and a journal from scratch

<LabHeader module="01" folder="m01-first-principles" runs="< 1 s" :tests="8" mood="happy">

A 150-line agent loop and a 60-line journal, written from scratch, so you can see every moving part before Mastra hides them. Needs nothing but Node 22.

</LabHeader>


## Run it

<TryIt :cmd="cmd1" />

<Quiz kind="predict" module="01" id="lab-fold" question="Two parallel tool calls: Lisbon and Oslo. **Oslo finishes first.** In which order do the tool results appear in the next prompt?" :options="q_fold" />

Expected output of the loop demo (look at the two `tool-result` lines):

```text
{"type":"step-start","step":0}
{"type":"model-request","step":0,"messages":1}
{"type":"tool-call","step":0,"call":{"id":"c1","name":"weather","args":{"city":"Lisbon"}}}
{"type":"tool-call","step":0,"call":{"id":"c2","name":"weather","args":{"city":"Oslo"}}}
{"type":"tool-result","step":0,"id":"c1","result":{"city":"Lisbon","tempC":24}}
{"type":"tool-result","step":0,"id":"c2","result":{"city":"Oslo","tempC":9}}
{"type":"step-finish","step":0}
{"type":"step-start","step":1}
{"type":"model-request","step":1,"messages":4}
{"type":"step-finish","step":1}
{"type":"finish","reason":"stop","steps":2}
text: Lisbon is warmer than Oslo. | finishReason: stop | steps: 2
```

## What the tests prove

[`lab.test.ts`](https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/m01-first-principles/lab.test.ts), 8 tests:

| Test | Property |
|---|---|
| tool results folded in call order | the next prompt is deterministic even when tools finish out of order |
| maxSteps is a hard budget | a model that always calls tools stops at `maxSteps` with `finishReason: 'max-steps'` |
| a tool error becomes data | the model sees `{"error":"nope"}` and can recover |
| a signal pushed during a tool joins the NEXT request | cooperative delivery at a safe point; not in request #1, last message of request #2 |
| hooks can rewrite the request | a `beforeModel` hook redacts a secret before the model sees it |
| journal replay | `send-email` runs once; the in-flight `slow-step` runs twice (at-least-once) |
| idempotency key | two charges with the same key apply once; two without a key apply twice |
| lease | a second owner can't acquire before expiry; tokens increase |

## Tasks

1. **Trace a run.** Add `onEvent: console.log` to a test and match each event to a line in `runAgent`.
2. **Sequential tools.** Set `parallelTools: false` and measure the time difference in the weather demo. When would you want this? (Module 2's break-it has the answer.)
3. **Signal timing.** Make the `push` tool sleep 200 ms and push a signal from a `setTimeout` at 100 ms. Which request contains it? Why can't it be earlier?
4. **Crash windows.** In `durability.ts`, move the simulated crash *before* `fn()` runs. Which steps run twice now? Write down the general rule.
5. **Stretch: an `afterTool` hook** that truncates any tool result over 2 KB, then a test for it. You just wrote a processor.
