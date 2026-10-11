// Lab 2.1 — Loop anatomy. Observe the agent loop from the outside (stream chunks)
// and from the inside (processor hooks + callbacks), with a scripted mock model.
// Model step 1 calls a tool, step 2 answers.
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { scriptedModel, summarizePrompt, banner } from '../shared/mock-model.ts';

export async function runAnatomy() {
  const log: string[] = [];
  const trace = (s: string) => log.push(s);

  const checkCI = createTool({
    id: 'check_ci',
    description: 'Check CI status for a PR',
    inputSchema: z.object({ pr: z.number() }),
    execute: async ({ pr }) => {
      trace(`tool.execute check_ci(pr=${pr})`);
      return { pr, status: 'failed', reason: 'docker hub 429' };
    },
  });

  const { model, prompts } = scriptedModel([
    { toolCalls: [{ name: 'check_ci', args: { pr: 42 } }] },
    { text: 'PR 42 failed on a Docker Hub 429; re-run later.' },
  ]);

  const agent = new Agent({
    id: 'loop-demo',
    name: 'loop-demo',
    instructions: 'You triage CI.',
    model: model as any,
    tools: { check_ci: checkCI },
    inputProcessors: [
      {
        id: 'in-logger',
        processInput: async ({ messages }: any) => {
          trace(`processInput (once) msgs=${messages.length}`);
          return messages;
        },
        processInputStep: async ({ stepNumber, messageList }: any) => {
          trace(`processInputStep step=${stepNumber} msgs=${messageList.get.all.db().length}`);
          return messageList;
        },
      } as any,
    ],
    outputProcessors: [
      {
        id: 'out-logger',
        processOutputStep: async ({ stepNumber, finishReason, toolCalls, messageList }: any) => {
          trace(`processOutputStep step=${stepNumber} finish=${finishReason} toolCalls=${toolCalls?.length ?? 0}`);
          return messageList.get.all.db();
        },
        processOutputResult: async ({ messages }: any) => {
          trace(`processOutputResult (once) msgs=${messages.length}`);
          return messages;
        },
      } as any,
    ],
  });

  const out = await agent.stream('Why is PR 42 red?', {
    maxSteps: 5,
    onStepFinish: (s: any) => trace(`onStepFinish finishReason=${s.finishReason}`),
    onIterationComplete: (ctx: any) => {
      trace(`onIterationComplete iteration=${ctx.iteration} isFinal=${ctx.isFinal}`);
      return undefined;
    },
  } as any);

  const chunkTypes: string[] = [];
  for await (const c of out.fullStream as any) {
    chunkTypes.push(c.type);
    if (c.type === 'step-finish' || c.type === 'tool-result' || c.type === 'finish') trace(`chunk ${c.type}`);
  }
  return {
    log,
    chunkTypes,
    prompts,
    text: await out.text,
    steps: (await out.steps).length,
    finishReason: await out.finishReason,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runAnatomy();
  banner('Hook / chunk order');
  r.log.forEach((l, i) => console.log(String(i + 1).padStart(2), l));
  banner('fullStream chunk types');
  console.log(r.chunkTypes.join(' → '));
  banner('Prompt sent on each model step');
  r.prompts.forEach((p, i) => {
    console.log(`-- doStream #${i + 1}`);
    summarizePrompt(p).forEach(l => console.log('   ' + l));
  });
  banner('Result');
  console.log('text:', r.text, '| steps:', r.steps, '| finishReason:', r.finishReason);
}
