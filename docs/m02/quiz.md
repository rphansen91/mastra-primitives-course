---
pageClass: lesson
aside: false
---

<script setup>
const seven = ['LLM execution', 'Map tool calls', 'foreach(toolCallStep)', 'LLM mapping', 'Background-task check', 'Signal drain', 'Is-task-complete / goal']
const q2 = [
  { text: 'Because `while` loops can\'t be async in JavaScript', why: 'They can. The reason is what steps give you.' },
  { text: 'Each phase becomes a step with serializable I/O, its own span and a checkpoint boundary', correct: true, why: 'The durable engine can re-implement the same steps over serializable state, and observability gets per-step structure for free (Module 9).' },
  { text: 'It\'s faster: workflows run steps in parallel', why: 'The loop\'s iterations are sequential by nature. Speed isn\'t the point.' },
]
const q3 = [
  { text: 'Before: it sees the step\'s tool calls and can veto, rewrite or tripwire them before any side effect', correct: true, why: 'That\'s what makes it the right place for policy like "never deploy twice".' },
  { text: 'After: it sees the tool results and can redact them', why: 'That\'s `processToolResult`. `processOutputStep` runs before the tools.' },
  { text: 'In parallel with the tools', why: 'Then it couldn\'t stop anything.' },
]
const q4 = [
  { text: 'Both run at once and their messages interleave in the thread', why: 'Mastra prevents exactly that: one active run per thread.' },
  { text: 'The second waits until the first finishes, then runs with the first exchange in its history', correct: true, why: '`waitForCrossAgentThreadRun`. Within one process by default, across processes with a distributed PubSub.' },
  { text: 'The second throws "thread busy"', why: 'It waits rather than failing.' },
]
const q5 = [
  { text: 'Both times it waits for the next drain site', why: 'Reasoning-only streaming is special: the request can be preempted.' },
  { text: 'Reasoning-only: the request can be aborted and reissued with the signal (no step spent). During a tool: it waits for the next drain site', correct: true, why: '"Interrupted by a queued signal" and `signalPreempted`. A running tool is never interrupted.' },
  { text: 'Both times the current work is aborted and restarted', why: 'Aborting a running tool would risk half-done side effects. Mastra never does that.' },
]
const q6 = [
  { text: 'It can\'t: `maxSteps: 50` is a hard cap on the agent\'s lifetime', why: '`maxSteps` bounds **one run**.' },
  { text: 'Preempted requests don\'t spend steps, and each woken or continued run gets a fresh budget', correct: true, why: 'You need explicit `stopWhen` policies and rate limits on signal sources.' },
  { text: 'Every delivered signal resets `maxSteps` to zero', why: 'A delivered signal doesn\'t reset the count. The budget leaks through preemption and new runs.' },
]
</script>

# Check your understanding: Module 2

Answer before reading the explanations. Your progress is saved in this browser.

<OrderSteps module="02" id="cq-seven" prompt="Put the seven steps of one loop iteration in order." :items="seven" explain="LLM execution → map tool calls → `foreach(toolCallStep)` → LLM mapping → background-task check → signal drain → is-task-complete / goal." />

<Quiz module="02" id="cq-2" question="Why is Mastra's loop a `dowhile` **workflow** instead of a plain `while` loop?" :options="q2" />

<Quiz module="02" id="cq-3" question="Does `processOutputStep` run before or after `tool.execute`?" :options="q3" />

<Quiz kind="predict" module="02" id="cq-4" question="Two HTTP requests call `agent.stream()` on the **same thread** 10 ms apart. What happens?" :options="q4" />

<Quiz kind="predict" module="02" id="cq-5" question="A signal arrives (a) while the model is streaming reasoning tokens only, and (b) while a tool is running. What happens each time?" :options="q5" />

<Quiz module="02" id="cq-6" question="Why might an always-on agent that receives many signals never stop, even with `maxSteps: 50`?" :options="q6" />

<Reflect question="You want &quot;never call deploy twice in one run&quot;. Processor, stopWhen, or tool code? Defend your choice.">

A processor: `processOutputStep` sees tool calls before execution and can drop or tripwire the second `deploy`, and it composes across agents without touching the tool. `stopWhen` runs after the effect (too late). Tool code works but couples policy to the tool and needs per-run state, which processors get via `state`.

</Reflect>
