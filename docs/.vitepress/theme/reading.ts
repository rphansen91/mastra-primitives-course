// Books, founder quotes and further reading. One source of truth for every quote on the site.
// Rules (see /reading): quotes are verbatim and short, attributed and linked; at most one founder
// quote per module; book quotes cite chapter title + edition (+ printed page for Principles).
// `npm run check:quotes` (scripts/check-quotes.mjs) fails if a rendered quote differs from this file.

export type BookId = 'principles' | 'patterns' | 'modular';
export const BOOKS: Record<BookId, { title: string; short: string; author: string; edition: string; href: string; note: string }> = {
  principles: {
    title: 'Principles of Building AI Agents',
    short: 'Principles',
    author: 'Sam Bhagwat',
    edition: '3rd ed., Aug 2026',
    href: 'https://mastra.ai/books/principles-of-building-ai-agents',
    note: 'Free from mastra.ai (email signup). 20 chapters in 8 parts. Page numbers are printed page numbers in the 3rd edition; the web table of contents uses a different layout, so cite by chapter title.',
  },
  patterns: {
    title: 'Patterns for Building AI Agents',
    short: 'Patterns',
    author: 'Sam Bhagwat with Michelle Gienow',
    edition: '2025',
    href: 'https://mastra.ai/books/patterns-of-building-ai-agents',
    note: 'Free from mastra.ai (email signup). Cited here by chapter title only; quotes come from the foreword excerpt Mastra published.',
  },
  modular: {
    title: 'Modular: The Web\'s New Architecture',
    short: 'Modular',
    author: 'Sam Bhagwat',
    edition: '2022',
    href: 'https://www.gatsbyjs.com/modular-webs-new-architecture-book/',
    note: 'Free ebook from Gatsby. Web architecture, not agents: background on how architectural change is sequenced inside an organization.',
  },
};

export const PEOPLE = {
  sam: { name: 'Sam Bhagwat', role: 'Mastra co-founder and CEO' },
  shane: { name: 'Shane Thomas', role: 'Mastra co-founder and CPO' },
  abhi: { name: 'Abhi Aiyer', role: 'Mastra co-founder and CTO' },
} as const;
export type PersonId = keyof typeof PEOPLE;

export type Quote =
  | { kind: 'book'; text: string; book: BookId; chapter: string; section?: string; page?: string }
  | { kind: 'founder'; text: string; who: PersonId; source: string; href: string; date: string };

