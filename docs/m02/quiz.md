# Check your understanding: Module 2

**1. Name the seven steps of one loop iteration, in order.**

::: details Answer
LLM execution → map tool calls → `foreach(toolCallStep)` → LLM mapping → background-task check → signal drain → is-task-complete / goal.
:::

**2. Why is Mastra's loop a `dowhile` workflow instead of a `while` loop?**

::: details Answer
Each phase becomes a step with serializable input/output, its own span, and a checkpoint boundary. The durable engine can re-implement the same steps over serializable state, and observability gets per-step structure for free.
:::

**3. `processOutputStep` runs before or after `tool.execute`? What can you do with that?**

::: details Answer
Before. It sees the model's tool calls for the step and can veto/rewrite them (or tripwire) before any side effect happens.
:::

**4. Two HTTP requests call `agent.stream()` on the same thread 10 ms apart. What happens?**

::: details Answer
The second waits in `waitForCrossAgentThreadRun` until the first run finishes, then runs with the first exchange in its history. One active run per thread (within one process, or across processes with a distributed PubSub).
:::

**5. A signal arrives while the model is streaming reasoning tokens only. And while a tool is running?**

::: details Answer
Reasoning-only: the physical request can be aborted ("Interrupted by a queued signal") and reissued with the signal; it doesn't consume a step (`signalPreempted`). During a tool: it waits for the next drain site (signal-drain step, predicate inline drain, or the next request build).
:::

**6. Why might an always-on agent that receives many signals never stop, even with `maxSteps: 50`?**

::: details Answer
Preempted requests don't spend steps, and each woken/continued run gets its own budget. You need explicit `stopWhen` policies and rate limits on signal sources.
:::

**7. Design question.** You want "never call `deploy` twice in one run". Processor, `stopWhen`, or tool code? Defend your choice.

::: details Answer
A processor: `processOutputStep` sees tool calls before execution and can drop or tripwire the second `deploy`, and it composes across agents without touching the tool. `stopWhen` runs after the effect (too late). Tool code works but couples policy to the tool and needs per-run state, which processors get via `state`.
:::
