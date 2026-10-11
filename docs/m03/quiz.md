---
pageClass: lesson
aside: false
---

<script setup>
const q1 = [
  { text: '(a) processInput (b) processOutputStep (c) processToolResult (d) processAPIError', correct: true, why: 'Use `processInputStep` for (a) if it must also cover signals and tool results each step. (d) is where error processors such as `StreamErrorRetryProcessor` live.' },
  { text: '(a) processOutputStream (b) processToolResult (c) processInput (d) processLLMResponse', why: 'Mostly backwards: `processToolResult` runs after the tool (too late for (b)), and stream hooks see output, not input.' },
  { text: '(a) processInputStep (b) processOutputResult (c) processOutputStream (d) a try/catch in the tool', why: '`processOutputResult` runs after the whole run: the deploy already happened.' },
]
const q2 = [
  { text: '`hi!`', why: 'X uppercases first.' },
  { text: '`HI!`', correct: true, why: 'Output processors run in order on each chunk; Y sees X\'s output.' },
  { text: '`HI` then `!` as separate messages', why: 'Y appends to the chunk it receives; it\'s one stream.' },
]
const q3 = [
  { text: 'It isn\'t a bug if there\'s only one user', why: 'There\'s still more than one **run**, and possibly more than one agent sharing the processor instance.' },
  { text: 'It lives for the process, so it leaks across runs and across agents sharing the instance', correct: true, why: 'Per-run state goes in `state`; cross-run state goes in memory or storage.' },
  { text: 'Processors run in a worker thread, so the variable is always undefined', why: 'They run in the same process. That\'s why the variable leaks.' },
]
const q4 = [
  { text: 'Nothing: tripwires roll back what was streamed', why: 'Streamed chunks are already on the user\'s screen. There\'s no rollback.' },
  { text: 'Chunks 1 to 4. To avoid it: buffer before emitting, guard at processOutputStep / processOutputResult, or stage and release after vetting', correct: true, why: 'Each option trades latency or streaming for safety. Pick per use case.' },
  { text: 'Only chunk 5, flagged as blocked', why: 'Chunk 5 is the one that\'s blocked. The earlier ones already went out.' },
]
const q5 = [
  { text: 'Input processors prepended; output processors appended', correct: true, why: 'The provider\'s input processors see the input first; its output processors see the output last.' },
  { text: 'Both appended after the agent\'s own', why: 'Inputs are prepended.' },
  { text: 'They replace the agent\'s processors while the signal is handled', why: 'They compose; nothing is replaced.' },
]
</script>

# Check your understanding: Module 3

Answer before reading the explanations. Your progress is saved in this browser.

<Quiz module="03" id="cq-1" question="Which hook would you use to (a) redact PII from user input, (b) stop a `deploy` tool call before it runs, (c) truncate a 1 MB tool result, (d) retry on a provider 529?" :options="q1" />

<Quiz kind="predict" module="03" id="cq-2" question="Output processors `[X, Y]`. X uppercases, Y appends &quot;!&quot;. The model streams &quot;hi&quot;. What does the client see?" :options="q2" />

<Quiz module="03" id="cq-3" question="Why is a module-level variable in a processor a bug, even in a single-user CLI?" :options="q3" />

<Quiz kind="predict" module="03" id="cq-4" question="A stream guard tripwires on chunk 5. What has the user seen?" :options="q4" />

<Quiz module="03" id="cq-5" question="Where do a `SignalProvider`'s processors go relative to the agent's own?" :options="q5" />

<Reflect question="A teammate proposes agent.setMaxCost(dollars) as a new Agent option. Argue for a processor instead, and name the hooks it needs.">

Cost budgets are cross-cutting, optional and policy-shaped, which is exactly the processor criteria in `AGENTS.md`. Hooks: `processLLMResponse` (or `processOutputStep`) to accumulate usage in `state`, and `processInputStep` to `abort` before a request that would exceed the budget. It ships as a package without touching `agent.ts`. Mastra already has a built-in `CostGuardProcessor` export; read it.

</Reflect>
