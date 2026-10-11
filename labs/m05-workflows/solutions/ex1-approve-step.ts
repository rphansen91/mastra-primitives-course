// Exercise 5.1 solution: everything before suspend() runs again on resume, so guard it.
import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

export function createApproveStep({ Order, Decided, notifyManager }: { Order: z.ZodTypeAny; Decided: z.ZodTypeAny; notifyManager: (text: string) => void }) {
  return createStep({
    id: 'approve',
    inputSchema: Order,
    outputSchema: Decided,
    suspendSchema: z.object({ ask: z.string() }),
    resumeSchema: z.object({ approved: z.boolean() }),
    execute: async ({ inputData, resumeData, suspend }: any) => {
      if (resumeData) return { ...inputData, approved: resumeData.approved };
      // First execution only: ask once, then park the run.
      notifyManager(`Approve refund of $${inputData.amount} for ${inputData.orderId}?`);
      return suspend({ ask: `Refund $${inputData.amount}?` });
    },
  });
}
