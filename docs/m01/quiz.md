# Check your understanding: Module 1

Answer before opening the explanations.

**1. A tool takes 30 s. A signal arrives at second 5. In the from-scratch loop, when does the model see it?**

::: details Answer
At the next model request, after the tool finishes and its result is folded in (second 30+). Signals are drained at safe points (the top of a step). Delivery is cooperative, not preemptive.
:::

**2. Why fold parallel tool results in call order instead of completion order?**

::: details Answer
So the next prompt is a deterministic function of the model's previous turn. That makes replays, prompt caching and tests stable, and providers expect tool results to match the order of the tool calls.
:::

**3. A durable step sends an email, then the process is killed before the journal write. What happens on replay, and what's the only complete fix?**

::: details Answer
The step runs again and sends a second email (at-least-once). The complete fix is for the receiver to dedupe using an idempotency key derived from stable identifiers (run id + step id), so the effect is applied once even if the request is sent twice.
:::

**4. True or false: a lease with a TTL guarantees only one worker writes at a time.**

::: details Answer
False. A paused worker can keep writing after its lease expired. You need fencing tokens checked by the storage layer.
:::

**5. What's the difference between `maxSteps` and a `stopWhen` condition?**

::: details Answer
`maxSteps` is a budget (a hard cap that says nothing about why). `stopWhen` is a policy that encodes a reason ("loop detected", "goal met", "tool X was called").
:::

**6. Give one case where a new run per message is better than delivering a signal into a running loop.**

::: details Answer
Independent requests that shouldn't share context (two unrelated users, or a request that needs a clean prompt), or when the caller needs a synchronous answer. Signals are for information that should change what the *current* work does.
:::

**7. Design question.** Your journal keys effects by step name. A step is called in a `for` loop over 10 pages. What breaks, and how do you fix it without making keys position-based again?

::: details Answer
All 10 calls share one key, so calls 2 to 10 replay page 1's result. Include the loop identity in the key (`fetchPage:${pageNumber}`, using the page number, which is semantic, not a global counter). Engines do this with iteration indexes within a named loop, plus a determinism check.
:::
