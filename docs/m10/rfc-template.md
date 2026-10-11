# RFC template: a new Mastra primitive

Copy this into `rfcs/NNNN-<name>.md` in your fork.

```md
# RFC NNNN: <primitive name>

- Author:
- Status: draft | proposed | accepted | rejected
- Pinned Mastra commit / package versions:
- Implementation: labs/m10-<name>/ (tests: N passing)

## 1. Summary
One paragraph. What is the primitive, and what does a user write?

## 2. Problem
- What breaks today? Link the failing test (break-it) and paste its output.
- Who hits this, and what does it cost (duplicate charges, lost messages, stuck runs)?
- Where in the source does the gap live? (file + line at the pinned commit)

## 3. Prior art
| System | API | Guarantee | What we borrow / reject |
|---|---|---|---|
| Temporal | | | |
| Restate / DBOS | | | |
| LangGraph / Inngest / AI SDK / … | | | |

## 4. Design
- User-facing API (code sample).
- Where it lives: processor / tool wrapper / SignalProvider / storage domain / engine seam / core.
  If core: why can't it be a processor? What's the generally useful core change?
- Data model (what's stored, keyed by what, in which storage domain).
- How it composes with: the loop (which step), processors (order), memory, signals, durable agents, PubSub.

## 5. Failure modes
For each, say what happens and what the user sees:
- Crash before / during / after the primitive's write.
- Two processes (replicas) at once; stale owner (fencing).
- Code change between crash and recovery (versioning).
- Storage or PubSub unavailable (fail open or closed? why?).
- Untrusted input reaching it.
- Unbounded growth (retention, cleanup).

## 6. Fit with the house rules
1. Processor over core API:
2. Durable/observable as steps:
3. One message timeline:
4. Thread as unit of concurrency:
5. Fail open on coordination, loudly on correctness:
6. Local first, then distributed:
7. Untrusted by default:
8. Small diffs on critical paths:

## 7. Alternatives considered
At least two, including "do nothing / document a pattern".

## 8. Testing
- Break-it test (fails on stock Mastra).
- Unit tests; crash/concurrency tests (child processes, like labs/m07).
- Version matrix results.

## 9. Rollout
Opt-in flag? Default later? Migration for existing data? Docs to update?

## 10. Open questions
```

## Worked mini-example (abridged)

**RFC 0001: `ctx.idempotencyKey` for tool calls**

- **Problem:** after `kill -9` during `slow_deploy`, recovery re-executes the tool and the deploy API applies twice ([Lab 7](/m07/lab), starter for Exercise 7.1). Durable tool contexts on 1.75.0 have no `runId`.
- **Prior art:** Restate `ctx.run` + invocation id; Temporal activity id + `WorkflowExecution`; Stripe `Idempotency-Key`.
- **Design:** the loop computes `idempotencyKey = sha256(runId, iteration, toolCallId)` and passes it in the tool context for regular **and** durable agents; `createTool({ idempotent: true })` additionally dedupes completed results in a `tool_results` storage domain under the run fence.
- **Failure modes:** a crash after the external call but before the result write is covered only if the *external* API honors the key (documented); a key collision across runs is impossible because `runId` is included; sub-agent tool calls get keys derived from the parent key.
- **House rules:** the key is a tiny core context addition (generally useful); the dedupe store is opt-in and lives behind a storage domain; no loop changes.
