// Lab 9.1 — observe the course: traces, scorers (rule and LLM-judge), a scorer-driven loop,
// and record/replay. No API keys: every model here is scripted.
import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { InMemoryStore } from '@mastra/core/storage';
import { createScorer, runEvals } from '@mastra/core/evals';
import { Observability, TestExporter } from '@mastra/observability';
import { z } from 'zod';
import { scriptedModel, summarizePrompt, banner } from '../shared/mock-model.ts';
import { ciAgent, ciScript, check_ci } from './ci-agent.ts';
import { record, replay } from './recorder.ts';
import { load } from '../shared/target.ts';

export async function traceTree() {
  const exporter = new TestExporter();
  const { agent } = ciAgent();
  const mastra = new Mastra({ agents: { agent }, storage: new InMemoryStore(), logger: false, observability: new Observability({ configs: { course: { serviceName: 'course', exporters: [exporter] } } }) } as any);
  const res = await mastra.getAgent('agent').generate('Why did CI fail on PR 42?');
  await new Promise((r) => setTimeout(r, 200));
  const spans: any[] = exporter.getCompletedSpans();
  const byParent = new Map<string | undefined, any[]>();
  for (const s of spans) byParent.set(s.parentSpanId, [...(byParent.get(s.parentSpanId) ?? []), s]);
  const lines: string[] = [];
  const walk = (parent: string | undefined, depth: number) => {
    for (const s of (byParent.get(parent) ?? []).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))) {
      if (s.type !== 'model_chunk') lines.push(`${'  '.repeat(depth)}${s.type.padEnd(16)} ${s.name}`);
      walk(s.id, depth + 1);
    }
  };
  walk(undefined, 0);
  return { text: res.text, lines, types: [...new Set(spans.map((s) => s.type))].sort() };
}

export async function ruleScorer() {
  const { mentionsReason } = await load(import.meta.dirname, 'ex1-mentions-reason.ts');
  const answers: Record<string, string> = {
    'Why did CI fail?': 'CI failed on PR 42: lint error in auth.ts.',
    'Is CI green?': 'No. PR 42 is red.',
    'What broke the build?': 'A lint error in auth.ts broke it.',
  };
  const agent = new Agent({ id: 'variants', name: 'variants', instructions: 'Check CI first.', tools: { check_ci },
    model: scriptedModel((_i, prompt) => { const q = Object.keys(answers).find((k) => JSON.stringify(prompt).includes(k))!; return JSON.stringify(prompt).includes('tool-result') ? { text: answers[q]! } : { toolCalls: [{ name: 'check_ci', args: { pr: 42 } }] }; }).model as any });
  new Mastra({ agents: { agent }, storage: new InMemoryStore(), logger: false } as any);
  const perItem: string[] = [];
  const res: any = await runEvals({ target: agent, data: Object.keys(answers).map((input) => ({ input })), scorers: [mentionsReason],
    onItemComplete: ({ item, scorerResults }: any) => { perItem.push(`${item.input.padEnd(24)} → ${scorerResults['mentions-reason'].score} (${scorerResults['mentions-reason'].reason})`); } } as any);
  return { average: res.scores['mentions-reason'], perItem };
}

export async function judgeScorer() {
  const judge = scriptedModel(() => ({ text: JSON.stringify({ grounded: false, unsupported: ['the build uses Rust'] }) }));
  const grounded = createScorer({ id: 'grounded', description: 'Is every claim supported by the tool result?', judge: { model: judge.model as any, instructions: 'You are a strict grader.' } })
    .analyze({ description: 'List unsupported claims', outputSchema: z.object({ grounded: z.boolean(), unsupported: z.array(z.string()) }),
      createPrompt: ({ run }: any) => `Tool result: ${run.input.toolResult}\nAnswer: ${run.output.text}\nWhich claims in the answer are not supported by the tool result?` })
    .generateScore(({ results }: any) => (results.analyzeStepResult.grounded ? 1 : 0))
    .generateReason(({ results }: any) => `unsupported: ${results.analyzeStepResult.unsupported.join(', ')}`);
  const r: any = await grounded.run({ input: { toolResult: '{"status":"failed","reason":"lint error in auth.ts"}' }, output: { text: 'CI failed because the build uses Rust.' } } as any);
  return { score: r.score, reason: r.reason, judgeSaw: summarizePrompt(judge.prompts[0]!).map((l) => l.slice(0, 120)) };
}

