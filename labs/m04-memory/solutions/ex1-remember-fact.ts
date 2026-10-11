// Exercise 4.1 solution: serialize read-modify-write per resource.
// This works within one process. Across processes you need the store to do it atomically
// (a transaction, a compare-and-set on a version column) or a lease, which is the trade-off.
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parseFacts, renderFacts } from '../facts.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chains = new Map<string, Promise<unknown>>();
function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  chains.set(key, next.catch(() => {}));
  return next;
}

export function createRememberFactTool() {
  return createTool({
    id: 'remember_fact',
    description: 'Save one durable fact about the user to resource-scoped working memory.',
    inputSchema: z.object({ key: z.string(), value: z.string() }),
    execute: async ({ key, value }, ctx: any) => {
      const { threadId, resourceId } = ctx.agent;
      return serialize(resourceId, async () => {
        const facts = parseFacts(await ctx.memory.getWorkingMemory({ threadId, resourceId }));
        await sleep(25);
        facts[key] = value;
        await ctx.memory.updateWorkingMemory({ threadId, resourceId, workingMemory: renderFacts(facts) });
        return { saved: key };
      });
    },
  });
}
