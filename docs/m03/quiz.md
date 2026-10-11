# Check your understanding: Module 3

**1. Which hook would you use to (a) redact PII from user input, (b) stop a `deploy` tool call before it runs, (c) truncate a 1 MB tool result, (d) retry on a provider 529?**

::: details Answer
(a) `processInput` (or `processInputStep` if it must also cover signals/tool results each step); (b) `processOutputStep`; (c) `processToolResult`; (d) `processAPIError` (error processors such as `StreamErrorRetryProcessor`).
:::

**2. Output processors [X, Y]. X uppercases, Y appends "!". Model streams "hi". What does the client see?**

::: details Answer
`HI!`. Y runs after X on each chunk and sees X's output.
:::

**3. Why is a module-level variable in a processor a bug, even in a single-user CLI?**

::: details Answer
It lives for the process, so it leaks across runs (and across agents using the same processor instance). Per-run state goes in `state`; cross-run state goes in memory/storage.
:::

**4. A stream guard tripwires on chunk 5. What has the user seen, and what are your options if that's unacceptable?**

::: details Answer
Chunks 1 to 4. Options: buffer before emitting (latency), guard at `processOutputStep`/`processOutputResult` (no streaming of the unvetted step), or stream to a staging buffer and release after vetting.
:::

**5. Where do a `SignalProvider`'s processors go relative to the agent's own?**

::: details Answer
Input processors are prepended; output processors are appended.
:::

**6. Design question.** A teammate proposes `agent.setMaxCost(dollars)` as a new `Agent` option. Argue for a processor instead, and name the hooks it needs.

::: details Answer
Cost budgets are cross-cutting, optional and policy-shaped, which is exactly the processor criteria in `AGENTS.md`. Hooks: `processLLMResponse` (or `processOutputStep`) to accumulate usage in `state`, and `processInputStep` to `abort` before a request that would exceed the budget. It ships as a package without touching `agent.ts`. Mastra already has a built-in `CostGuardProcessor` export; read it.
:::
