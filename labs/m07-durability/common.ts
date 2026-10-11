// Lab 7 — shared setup: a durable agent + a plain 3-step workflow on a LibSQL *file* store,
// so a fresh process can see what a killed process left behind.
// Every side effect is appended to side-effects.log tagged with the pid.
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { createDurableAgent } from '@mastra/core/agent/durable';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { LibSQLStore } from '@mastra/libsql';
import { scriptedModel } from '../shared/mock-model.ts';
import { load } from '../shared/target.ts';

// Exercise 7.1 plugs in here: how the deploy tool derives its idempotency key.
const { deployKey } = await load<{ deployKey: (input: unknown, ctx: any) => string | undefined }>(dirname(fileURLToPath(import.meta.url)), 'ex1-idempotency-key.ts');

/** A fake external deploy API with a durable ledger. It dedupes on the idempotency key, like Stripe does. */
export const LEDGER = () => join(DIR, 'deploy-ledger.log');
function deployApi(key: string | undefined): 'applied' | 'deduped' {
  const seen = existsSync(LEDGER()) ? readFileSync(LEDGER(), 'utf8').split('\n') : [];
  if (key && seen.includes(`applied ${key}`)) return 'deduped';
  appendFileSync(LEDGER(), `applied ${key ?? '(no key)'}\n`);
  return 'applied';
}
export const ledgerApplied = () => (existsSync(LEDGER()) ? readFileSync(LEDGER(), 'utf8').trim().split('\n').filter(Boolean).length : 0);

export const DIR = process.env.CRASH_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '.crash');
mkdirSync(DIR, { recursive: true });
export const LOG = join(DIR, 'side-effects.log');
export const DB = join(DIR, 'crash.db');
export const SLOW_MS = Number(process.env.SLOW_MS ?? 4000);
export const log = (line: string) => appendFileSync(LOG, `${new Date().toISOString()} pid=${process.pid} ${line}\n`);
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export function counts(): Record<string, number> {
  const lines = existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean) : [];
  const c: Record<string, number> = {};
  for (const l of lines) {
    const k = l.split(' ').slice(2).join(' ');
    c[k] = (c[k] ?? 0) + 1;
  }
  return c;
}

// The model decides from the PROMPT (not from a call counter), so a fresh process
// that rebuilds the transcript from storage continues correctly.
function model() {
  return scriptedModel((_i, prompt) => {
    const done = prompt.filter((m: any) => m.role === 'tool').flatMap((m: any) => m.content).map((p: any) => p.toolName);
    log(`LLM call (tool results so far: ${done.join(',') || 'none'})`);
    if (!done.includes('charge_card')) return { toolCalls: [{ id: 'c1', name: 'charge_card', args: { cents: 500 } }] };
    if (!done.includes('slow_deploy')) return { toolCalls: [{ id: 'c2', name: 'slow_deploy', args: { env: 'prod' } }] };
    return { text: 'charged and deployed' };
  }).model;
}

export type BuildOptions = { idempotentCharge?: boolean };

export function build(opts: BuildOptions = {}) {
  const agent = new Agent({
    id: 'crash-agent',
    name: 'crash-agent',
    instructions: 'Charge then deploy.',
    model: model() as any,
    tools: {
      charge_card: {
        id: 'charge_card',
        description: 'charge',
        inputSchema: z.object({ cents: z.number() }),
        execute: async () => {
          log('TOOL charge_card executed');
          return { charged: true };
        },
      },
      slow_deploy: {
        id: 'slow_deploy',
        description: 'deploy',
        inputSchema: z.object({ env: z.string() }),
        execute: async (input: unknown, ctx: any) => {
          log('TOOL slow_deploy started');
          // The external effect happens FIRST, then we wait (rollout). A crash during the wait is
          // the at-least-once window: the effect happened but the tool result was never journaled.
          log(`DEPLOY API ${deployApi(deployKey(input, ctx))}`);
          await sleep(SLOW_MS);
          log('TOOL slow_deploy finished');
          return { deployed: true };
        },
      },
    } as any,
  });
  const durable = createDurableAgent({ agent } as any);

  const s1 = createStep({ id: 'send-email', inputSchema: z.object({}), outputSchema: z.object({ a: z.boolean() }),
    execute: async () => { log('WF step send-email executed'); return { a: true }; } });
  const s2 = createStep({ id: 'slow-step', inputSchema: z.object({ a: z.boolean() }), outputSchema: z.object({ b: z.boolean() }),
    execute: async () => { log('WF step slow-step started'); await sleep(SLOW_MS); log('WF step slow-step finished'); return { b: true }; } });
  const s3 = createStep({ id: 'final', inputSchema: z.object({ b: z.boolean() }), outputSchema: z.object({ ok: z.boolean() }),
    execute: async () => { log('WF step final executed'); return { ok: true }; } });
  const wf = createWorkflow({ id: 'crash-wf', inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean() }) })
    .then(s1).then(s2).then(s3).commit();

  const mastra = new Mastra({
    agents: { crashAgent: durable as any },
    workflows: { crashWf: wf },
    storage: new LibSQLStore({ id: 'crash', url: `file:${DB}` }),
    logger: false,
    recovery: { durableAgents: 'auto' },
  } as any);
  return { mastra, durable: durable as any, wf };
}
