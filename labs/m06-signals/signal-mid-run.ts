// Lab 6.1 — A signal delivered MID-RUN, then an idle thread WOKEN by a signal, then a persisted signal.
// Scenario: an agent is pushing branches; an ops notice ("we're being rate limited, stagger pushes")
// arrives while its tool is running. The signal must land in the very next model request.
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { agentThreadStreamRuntime } from '@mastra/core/agent/durable';
import { scriptedModel, summarizePrompt, banner, sleep } from '../shared/mock-model.ts';

export async function runSignalMidRun() {
  const thread = { resourceId: 'user-1', threadId: 'worker-main' };
  const out: Record<string, any> = {};
  let toolStarted!: () => void;
  const toolStartedP = new Promise<void>(r => (toolStarted = r));

  const pushBranch = createTool({
    id: 'push_branch',
    description: 'git push a branch',
    inputSchema: z.object({ branch: z.string() }),
    execute: async ({ branch }) => {
      toolStarted();
      await sleep(400);
      return { pushed: branch };
    },
  });

  const { model, prompts } = scriptedModel((i, prompt) => {
    const p = JSON.stringify(prompt);
    if (i === 0) return { toolCalls: [{ name: 'push_branch', args: { branch: 'feat/auth' } }] };
    if (p.includes('rate limited') && !p.includes('Staggering')) return { text: 'Staggering pushes: waiting 10 minutes between pushes.' };
    if (p.includes('CI recovered')) return { text: 'Resuming normal push cadence.' };
    return { text: 'ok' };
  });

  const agent = new Agent({
    id: 'worker',
    name: 'worker',
    instructions: 'You push code. Obey operational notices.',
    model: model as any,
    tools: { push_branch: pushBranch },
  });

  // Observe everything that happens on the thread, across runs.
  const sub: any = await agent.subscribeToThread(thread);
  const seen: string[] = [];
  const runsSeen = new Set<string>();
  void (async () => {
    for await (const c of sub.stream as any) {
      if (c.runId) runsSeen.add(c.runId);
      if (['data-signal', 'tool-call', 'tool-result', 'finish', 'text-delta'].includes(c.type))
        seen.push(
          `${c.runId?.slice(0, 8) ?? '--------'} ${c.type}` +
            (c.type === 'data-signal' ? ` <${c.data.tagName}> ${String(c.data.contents).slice(0, 50)}` : c.type === 'text-delta' ? ` "${c.payload.text}"` : ''),
        );
    }
  })();

  // 1) mid-run delivery
  const run1 = await agent.stream('Push feat/auth', { memory: { thread: thread.threadId, resource: thread.resourceId }, maxSteps: 5 } as any);
  await toolStartedP;
  out.stateWhileToolRuns = String(agentThreadStreamRuntime.getThreadState(thread));
  const r = agent.sendSignal(
    {
      type: 'notification',
      contents: "We're getting rate limited by GitHub, please stagger pushes.",
      attributes: { source: 'chat', channel: 'ops', author: 'oncall' },
    } as any,
    thread,
  );
  out.midRunAccepted = await r.accepted;
  out.run1Text = await run1.text;

  // 2) idle wake
  await sleep(50);
  out.stateAfterRun1 = String(agentThreadStreamRuntime.getThreadState(thread));
  const wake = agent.sendSignal({ type: 'notification', contents: 'CI recovered; Docker Hub healthy.', attributes: { source: 'github' } } as any, thread);
  const wokeAcc: any = await wake.accepted;
  out.wakeAction = wokeAcc.action;
  out.wokenText = wokeAcc.output ? await wokeAcc.output.text : undefined;

  // 3) persist without waking
  await sleep(50);
  const persisted = agent.sendSignal(
    { type: 'notification', contents: 'FYI: weekly leaderboard posted.', attributes: { source: 'chat' } } as any,
    { ...thread, ifIdle: { behavior: 'persist' } } as any,
  );
  out.persistAccepted = await persisted.accepted;
  out.persistedResolved = await (persisted as any).persisted.then(() => true, (e: any) => `rejected: ${e?.message}`);

  await sleep(100);
  sub.unsubscribe();
  return { ...out, prompts, seen, runsSeen: runsSeen.size, modelCalls: prompts.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runSignalMidRun();
  banner('1) Signal while push_branch is executing');
  console.log('thread state while tool runs:', r.stateWhileToolRuns);
  console.log('sendSignal accepted →', { action: r.midRunAccepted.action });
  console.log('run1 text:', r.run1Text);
  banner('2) Thread idle; signal WAKES a new run (default ifIdle: wake)');
  console.log('thread state:', r.stateAfterRun1);
  console.log('accepted →', r.wakeAction, '| woken run text:', r.wokenText);
  banner('3) ifIdle: persist');
  console.log('accepted →', r.persistAccepted, '| persisted resolves:', r.persistedResolved);
  banner('Prompts the model actually received');
  r.prompts.forEach((p: any, i: number) => {
    console.log(`-- doStream #${i + 1}`);
    summarizePrompt(p).forEach(l => console.log('   ' + l));
  });
  banner('Thread subscription view (runId chunk)');
  r.seen.forEach((s: string) => console.log('  ' + s.replace(/^[0-9a-f-]{8}/, 'run')));
  console.log('distinct runs observed on the thread:', r.runsSeen);
  process.exit(0);
}
