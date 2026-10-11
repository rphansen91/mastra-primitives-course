// Module 10 data: the gaps found in Modules 3 to 9 and the candidate primitives that close them.
// Shared by GapExplorer and RfcBuilder. Public facts only (the pinned open-source commit and public docs).
export type Placement = 'processor' | 'tool' | 'step' | 'storage' | 'engine' | 'core';
export type Primitive = {
  id: string; name: string; module: string; gap: string; proof: string; api: string;
  prior: [string, string, string][]; best: Placement; ok: Placement[]; bestWhy: string;
  hard: string[]; size: 'S' | 'M' | 'L'; color: string;
};
export const PLACEMENTS: { key: Placement; label: string; hint: string }[] = [
  { key: 'processor', label: 'Processor', hint: 'sees messages and stream chunks (Module 3)' },
  { key: 'tool', label: 'Tool wrapper', hint: 'wraps execute(); sees the tool context' },
  { key: 'step', label: 'Workflow step', hint: 'a reusable createStep (Module 5)' },
  { key: 'storage', label: 'Storage domain', hint: 'a new table behind the storage interface' },
  { key: 'engine', label: 'Engine seam', hint: 'wrapDurableOperation, executeSleepDuration' },
  { key: 'core', label: 'Core API change', hint: 'agent.ts, loop.ts, the processor API' },
];
export const MISFIT: Record<Placement, string> = {
  processor: 'Processors see messages and stream chunks, not tool executions, timers or queues. Can this really be a processor?',
  tool: 'A tool wrapper only covers work done inside tools. Does the gap live there?',
  step: 'A workflow step only helps inside workflows. Agent runs and tool calls wouldn\'t get it.',
  storage: 'A storage domain holds the state, but something still has to read and write it at the right moment. Pair it with a hook.',
  engine: 'Engine seams are about **how steps execute** (durability, sleeping), not message or tool semantics.',
  core: 'House rules 1 and 8: core changes land separately, must be generally useful, and touch critical paths. Is there a smaller surface?',
};
export const PRIMITIVES: Primitive[] = [
  { id: 'journal', name: 'Journaled tool results', module: '07 · 09', color: 'coral', size: 'L',
    gap: 'The in-flight tool re-runs after a crash, and nothing inside a tool is memoized.',
    proof: 'Module 7 crash lab: two pids run the same tool call after recovery.',
    api: "execute: async (input, ctx) => {\n  const pr = await ctx.journal.run('open-pr', () => gh.createPr(input));\n  return { url: pr.url };\n}",
    prior: [['Restate', 'ctx.run(name, fn)', 'side effects journaled, replayed on retry'], ['DBOS', '@DBOS.step()', 'step outputs checkpointed in Postgres'], ['Temporal', 'activities', 'results recorded in event history']],
    best: 'tool', ok: ['storage', 'engine'], bestWhy: 'A tool wrapper plus a storage domain, keyed `runId:toolCallId:name`. On engines that already journal (Inngest), route through `wrapDurableOperation`.',
    hard: ['Fencing: only the current claim generation may write', 'Cleanup when the run completes', 'Non-serializable results'] },
  { id: 'idem', name: 'Idempotency keys on tool calls', module: '07', color: 'amber', size: 'S',
    gap: 'Tools get no stable key across recovery, so they can\'t dedupe side effects with a provider.',
    proof: 'Module 7, Exercise 7.1: the charge runs twice after a crash.',
    api: "execute: async (input, ctx) =>\n  stripe.charges.create(input, { idempotencyKey: ctx.idempotencyKey })",
    prior: [['Stripe', 'Idempotency-Key header', 'same key → same result for 24 h'], ['Temporal', 'activity id', 'stable across retries'], ['Restate', 'idempotency keys', 'dedupe invocations']],
    best: 'core', ok: ['tool'], bestWhy: 'A small, generally useful addition to the tool context: `hash(runId, iteration, toolCallId)`, identical across recovery. Small diff, big payoff.',
    hard: ['Stability across loop iterations', 'Sub-agent delegations', 'What happens when the model re-plans the call'] },
  { id: 'timers', name: 'Durable timers', module: '05', color: 'sky', size: 'M',
    gap: '`sleep` is `setTimeout` on the default engine; a restart restarts the wait, and missed fires aren\'t replayed.',
    proof: 'Module 5: restart during a 1-hour sleep and watch it begin again.',
    api: "createWorkflow({ … })\n  .sleep(60 * 60 * 1000) // now survives restarts\n  .then(sendReminder)",
    prior: [['Temporal', 'workflow.sleep()', 'durable timers in history'], ['Inngest', 'step.sleep()', 'scheduled by the platform'], ['DBOS', 'DBOS.sleep()', 'wake-up time stored in Postgres']],
    best: 'engine', ok: ['storage'], bestWhy: 'Behind the existing `executeSleepDuration` seam: a storage-backed timer table plus a worker that claims due timers by CAS.',
    hard: ['Clock skew between instances', 'Catch-up policy: fire once or fire all?', 'Single-instance scheduler assumption'] },
  { id: 'wait', name: 'waitForSignal with a timeout', module: '05 · 06', color: 'violet', size: 'M',
    gap: '`waitForEvent` was removed; correlated, timeout-bounded events need suspend/resume plus your own timer.',
    proof: 'Module 5: `waitForEvent` throws WORKFLOW_WAIT_FOR_EVENT_REMOVED.',
    api: "const r = await waitForSignal('approval', {\n  match: { orderId }, timeout: '2d',\n}); // { signal } | { timedOut: true }",
    prior: [['Temporal', 'signals + condition(fn, timeout)', 'durable, in history'], ['Inngest', 'step.waitForEvent({ match, timeout })', 'correlated by expression'], ['Restate', 'awakeables', 'resolve from outside, durable']],
    best: 'step', ok: ['engine'], bestWhy: 'A reusable workflow step that suspends until a matching signal arrives for its run, or a durable timer fires. Builds on CAS-claimed resume and durable timers.',
    hard: ['Signals that arrive before the wait starts (buffering)', 'Durability of the waiting state', 'Correlation keys'] },
  { id: 'queue', name: 'Durable signal queues', module: '06', color: 'teal', size: 'L',
    gap: 'Pending signals and queued messages are in memory. A crash loses accepted-but-undelivered signals.',
    proof: 'Module 6: the queues live in process memory. Kill it after accept, before drain, and the signal is gone.',
    api: "await agent.sendSignal(signal, { resourceId, threadId });\n// same API, now written to an outbox before it's accepted",
    prior: [['Transactional outbox', 'write, then publish', 'at-least-once'], ['Temporal', 'signals', 'persisted in history before ack'], ['Redis Streams', 'consumer groups + XACK', 'redelivery until ack']],
    best: 'storage', ok: ['engine'], bestWhy: 'A storage-backed outbox per thread behind the thread runtime: `sendSignal` writes, drain sites read-and-ack, recovery re-drains. Swap the transport, not the API.',
    hard: ['Exactly-once into the transcript (dedupe by signal id)', 'Ordering', 'Interaction with transient signals'] },
  { id: 'parts', name: 'Processor-emitted parts', module: '03', color: 'lime', size: 'M',
    gap: '`processOutputStream` is one chunk in, one chunk out (plus `data-*` parts), so buffering processors can\'t flush cleanly.',
    proof: 'Module 3: a redaction processor that buffers across chunks can\'t emit what it held back.',
    api: "processOutputStream: async ({ part, emit }) => {\n  buffer += part.text;\n  if (safe(buffer)) { emit({ type: 'text-delta', text: buffer }); buffer = ''; }\n}",
    prior: [['AI SDK', 'TransformStream', 'enqueue any number of chunks'], ['Node streams', 'Transform', 'push() many per input'], ['RxJS', 'mergeMap', 'one in, many out']],
    best: 'core', ok: [], bestWhy: 'It **is** a processor API change, so it needs the "separate PR, generally useful" bar: argue it with at least two independent processors (redaction, batching, citations).',
    hard: ['Ordering guarantees', 'Backpressure', 'Interaction with stream finish and abort'] },
];
export const HOUSE_RULES = [
  { id: 'r1', rule: 'Processor over core API', ask: 'Could this be a processor, provider or tool? If not, why not?' },
  { id: 'r2', rule: 'Durable or observable → workflow step', ask: 'Does it get a span and survive a restart the same way steps do?' },
  { id: 'r3', rule: 'One message timeline', ask: 'Does what the model sees still go through the MessageList?' },
  { id: 'r4', rule: 'The thread is the unit of concurrency', ask: 'What happens with two runs, or two instances, on one thread?' },
  { id: 'r5', rule: 'Fail open on coordination, loudly on correctness', ask: 'Which failures degrade quietly, and which must throw?' },
  { id: 'r6', rule: 'Local first, then distributed', ask: 'In-memory → Unix socket → Redis: does the API stay the same?' },
  { id: 'r7', rule: 'Untrusted by default', ask: 'Can external or peer text reach it? Is it framed as data?' },
  { id: 'r8', rule: 'Small diffs on critical paths', ask: 'How many lines change in loop.ts, agent.ts or message-list code?' },
];
export const FAILURES = [
  { id: 'crash', label: 'Crash windows', ask: 'Kill -9 at every await. What runs twice, what\'s lost?' },
  { id: 'conc', label: 'Concurrency', ask: 'Two callers, two replicas, two threads of one resource.' },
  { id: 'ver', label: 'Versioning', ask: 'A run started on old code resumes on new code.' },
  { id: 'sec', label: 'Security', ask: 'Who can write this state, and what text flows through it?' },
  { id: 'clean', label: 'Cleanup', ask: 'When is the state deleted? What if that fails?' },
];
