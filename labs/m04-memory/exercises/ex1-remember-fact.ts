// Exercise 4.1: two conversations with the same user each learn one fact at the same moment.
// Afterwards, working memory only has one of them. Find the race and fix it.
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parseFacts, renderFacts } from '../facts.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createRememberFactTool() {
  return createTool({
    id: 'remember_fact',
    description: 'Save one durable fact about the user to resource-scoped working memory.',
    inputSchema: z.object({ key: z.string(), value: z.string() }),
    execute: async ({ key, value }, ctx: any) => {
      const { threadId, resourceId } = ctx.agent;
      const current = await ctx.memory.getWorkingMemory({ threadId, resourceId });
      const facts = parseFacts(current);
      await sleep(25); // e.g. a call to normalize the value; any await opens the window
      facts[key] = value;
      await ctx.memory.updateWorkingMemory({ threadId, resourceId, workingMemory: renderFacts(facts) });
      return { saved: key };
    },
  });
}
