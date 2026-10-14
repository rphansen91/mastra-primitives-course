// One source of truth for the stability badges. Every entry cites the Mastra docs or source
// at the course's pinned commit (the @mastra/core@1.77.0 release commit), or a lab output that
// demonstrates the behavior. Re-check this file whenever the pin moves.
export const SHA = 'f88217d19b63d362ff97723c1a339fbf89a1bbb0';
const DOCS = `https://github.com/mastra-ai/mastra/blob/${SHA}/docs/src/content/en/docs/`;
const SRC = `https://github.com/mastra-ai/mastra/blob/${SHA}/`;
const LABS = 'https://github.com/rphansen91/mastra-primitives-course/blob/main/labs/';

export type Status = 'stable' | 'beta' | 'experimental' | 'deprecated' | 'changed';
export type Entry = { name: string; status: Status; since?: string; note: string; href: string; source: string };

export const STATUS_META: Record<Status, { label: string; color: string; icon: string; meaning: string }> = {
  stable: { label: 'Stable', color: 'lime', icon: 'check', meaning: 'Part of the 1.x API with no beta or experimental marker in the docs. Semver applies.' },
  beta: { label: 'Beta', color: 'amber', icon: 'flask', meaning: 'Marked beta in the docs, or published only as a pre-1.0 package: breaking changes may land in a minor release. Pin exact versions.' },
  experimental: { label: 'Experimental', color: 'coral', icon: 'alert', meaning: 'Marked experimental or "not ready for production" in the docs. Don\'t put it on a critical path.' },
  deprecated: { label: 'Deprecated', color: 'ink', icon: 'x', meaning: 'Marked deprecated. It still works, but plan the migration now.' },
  changed: { label: 'Changed recently', color: 'sky', icon: 'bolt', meaning: 'Observable behavior changed between 1.75.0 and 1.76.0 (verified by the labs). Re-test on upgrade.' },
};

