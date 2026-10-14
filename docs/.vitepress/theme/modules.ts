// One source of truth for module identity: title, hook, time estimate, group, built pages and signature color.
// Used by the sidebar/prev-next (config), OG images (build), the landing curriculum and the cheat cards.
export type ModuleInfo = {
  n: string; title: string; short: string; hook: string; minutes: number;
  group: 'Foundations' | 'Primitives' | 'Capstone';
  pages: ('lesson' | 'lab' | 'break-it' | 'quiz')[];
  color: string; colorDark: string;
};
export const MODULES: ModuleInfo[] = [
  { n: '00', title: 'Setup and reading the codebase', short: 'Setup', hook: 'Run every lab, pin Mastra to the course commit, and learn to read a large TypeScript monorepo.', minutes: 25, group: 'Foundations', pages: ['lesson'], color: '#4b5568', colorDark: '#a9b4c8' },
  { n: '01', title: 'First principles before Mastra', short: 'First principles', hook: 'Build a loop, a journal and a mailbox by hand in about 190 lines of Node.', minutes: 45, group: 'Foundations', pages: ['lesson', 'lab', 'break-it', 'quiz'], color: '#4338ca', colorDark: '#a5a8ff' },
  { n: '02', title: 'The agent loop', short: 'Agent loop', hook: 'Fifteen things happen between agent.stream() and finish. Two will page you.', minutes: 40, group: 'Foundations', pages: ['lesson', 'lab', 'break-it', 'quiz'], color: '#6d28d9', colorDark: '#bda4ff' },
  { n: '03', title: 'Processors', short: 'Processors', hook: 'Redaction, guardrails, budgets and retries through one interface with ten hooks.', minutes: 35, group: 'Foundations', pages: ['lesson', 'lab', 'break-it', 'quiz'], color: '#a21caf', colorDark: '#f19aff' },
  { n: '04', title: 'Memory', short: 'Memory', hook: 'What reaches the model on every request, and what quietly falls out of it.', minutes: 40, group: 'Primitives', pages: ['lesson', 'lab'], color: '#be123c', colorDark: '#ff9bb1' },
  { n: '05', title: 'Workflows', short: 'Workflows', hook: 'A known shape written down as data: suspend, resume on another machine, replay.', minutes: 40, group: 'Primitives', pages: ['lesson', 'lab'], color: '#c2410c', colorDark: '#ffaa75' },
  { n: '06', title: 'Signals and notifications', short: 'Signals', hook: 'A mailbox for an agent that stays on while the world keeps happening.', minutes: 40, group: 'Primitives', pages: ['lesson', 'lab'], color: '#a15c07', colorDark: '#f5c451' },
  { n: '07', title: 'Durability', short: 'Durability', hook: 'kill -9 a real process and find out exactly what comes back.', minutes: 45, group: 'Primitives', pages: ['lesson', 'lab'], color: '#15803d', colorDark: '#74df91' },
  { n: '08', title: 'Multi-agent coordination', short: 'Multi-agent', hook: 'Four shapes behind one word, told apart by what the agents share.', minutes: 40, group: 'Primitives', pages: ['lesson', 'lab'], color: '#0f766e', colorDark: '#56dccb' },
  { n: '09', title: 'Evals and observability', short: 'Evals', hook: 'Turn agent behavior into data you can read, grade and replay.', minutes: 35, group: 'Primitives', pages: ['lesson', 'lab'], color: '#0369a1', colorDark: '#72c7ff' },
  { n: '10', title: 'Design a primitive', short: 'Capstone', hook: 'Prove a gap with a failing test, borrow from prior art, write the RFC.', minutes: 120, group: 'Capstone', pages: ['lesson'], color: '#1d4ed8', colorDark: '#95b4ff' },
];
export const PAGE_LABEL = { lesson: 'Lesson', lab: 'Lab', 'break-it': 'Break it', quiz: 'Quiz' } as const;
export const pageLink = (n: string, p: keyof typeof PAGE_LABEL) => (p === 'lesson' ? `/m${n}/` : `/m${n}/${p}`);
export const moduleOf = (relativePath: string) => relativePath.match(/^m(\d\d)\//)?.[1] ?? null;
export const TOTAL_MINUTES = MODULES.reduce((s, m) => s + m.minutes, 0);
export const VERIFIED = { core: '1.77.0', sha: 'f88217d19b63d362ff97723c1a339fbf89a1bbb0', date: '2026-10-14' };
