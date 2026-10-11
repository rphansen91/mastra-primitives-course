// Exercise 5.1: the manager gets the approval email twice. Why?
// Hint: when a run resumes, which part of this function runs again?
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
      notifyManager(`Approve refund of $${inputData.amount} for ${inputData.orderId}?`);
      if (!resumeData) return suspend({ ask: `Refund $${inputData.amount}?` });
      return { ...inputData, approved: resumeData.approved };
    },
  });
}