export async function completionLoop() {
  const m = scriptedModel((i) => ({ text: i < 2 ? `Draft ${i + 1}: Mastra is a TypeScript agent framework.` : ' Mastra is a TypeScript agent framework [1].' }));
  const agent = new Agent({ id: 'writer', name: 'writer', instructions: 'Write with citations.', model: m.model as any });
  new Mastra({ agents: { agent }, storage: new InMemoryStore(), logger: false } as any);
  const citations = createScorer({ id: 'citations', description: 'Has a [n] citation' }).generateScore(async ({ run }: any) => (JSON.stringify(run.output).includes('[1]') ? 1 : 0));
  const r: any = await agent.generate('One sentence about Mastra, with a citation.', { isTaskComplete: { scorers: [citations], strategy: 'all' }, maxSteps: 6 } as any);
  const feedback = summarizePrompt(m.prompts[1]!).at(-1)!;
  return { modelCalls: m.prompts.length, text: r.text, feedback: feedback.replace(/Duration: \d+ms /, '').slice(0, 100) };
}

export async function recordReplay() {
  const tapeRun = record(ciScript());
  const a1 = new Agent({ id: 'rec', name: 'rec', instructions: 'You help developers understand CI failures. Always check CI first.', model: tapeRun.model as any, tools: { check_ci } });
  new Mastra({ agents: { a1 }, storage: new InMemoryStore(), logger: false } as any);
  const recorded = (await a1.generate('Why did CI fail on PR 42?')).text;
  const play = (instructions: string) => {
    const r = replay(tapeRun.tape);
    const a = new Agent({ id: 'rep', name: 'rep', instructions, model: r.model as any, tools: { check_ci } });
    new Mastra({ agents: { a }, storage: new InMemoryStore(), logger: false } as any);
    return a.generate('Why did CI fail on PR 42?').then((x) => ({ text: x.text, misses: r.misses }));
  };
  const same = await play('You help developers understand CI failures. Always check CI first.');
  const changed = await play('You help developers understand CI failures. Be brief.');
  return { tape: tapeRun.tape.map((t) => `${t.hash} → ${t.step.toolCalls ? 'tool ' + t.step.toolCalls[0]!.name : 'text'}`), recorded, same, changed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = await traceTree();
  banner('1) The trace of one agent run (model_chunk spans hidden)');
  t.lines.forEach((l) => console.log('  ' + l));
  const s = await ruleScorer();
  banner('2) Rule-based scorer over a 3-item dataset (runEvals)');
  s.perItem.forEach((l) => console.log('  ' + l));
  console.log('  average:', s.average);
  const j = await judgeScorer();
  banner('3) LLM-judge scorer (the judge is a mock model too)');
  console.log('  score:', j.score, '|', j.reason);
  j.judgeSaw.forEach((l) => console.log('  judge saw: ' + l));
  const c = await completionLoop();
  banner('4) isTaskComplete: a scorer keeps the loop going');
  console.log('  model calls:', c.modelCalls);
  console.log('  feedback the model saw:', c.feedback);
  console.log('  result.text:', c.text);
  const r = await recordReplay();
  banner('5) Record once, replay deterministically, catch prompt drift');
  r.tape.forEach((l) => console.log('  tape ' + l));
  console.log('  replay, same code:     ', r.same.text, '| misses:', r.same.misses.length);
  console.log('  replay, new instructions:', r.changed.misses);
  process.exit(0);
}
