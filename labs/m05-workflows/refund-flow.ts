// Lab 5 — shared setup: a 4-step refund workflow, fetch → approve (suspend) → apply → notify.
// Every step appends "<pid> <event>" to a log file, so we can see what ran in which process.
import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Mastra } from '@mastra/core/mastra';
import { z } from 'zod';
import { load } from '../shared/target.ts';

export const DIR = process.env.WF_DIR ?? join(import.meta.dirname, '.crash', 'm05');
export const LOG = () => join(DIR, 'events.log');
export const record = (event: string) => { mkdirSync(DIR, { recursive: true }); appendFileSync(LOG(), `${process.pid} ${event}\n`); };
export const events = (): { pid: string; event: string }[] =>
  existsSync(LOG()) ? readFileSync(LOG(), 'utf8').trim().split('\n').filter(Boolean).map((l) => { const [pid, ...r] = l.split(' '); return { pid: pid!, event: r.join(' ') }; }) : [];

const Order = z.object({ orderId: z.string(), amount: z.number() });
const Decided = Order.extend({ approved: z.boolean() });

// Careful: a workflow has a .then() method (the builder), so `await`ing one makes JavaScript treat it
// as a promise and hang forever. Async helpers must wrap it: return { workflow }.
export async function buildRefundWorkflow() {
  const { createApproveStep } = await load(import.meta.dirname, 'ex1-approve-step.ts');
  const fetchOrder = createStep({
    id: 'fetch', inputSchema: z.object({ orderId: z.string() }), outputSchema: Order,
    execute: async ({ inputData }) => { record('fetch'); return { orderId: inputData.orderId, amount: 49 }; },
  });
  const approve = createApproveStep({ Order, Decided, notifyManager: (text: string) => record(`EMAIL manager: ${text}`) });
  const apply = createStep({
    id: 'apply', inputSchema: Decided, outputSchema: Decided.extend({ refunded: z.boolean() }),
    execute: async ({ inputData }) => {
      if (!inputData.approved) { record('apply skipped (rejected)'); return { ...inputData, refunded: false }; }
      record(`apply refund $${inputData.amount}`); return { ...inputData, refunded: true };
    },
  });
  const notify = createStep({
    id: 'notify', inputSchema: z.any(), outputSchema: z.object({ message: z.string() }),
    execute: async ({ inputData }) => { const message = inputData.refunded ? `Refunded $${inputData.amount}` : 'Refund declined'; record(`notify customer: ${message}`); return { message }; },
  });
  const workflow = createWorkflow({ id: 'refund', inputSchema: z.object({ orderId: z.string() }), outputSchema: z.object({ message: z.string() }) })
    .then(fetchOrder).then(approve).then(apply).then(notify).commit();
  return { workflow };
}

export async function makeMastra(storage: any) {
  const { workflow: refund } = await buildRefundWorkflow();
  return new Mastra({ workflows: { refund }, storage, logger: false } as any);
}