const P = 'principles' as const;
export const QUOTES: Record<string, Quote> = {
  // Principles of Building AI Agents, 3rd ed. (verified against the official PDF; printed pages)
  'p-foreword': { kind: 'book', book: P, chapter: 'Foreword', page: 'x', text: "AI engineering is just a new domain, like data engineering a few years ago, or DevOps before that. It's not impossibly complex." },
  'p-spectrum': { kind: 'book', book: P, chapter: 'ch. 4, "Agents"', section: 'Levels of Autonomy', page: '13', text: 'Agency is a spectrum. Like self-driving cars, the issue is less how smart the system is, than how much you need your hands on the wheel.' },
  'p-describe': { kind: 'book', book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents"', page: '18', text: 'You should describe both what it does and when to call it.' },
  'p-unbounded': { kind: 'book', book: P, chapter: 'ch. 12, "Metrics"', page: '71', text: 'An agent request does however much work it decides to do.' },
  'p-invoice': { kind: 'book', book: P, chapter: 'ch. 12, "Metrics"', section: 'Calls to Act', page: '73', text: 'A cap you evaluate at the end is an invoice, not a limit.' },
  'p-two-strikes': { kind: 'book', book: P, chapter: 'ch. 12, "Metrics"', section: 'Calls to Act', page: '73', text: 'If the same tool fails twice with the same error, escalate or stop.' },
  'p-not-exclusive': { kind: 'book', book: P, chapter: 'ch. 9, "Workflows"', page: '43', text: "In practice, workflows and agents aren't mutually exclusive." },
  'p-perimeter': { kind: 'book', book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents"', section: 'Agent authentication and authorization', page: '25', text: "middleware is the typical place to put any agent authorization because it's in the perimeter around the agent rather than within the agent's inner loop." },
  'p-cache-tradeoff': { kind: 'book', book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents"', section: 'Memory processors', page: '21', text: 'both can erase benefits from prompt caching if used uncritically.' },
  'p-prefix': { kind: 'book', book: P, chapter: 'ch. 3, "Writing Great Prompts"', page: '9', text: 'it depends on the prefix remaining 100% unchanged across prompts.' },
  'p-no-else': { kind: 'book', book: P, chapter: 'ch. 9, "Workflows"', section: 'Branching', page: '49', text: "they aren't exclusive, and there's no implicit else." },
  'p-one-call': { kind: 'book', book: P, chapter: 'ch. 9, "Workflows"', section: 'Best practices', page: '50', text: "you can't meaningfully trace, cache, or retry a step that makes multiple calls." },
  'p-claw': { kind: 'book', book: P, chapter: 'ch. 16, "Harnesses & Claws"', page: '92', text: 'A claw is a harness with initiative.' },
  'p-control': { kind: 'book', book: P, chapter: 'ch. 16, "Harnesses & Claws"', page: '92', text: 'And with control, you can queue work while the agents are running, steer an agent mid-task, interrupt, or grant per-tool approval.' },
  'p-idempotent': { kind: 'book', book: P, chapter: 'ch. 16, "Harnesses & Claws"', page: '92', text: 'a retry is only safe if the operation is idempotent' },
  'p-split': { kind: 'book', book: P, chapter: 'ch. 8, "Subagents"', page: '38', text: 'The reason to split work is not so much tidiness, but context.' },
  'p-isolated': { kind: 'book', book: P, chapter: 'ch. 8, "Subagents"', page: '39', text: "An isolated subagent has a clean context window, and none of the parent's history." },
  'p-successes': { kind: 'book', book: P, chapter: 'ch. 12, "Metrics"', section: 'Latency and Streaming', page: '73', text: 'The key measurement should be successes, not calls.' },
  'p-judges': { kind: 'book', book: P, chapter: 'ch. 14, "Evals"', section: 'LLM-as-judge for textual evals', page: '83', text: "judges tend to prefer longer answers even when they're not better." },
  'p-new-primitives': { kind: 'book', book: P, chapter: 'ch. 20, "What\'s Next"', page: '105', text: 'they need new primitives in terms of steerability, persisting intermediate outputs, or keeping a human in the loop but not being blocked' },
  'p-beginners': { kind: 'book', book: P, chapter: 'ch. 20, "What\'s Next"', page: '106', text: "In a field where the ground shifts constantly, we're all perpetual beginners." },
  // Patterns for Building AI Agents (foreword excerpt published by Mastra)
  'pat-demo': { kind: 'book', book: 'patterns', chapter: 'Foreword', text: 'Most AI teams can build an impressive demo. Far fewer can ship a reliable system.' },
  'pat-pragmatic': { kind: 'book', book: 'patterns', chapter: 'Foreword', text: 'Principles are conceptual, patterns are pragmatic.' },

  // Founders (verbatim from the linked public source)
  'f-typescript': { kind: 'founder', who: 'sam', source: 'A framework for the next million AI developers', href: 'https://mastra.ai/blog/the-next-million-ai-developers', date: 'Nov 20, 2024', text: 'Typescript-first, Typescript-only. Typescript is the language of product development.' },
  'f-web-2012': { kind: 'founder', who: 'sam', source: 'AI engineering, two years later', href: 'https://mastra.ai/blog/ai-engineering', date: 'Nov 11, 2024', text: 'Building AI applications today feels a bit like web development in 2012 - the primitives are powerful, but frameworks and best practices are still emerging.' },
  'f-indirection': { kind: 'founder', who: 'sam', source: 'A framework for the next million AI developers', href: 'https://mastra.ai/blog/the-next-million-ai-developers', date: 'Nov 20, 2024', text: 'These indirections speed up the "aha!" moment but are notoriously difficult to debug.' },
  'f-surface': { kind: 'founder', who: 'sam', source: 'A framework for the next million AI developers', href: 'https://mastra.ai/blog/the-next-million-ai-developers', date: 'Nov 20, 2024', text: 'But more API surface area is a liability, not an asset.' },
  'f-teammates': { kind: 'founder', who: 'shane', source: 'HITL: Ask Before Acting', href: 'https://mastra.ai/blog/tool-approval', date: 'Oct 28, 2025', text: 'Good agents, like good teammates, know when they need input' },
  'f-durable-record': { kind: 'founder', who: 'sam', source: 'What are durable AI agents?', href: 'https://mastra.ai/blog/what-are-durable-ai-agents', date: 'Jun 30, 2026', text: 'a long-running agent is simply a durable record that short-lived processes take turns with.' },
  'f-flawed': { kind: 'founder', who: 'abhi', source: 'The evolution of AgentNetwork', href: 'https://mastra.ai/blog/agent-network', date: 'Oct 10, 2025', text: 'The initial approach was straightforward but flawed.' },
  'f-evals-tests': { kind: 'founder', who: 'sam', source: 'AI engineering, two years later', href: 'https://mastra.ai/blog/ai-engineering', date: 'Nov 11, 2024', text: 'Repeat three times after me. Evals are just tests. Evals are just tests. Evals are just tests.' },
  'f-concrete-nouns': { kind: 'founder', who: 'sam', source: 'A framework for the next million AI developers', href: 'https://mastra.ai/blog/the-next-million-ai-developers', date: 'Nov 20, 2024', text: 'We prefer concrete nouns ("workflow", "step", "connection") to abstract nouns ("graph", "node", "edge") or adjectives ("runnable").' },
  'f-ai-ops': { kind: 'founder', who: 'abhi', source: 'Baby steps towards AI Ops', href: 'https://mastra.ai/blog/ai-ops', date: 'Jan 30, 2025', text: "How much do we know about what's required to do good AI Ops today? I'll be very honest, very little." },
};

export function citeLabel(q: Quote): string {
  if (q.kind === 'founder') return `${PEOPLE[q.who].name}, "${q.source}" (${q.date})`;
  const b = BOOKS[q.book];
  return [`${b.title}${q.book === 'principles' ? `, ${b.edition.replace(', Aug 2026', '')}` : ''}`, q.chapter, q.section ? `"${q.section}"` : '', q.page ? `p. ${q.page}` : ''].filter(Boolean).join(', ');
}
export function citeHref(q: Quote): string {
  return q.kind === 'founder' ? q.href : BOOKS[q.book].href;
}

// Further reading, per module. Book entries cite chapters; essays link the public posts.
export type Reading = {
  books: { book: BookId; chapter: string; why: string }[];
  essays: { who: PersonId; title: string; href: string; date: string; why: string }[];
  outside?: { title: string; href: string; why: string }[];
};
const E = {
  nextMillion: { title: 'A framework for the next million AI developers', href: 'https://mastra.ai/blog/the-next-million-ai-developers', date: 'Nov 2024' },
  aiEng: { title: 'AI engineering, two years later', href: 'https://mastra.ai/blog/ai-engineering', date: 'Nov 2024' },
  naming: { title: 'Solving the hardest problem in CS with LLMs', href: 'https://mastra.ai/blog/solving-the-hardest-problem-in-cs', date: 'Feb 2025' },
  hitl: { title: 'HITL: Ask Before Acting', href: 'https://mastra.ai/blog/tool-approval', date: 'Oct 2025' },
  excalidraw: { title: 'From Whiteboard to Excalidraw', href: 'https://mastra.ai/blog/whiteboard-to-excalidraw-converter', date: 'Feb 2025' },
  durable: { title: 'What are durable AI agents?', href: 'https://mastra.ai/blog/what-are-durable-ai-agents', date: 'Jun 2026' },
  network: { title: 'The evolution of AgentNetwork', href: 'https://mastra.ai/blog/agent-network', date: 'Oct 2025' },
  aiOps: { title: 'Baby steps towards AI Ops', href: 'https://mastra.ai/blog/ai-ops', date: 'Jan 2025' },
  nlEndpoints: { title: 'Every API needs a natural language endpoint', href: 'https://mastra.ai/blog/api-endpoints', date: 'Jan 2025' },
};
export const READING: Record<string, Reading> = {
  '00': {
    books: [{ book: P, chapter: 'Foreword and Introduction', why: 'The premise this course shares: AI engineering is a learnable domain, not a mystery.' }],
    essays: [{ who: 'sam', ...E.nextMillion, why: 'The design principles behind the codebase you are about to read: TypeScript-only, few objects, concrete nouns, no hidden indirection.' }],
  },
  '01': {
    books: [
      { book: P, chapter: 'ch. 4, "Agents" (Levels of Autonomy)', why: 'The LLM → agent → harness → claw ladder. Place your 190-line loop on it.' },
      { book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents"', why: 'Tool design: describe what a tool does and when to call it.' },
      { book: 'patterns', chapter: 'ch. 1, "From Wishlist to Working Agent"', why: 'From a capability list to an agent architecture.' },
    ],
    essays: [{ who: 'sam', ...E.aiEng, why: 'Levels of autonomy, and why evals are tests.' }],
  },
  '02': {
    books: [
      { book: P, chapter: 'ch. 12, "Metrics" (Calls to Act)', why: 'Step caps, spend caps checked before each step, and the two-strikes rule: the reasoning behind `maxSteps`, `stopWhen` and Exercise 2.1.' },
      { book: P, chapter: 'ch. 15, "Local Development & Deployment" (The core agent loop)', why: 'Where each primitive runs in production.' },
    ],
    essays: [{ who: 'sam', ...E.nextMillion, why: '"Explicit, no indirection": why the loop is something you can read.' }],
  },
  '03': {
    books: [
      { book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents" (Agent middleware)', why: 'Guardrails and authorization belong at the perimeter. The book calls it middleware; Mastra calls it processors.' },
      { book: 'patterns', chapter: 'ch. 4, "Autonomy Is a Two-Edged Sword"', why: 'The lethal trifecta, sandboxing and agent guardrails: design targets for your processors.' },
    ],
    essays: [{ who: 'shane', ...E.hitl, why: 'Tool approval as product design.' }],
    outside: [{ title: 'Simon Willison, "The lethal trifecta for AI agents" (2025)', href: 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/', why: 'Private data + untrusted content + external communication. A processor can cut one leg.' }],
  },
  '04': {
    books: [
      { book: P, chapter: 'ch. 5, "Tool Calling, Memory, and Dynamic Agents" (Agent Memory, Observational memory, Memory processors)', why: 'Three memory types, and the pruning vs prompt-caching tradeoff.' },
      { book: P, chapter: 'ch. 3, "Writing Great Prompts"', why: 'Why prompt caching needs an unchanged prefix.' },
      { book: P, chapter: 'ch. 11, "Retrieval-Augmented Generation (RAG)" (Alternatives to RAG)', why: 'Try an agent with tools before building a retrieval pipeline.' },
      { book: 'patterns', chapter: 'ch. 2, "Intro to Context Engineering"', why: 'Context failure modes and compression.' },
    ],
    essays: [],
  },
  '05': {
    books: [
      { book: P, chapter: 'ch. 9, "Workflows"', why: 'Branching without an implicit else, one model call per step, suspend/resume and the `approved === undefined` check.' },
      { book: 'patterns', chapter: 'ch. 1, "From Wishlist to Working Agent" (human-in-the-loop)', why: 'Where approvals belong.' },
    ],
    essays: [{ who: 'shane', ...E.excalidraw, why: 'A one-shot prompt decomposed into validated steps, with the failures along the way.' }],
  },
  '06': {
    books: [
      { book: P, chapter: 'ch. 16, "Harnesses & Claws"', why: 'Agents that wake on schedules, subscribe to inboxes and can be steered: the use case for signals.' },
      { book: P, chapter: 'ch. 20, "What\'s Next"', why: 'Keeping a human in the loop without blocking on them.' },
    ],
    essays: [{ who: 'shane', title: 'Custom signal providers (post on X)', href: 'https://x.com/smthomas3/status/2075313016585740739', date: 'Jul 2026', why: 'The announcement of custom signal providers, which Lab 6.3 builds.' }],
  },
  '07': {
    books: [
      { book: P, chapter: 'ch. 16, "Harnesses & Claws"', why: 'Record progress as you go, because a replay won\'t follow the same path, and retries need idempotency.' },
      { book: P, chapter: 'ch. 9, "Workflows" (Suspend and Resume)', why: 'Suspended state must live in a durable store.' },
    ],
    essays: [{ who: 'sam', ...E.durable, why: 'Turn-level, step-level and mid-step persistence, and what a checkpoint holds.' }],
  },
  '08': {
    books: [
      { book: P, chapter: 'ch. 8, "Subagents"', why: 'Split work for context, not tidiness. Isolated vs forked subagents (and see the note on Mastra\'s default).' },
      { book: 'patterns', chapter: 'ch. 2, "Intro to Context Engineering"', why: 'Parallelize carefully; share context between subagents.' },
    ],
    essays: [{ who: 'abhi', ...E.network, why: 'History: how AgentNetwork became `.network()`. Today `.network()` is deprecated in favor of supervisor agents.' }],
  },
  '09': {
    books: [
      { book: P, chapter: 'ch. 12, "Metrics"; ch. 13, "Tracing"; ch. 14, "Evals"', why: 'Cost per resolved task, percentiles, judge bias, offline vs online evals.' },
      { book: 'patterns', chapter: 'ch. 3, "From MVP to Production"', why: 'Failure modes × business metrics, labeled data, datasets from production.' },
    ],
    essays: [
      { who: 'sam', ...E.aiEng, why: '"Evals are just tests", and what is different about them.' },
      { who: 'abhi', ...E.aiOps, why: 'Operating non-deterministic systems: rollbacks, drift, on-call.' },
    ],
  },
  '10': {
    books: [
      { book: P, chapter: 'ch. 20, "What\'s Next"', why: 'Long-horizon work needs new primitives: steerability, persisted intermediate outputs, non-blocking humans.' },
      { book: 'modular', chapter: 'whole book (background)', why: 'How architectural change gets sequenced in an organization. About the web, not agents.' },
    ],
    essays: [
      { who: 'sam', ...E.nextMillion, why: 'A design rubric in Mastra\'s own words: object-sparse, concrete nouns, explicit.' },
      { who: 'sam', ...E.naming, why: 'API naming.' },
      { who: 'abhi', ...E.network, why: 'How a primitive evolves, and gets deprecated.' },
    ],
  },
  adopting: {
    books: [
      { book: 'patterns', chapter: 'ch. 3, "From MVP to Production" and ch. 4, "Autonomy Is a Two-Edged Sword"', why: 'The prototype-to-production gap and security.' },
      { book: P, chapter: 'ch. 15, "Local Development & Deployment"', why: 'Deployment considerations per primitive.' },
      { book: 'modular', chapter: 'whole book (background)', why: 'Sequencing an architecture change, buy vs build.' },
    ],
    essays: [
      { who: 'abhi', ...E.aiOps, why: 'An ops view of agents.' },
      { who: 'shane', ...E.nlEndpoints, why: 'Prototype first, then harden.' },
    ],
  },
};
