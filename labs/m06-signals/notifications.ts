// Lab 6.2 — Notifications: a custom SignalProvider polls a fake event firehose, classifies each
// event into a priority, and calls notify(). The agent's delivery policy + the durable notification
// inbox decide deliver / summarize / persist. A dispatcher tick then emits a batched summary.
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { SignalProvider, type SignalSubscription } from '@mastra/core/signals';
import { createNotificationInboxTool, dispatchDueNotifications } from '@mastra/core/notifications';
import { scriptedModel, summarizePrompt, banner, sleep } from '../shared/mock-model.ts';

type FirehoseEvent = { id: string; source: 'github' | 'chat' | 'calendar'; repo?: string; text: string };
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

// Stand-in for an LLM/Classifier call: map an event to a notification priority.
export function classify(e: FirehoseEvent): Priority {
  if (/revert|prod down|rate limit/i.test(e.text)) return 'urgent';
  if (/review requested|mention/i.test(e.text)) return 'high';
  if (e.source === 'calendar') return 'medium';
  return 'low';
}

export class FirehoseSignals extends SignalProvider<'firehose'> {
  readonly id = 'firehose';
  readonly pollInterval = 100; // the framework calls poll() on this interval
  #cursor = 0;
  constructor(private firehose: FirehoseEvent[], private log: string[] = []) {
    super();
  }
  watch(target: { resourceId: string; threadId: string }, scope: string) {
    return this.subscribe(target, scope);
  }
  async poll(_subs: SignalSubscription[]) {
    const fresh = this.firehose.slice(this.#cursor);
    this.#cursor = this.firehose.length;
    for (const e of fresh) {
      for (const sub of this.getSubscriptionsForResource(`firehose:${e.source}`)) {
        const priority = classify(e);
        await this.notify(
          { source: e.source, kind: 'firehose-event', priority, summary: e.text, sourceId: e.id, dedupeKey: `firehose:${e.id}`, attributes: { repo: e.repo ?? null } } as any,
          { resourceId: sub.resourceId, threadId: sub.threadId },
        );
        this.log.push(`poll → notify ${e.id} [${priority}] "${e.text}"`);
      }
    }
  }
}

export async function runNotifications() {
  const firehose: FirehoseEvent[] = [];
  const pollLog: string[] = [];
  const storage = new InMemoryStore();
  const notificationsStore: any = (await storage.getStore('notifications'))!;
  const { model, prompts } = scriptedModel((_i, prompt) => {
    const last = JSON.stringify(prompt.at(-1));
    if (last.includes('notification-summary')) return { text: 'Noted the batched low-priority items.' };
    return { text: `Ack: ${last.slice(0, 60)}` };
  });
  const provider = new FirehoseSignals(firehose, pollLog);
  const decisions: string[] = [];
  const coordinator = new Agent({
    id: 'coordinator',
    name: 'coordinator',
    instructions: 'You are an always-on coordinator.',
    model: model as any,
    memory: new MockMemory({ storage }) as any,
    signals: [provider],
    tools: { inbox: createNotificationInboxTool({ storage: notificationsStore }) },
    notifications: {
      deliveryPolicy: {
        // Custom hook: return undefined to fall back to the priority-aware default.
        decide: ({ record, threadState }: any) => {
          decisions.push(`${record.sourceId} ${record.priority} thread=${threadState}`);
          return undefined;
        },
      },
    },
  } as any);
  const mastra = new Mastra({ agents: { coordinator }, storage, logger: false });
  const thread = { resourceId: 'user-1', threadId: 'coordinator-inbox' };
  for (const scope of ['github', 'chat', 'calendar']) provider.watch(thread, `firehose:${scope}`);

  firehose.push(
    { id: 'gh-1', source: 'github', repo: 'acme/api', text: 'Revert of your PR #123 merged' },
    { id: 'ch-1', source: 'chat', text: 'weekly leaderboard posted in #general' },
    { id: 'gh-2', source: 'github', repo: 'acme/docs', text: 'docs typo fix merged' },
    { id: 'cal-1', source: 'calendar', text: 'Planning meeting starts in 30 minutes' },
  );
  await sleep(1500);

  const recs = await notificationsStore.listNotifications({ threadId: thread.threadId });
  const records = recs.map((r: any) => ({ id: r.sourceId, priority: r.priority, status: r.status, reason: r.deliveryReason, summaryAt: !!r.summaryAt }));
  const res: any = await dispatchDueNotifications({ mastra, storage: notificationsStore, now: new Date(Date.now() + 60_000) } as any);
  const dispatch = {
    delivered: res.delivered.map((r: any) => `${r.sourceId}:${r.status}`),
    signals: res.signals.map((s: any) => `<${s.tagName}> ${String(s.contents)}`),
  };
  await sleep(800);
  const mem: any = await (await storage.getStore('memory'))!.listMessages({ threadId: thread.threadId, perPage: false } as any);
  const roles = (mem.messages ?? mem).map((m: any) => m.role + (m.role === 'signal' ? `(${m.type})` : ''));
  provider.stop();
  return { pollLog, decisions, records, dispatch, prompts, roles };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runNotifications();
  banner('Firehose emits 4 events; provider polls + classifies + notifies');
  r.pollLog.forEach(l => console.log('  ' + l));
  banner('Delivery decisions (policy input) and inbox records');
  r.decisions.forEach(d => console.log('  ' + d));
  for (const x of r.records) console.log(`  ${x.id.padEnd(6)} ${x.priority.padEnd(7)} status=${x.status.padEnd(9)} reason=${x.reason} summaryAt=${x.summaryAt ? 'set' : '-'}`);
  banner('Dispatcher tick (normally a cron workflow) emits due summaries');
  console.log('  delivered:', r.dispatch.delivered, 'signals:', r.dispatch.signals);
  banner('What the model saw (last message of each request)');
  r.prompts.forEach((p, i) => console.log(`  #${i + 1} (${p.length} msgs) ` + summarizePrompt(p).at(-1)));
  banner('Thread history persisted in memory (roles)');
  console.log('  ' + r.roles.join(', '));
  process.exit(0);
}