export const STABILITY: Record<string, Entry> = {
  agent: { name: 'Agent · generate / stream', status: 'stable', note: 'Core API, no beta marker.', href: DOCS + 'agents/overview.mdx#L12', source: 'docs: agents/overview' },
  tools: { name: 'Tools', status: 'stable', note: 'Core API.', href: DOCS + 'agents/tools.mdx', source: 'docs: agents/tools' },
  'tool-concurrency': { name: 'toolCallConcurrency (default 10)', status: 'stable', note: 'Default 10; tools in one step run concurrently.', href: SRC + 'packages/core/src/loop/workflows/agentic-execution/tool-call-concurrency.ts#L15', source: 'source: tool-call-concurrency.ts L15' },
  processors: { name: 'Processors', status: 'stable', note: 'Input / output / step hooks and tripwires.', href: DOCS + 'agents/processors.mdx', source: 'docs: agents/processors' },
  'processor-caching': { name: 'Processor response caching', status: 'beta', note: 'Marked beta in the docs.', href: DOCS + 'agents/processors.mdx#L498', source: 'docs: agents/processors L498' },
  memory: { name: 'Memory (history, semantic recall, working memory)', status: 'stable', note: 'No beta marker. The memory system does not enforce access control.', href: DOCS + 'memory/overview.mdx#L14', source: 'docs: memory/overview' },
  'last-messages': { name: 'lastMessages', status: 'deprecated', note: '@deprecated in favor of messageHistory (token budget). Still the default (10).', href: SRC + 'packages/core/src/memory/types.ts#L1011', source: 'source: memory/types.ts L1011' },
  'wm-state-signals': { name: 'Working memory as state signals', status: 'experimental', note: '"Opt in to state signals (experimental)".', href: DOCS + 'memory/working-memory.mdx#L441', source: 'docs: memory/working-memory L441' },
  'observational-memory': { name: 'Observational memory', status: 'stable', since: '@mastra/memory 1.1.0', note: 'Newer feature; its resource scope is deprecated.', href: DOCS + 'memory/observational-memory.mdx#L14', source: 'docs: memory/observational-memory L14' },
  workflows: { name: 'Workflows (default engine)', status: 'stable', note: 'Core API: steps, suspend/resume, snapshots.', href: DOCS + 'workflows/overview.mdx#L11', source: 'docs: workflows/overview' },
  'workflow-recovery': { name: "recovery.workflows: 'auto'", status: 'stable', note: "On by default. No ownership claim.", href: SRC + 'packages/core/src/mastra/index.ts#L711', source: 'source: mastra/index.ts L711' },
  'dynamic-workflows': { name: 'Dynamic workflows', status: 'beta', note: 'Marked beta in the docs.', href: DOCS + 'workflows/dynamic-workflows.mdx#L10', source: 'docs: workflows/dynamic-workflows L10' },
  'temporal-runner': { name: '@mastra/temporal runner', status: 'experimental', note: '"experimental and not ready for production use".', href: DOCS + 'deployment/workflow-runners.mdx#L22', source: 'docs: deployment/workflow-runners L22' },
  workers: { name: 'Workers', status: 'beta', note: 'Marked beta in the docs.', href: DOCS + 'deployment/workers.mdx#L18', source: 'docs: deployment/workers L18' },
  signals: { name: 'Signals', status: 'stable', since: '@mastra/core 1.39.0', note: 'No beta marker; relatively new.', href: DOCS + 'harness/signals.mdx#L12', source: 'docs: harness/signals L12' },
  notifications: { name: 'Notification signals', status: 'changed', since: '@mastra/core 1.39.0', note: 'Since 1.76.0 a pending summary is drained into the woken run\'s first request (one model call instead of two), and tag attributes are sorted.', href: LABS + 'expected-output/core-1.75.0/m06-notifications.txt', source: 'lab output, 1.75.0 vs 1.76.0' },
  'signal-providers': { name: 'Signal providers', status: 'stable', since: '@mastra/core 1.42.0', note: 'Newer API.', href: DOCS + 'harness/signal-providers.mdx#L10', source: 'docs: harness/signal-providers L10' },
  'cross-agent': { name: 'Cross-agent communication (Mastra Code)', status: 'experimental', note: '"experimental and off by default".', href: DOCS + 'harness/signals.mdx#L373', source: 'docs: harness/signals L373' },
  'durable-agents': { name: 'Durable agents', status: 'beta', since: '@mastra/core 1.45.0', note: 'Marked beta ("breaking changes may occur without a major version bump"). The signals page calls durable and evented agents "experimental".', href: DOCS + 'harness/durable-agents.mdx#L11', source: 'docs: harness/durable-agents L11-13' },
  'run-claims': { name: 'Run claims + fencing', status: 'changed', since: '@mastra/core 1.76.0', note: '1.75.0 had no distributed claim; 1.76.0 claims every run (renew 10 s, lapse 30 s).', href: DOCS + 'harness/durable-agents.mdx#L370', source: 'docs: harness/durable-agents L370' },
  subagents: { name: 'Subagents (supervisor agents)', status: 'stable', since: '@mastra/core 1.8.0', note: 'The recommended multi-agent API. Subagents get the full parent context by default.', href: DOCS + 'subagents.mdx#L11', source: 'docs: subagents L11' },
  networks: { name: 'Agent networks (.network())', status: 'deprecated', note: '"deprecated and will be removed in a future major release". Migrate to supervisor agents.', href: DOCS + 'agents/networks.mdx#L12', source: 'docs: agents/networks L12' },
  'thread-ownership': { name: 'claimThreadOwnership / discoverThreadPeers', status: 'experimental', note: 'Public methods on Agent with no page in the docs. The cross-agent feature built on them is "experimental and off by default" in Mastra Code.', href: SRC + 'packages/core/src/agent/agent.ts#L9005', source: 'source: agent.ts L9005; docs: harness/signals L373' },
  'distributed-pubsub': { name: 'Redis / Valkey Streams PubSub', status: 'beta', note: 'The docs recommend them for multi-instance deployments, but both packages are pre-1.0 on npm (@mastra/redis-streams 0.6.3, @mastra/valkey-streams 0.5.5 on 2026-10-11). Pin exact versions.', href: DOCS + 'server/pubsub.mdx#L76', source: 'docs: server/pubsub L76; npm' },
  'background-tasks': { name: 'Background tasks', status: 'stable', since: '@mastra/core 1.29.0', note: 'Newer API.', href: DOCS + 'harness/background-tasks.mdx#L11', source: 'docs: harness/background-tasks L11' },
  goals: { name: 'Goals', status: 'stable', since: '@mastra/core 1.43.0', note: 'Newer API.', href: DOCS + 'harness/goals.mdx#L11', source: 'docs: harness/goals L11' },
  schedules: { name: 'Schedules', status: 'stable', since: '@mastra/core 1.50.0', note: 'Newer API.', href: DOCS + 'harness/schedules.mdx#L11', source: 'docs: harness/schedules L11' },
  scorers: { name: 'Scorers / evals', status: 'stable', note: 'Core API.', href: DOCS + 'evals/overview.mdx#L9', source: 'docs: evals/overview' },
  datasets: { name: 'Datasets & experiments', status: 'stable', since: '@mastra/core 1.4.0', note: 'Newer API.', href: DOCS + 'evals/datasets.mdx#L10', source: 'docs: evals/datasets L10' },
  tracing: { name: 'Tracing (@mastra/observability)', status: 'changed', note: 'Stable API, but the span tree changed in 1.76.0 (a new built-in request-processor span). Assert on spans you care about, not counts.', href: LABS + 'expected-output/core-1.75.0/m09-observe.txt', source: 'lab output, 1.75.0 vs 1.76.0' },
  'server-responses': { name: 'Server Responses / Conversations APIs', status: 'experimental', note: '"These APIs are currently experimental."', href: DOCS + 'server/overview.mdx#L78', source: 'docs: server/overview L78' },
};
