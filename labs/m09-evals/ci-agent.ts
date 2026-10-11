// Lab 9 — the agent under observation: Module 2's CI helper. It checks CI with a tool, then answers.
// `answers` lets a test script how the final answer is phrased per question.
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { scriptedModel, type Script } from '../shared/mock-model.ts';

export const check_ci = createTool({
  id: 'check_ci', description: 'Check the CI status of a pull request',
  inputSchema: z.object({ pr: z.number() }),
  execute: async ({ pr }) => ({ pr, status: 'failed', reason: 'lint error in auth.ts' }),
});

/** Default script: call check_ci, then answer from the tool result. */
export const ciScript = (answer = 'CI failed on PR 42: lint error in auth.ts.'): Script => (_i, prompt) =>
  JSON.stringify(prompt).includes('tool-result') ? { text: answer } : { toolCalls: [{ name: 'check_ci', args: { pr: 42 } }] };

export function ciAgent(script: Script = ciScript(), id = 'ci-helper') {
  const m = scriptedModel(script);
  const agent = new Agent({ id, name: id, instructions: 'You help developers understand CI failures. Always check CI first.', model: m.model as any, tools: { check_ci } });
  return { agent, prompts: m.prompts };
}
