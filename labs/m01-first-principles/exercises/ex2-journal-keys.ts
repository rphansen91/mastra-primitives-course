// Exercise 1.2 (break-it): journal keys derived from a call COUNTER.
// The first attempt runs with flag=false and crashes; the replay runs with flag=true
// (a config/feature-flag change, a Date.now() branch, a different LLM answer...).
// With counter keys, the replay reads the wrong journal entry back.
// TODO: make `key()` stable and meaningful, so replay can never confuse two different effects.
import type { DurableContext } from '../durability.ts';

export function key(name: string, counter: number): string {
  return `step-${counter}`; // BROKEN: position-based, not identity-based
}

export async function workflow(ctx: DurableContext, flag: boolean) {
  let n = 0;
  const out: Record<string, unknown> = {};
  if (flag) out.orders = await ctx.run(key('getOrders', n++), async () => ['order-1', 'order-2']);
  out.user = await ctx.run(key('getUser', n++), async () => ({ id: 'u1' }));
  return out;
}
