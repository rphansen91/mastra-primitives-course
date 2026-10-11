---
pageClass: lesson
aside: false
---

# Reading list: books and essays

<p class="lead">Two free books on agents, one on web architecture, and nine essays by Mastra's founders. This page collects every one the modules cite, and every quote used on the site.</p>

Read the books for principles and patterns. Read pinned Mastra source for behavior. Where they disagree, this course goes with the source, and says so.

## The books

<ReadingIndex part="books" />

The two agent books split the work this way:

<Cite id="pat-pragmatic" />

*Principles* is the one this course cites most. As of the 3rd edition (Aug 2026), it has 20 chapters in 8 parts.

The table of contents on mastra.ai uses a different layout than the PDF, so the course cites chapter **titles**, plus printed page numbers from the 3rd edition. *Patterns* is cited by chapter title only. *Modular* is about web architecture, not agents, and appears only as background for Module 10 and the adoption page.

## Which chapter goes with which module

<ReadingIndex part="chapters" />

## Essays by the people who build Mastra, by theme

**Design philosophy**
- Sam Bhagwat, [A framework for the next million AI developers](https://mastra.ai/blog/the-next-million-ai-developers) (Nov 2024): TypeScript-only, object-sparse, concrete nouns, no hidden indirection. Used in Modules 0, 2, 3 and 10.
- Sam Bhagwat, [Solving the hardest problem in CS with LLMs](https://mastra.ai/blog/solving-the-hardest-problem-in-cs) (Feb 2025): API naming. Module 10.

**Operations**
- Abhi Aiyer, [Baby steps towards AI Ops](https://mastra.ai/blog/ai-ops) (Jan 2025): rollbacks, drift and on-call for non-deterministic systems. Module 9 and the adoption page.
- Sam Bhagwat, [What are durable AI agents?](https://mastra.ai/blog/what-are-durable-ai-agents) (Jun 2026): turn-level, step-level and mid-step persistence. Module 7.
- Sam Bhagwat, [AI engineering, two years later](https://mastra.ai/blog/ai-engineering) (Nov 2024): levels of autonomy, and evals as tests. Modules 1 and 9.

**Product**
- Shane Thomas, [HITL: Ask Before Acting](https://mastra.ai/blog/tool-approval) (Oct 2025): tool approval. Modules 3 and 5.
- Shane Thomas, [Every API needs a natural language endpoint](https://mastra.ai/blog/api-endpoints) (Jan 2025): prototype first. Adoption page.
- Shane Thomas, [From Whiteboard to Excalidraw](https://mastra.ai/blog/whiteboard-to-excalidraw-converter) (Feb 2025): a one-shot prompt decomposed into validated steps. Module 5.

**Multi-agent history**
- Abhi Aiyer, [The evolution of AgentNetwork](https://mastra.ai/blog/agent-network) (Oct 2025): how `AgentNetwork` became `.network()`. As of 1.76, `.network()` is deprecated in favor of supervisor agents. Modules 8 and 10.

## Where the course and the books differ

The books describe concepts and recommendations. The course checks behavior at `@mastra/core@1.76.0`. These are the differences a reader is most likely to trip on:

| Topic | The book | Mastra 1.76.0 | Where |
|---|---|---|---|
| Subagent context | *Principles* ch. 8 introduces the *isolated* subagent, with none of the parent's history | The default passes the **parent's conversation** unless `delegation.messageFilter` is set: the book's *forked* subagent | [M08](./m08/), Lab 8.3 |
| Observational memory budgets | *Principles* ch. 5: 30k tokens for observations, 40k for raw messages | Observer at **30k raw-message** tokens, Reflector at **40k observation** tokens: the other way round | [M04](./m04/) |
| Walking away from a durable agent | *Principles* ch. 16 | Recovery is opt-in (`recovery.durableAgents: 'auto'`). With the default, only a graceful shutdown writes checkpoints | [M07](./m07/) |
| Steering and interrupting | *Principles* ch. 16 | Signals are drained at safe points, after the current tool call. Cancelling a tool is `abortSignal` | [M06](./m06/) |
| Spend caps | *Principles* ch. 12: check before each step | No built-in spend cap; write a `processInputStep` processor | [M02](./m02/) |
| Timers and retries | *Principles* ch. 9 lists `.sleep()` with the operators and treats retries as a special case | Default-engine sleep is an in-process timer; retries are a separate `retries` / `retryConfig` setting | [M05](./m05/) |
| Metrics in tools | *Principles* ch. 12 | True for regular agents (`ctx.metrics.emit()`); not observed on the durable tool context | [M09](./m09/) |
| "Middleware" | *Principles* ch. 5 | Called **processors** | [M03](./m03/) |

Model names, prices and benchmarks in the books are dated to their edition. Treat them as examples, not current advice.

## Every quote used on this site

Verbatim, attributed and linked. A build check (`npm run check:quotes`) fails if a rendered quote doesn't match this list.

<ReadingIndex part="quotes" />

## Sourcing and licensing

- This is an **independent course, not affiliated with or endorsed by Mastra** or its founders.
- The books are free but not openly licensed. The course quotes one or two sentences at a time, for commentary and teaching, with attribution. It doesn't reproduce tables, diagrams or code from them.
- Links go to the official book pages on mastra.ai (and Gatsby for *Modular*), never to copies hosted elsewhere.
- At most one founder quote per module, always verbatim and linked to the public post. The course never writes in a founder's voice.
