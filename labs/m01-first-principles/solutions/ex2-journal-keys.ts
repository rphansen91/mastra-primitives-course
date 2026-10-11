// Solution 1.2: key by identity (step name), never by position.
// Real engines add the loop iteration / call site to the key for repeated calls,
// and detect "non-determinism" (the replay asked for a key the history doesn't have in that order).
import type { DurableContext } from '../durability.ts';

export function key(name: string, _counter: number): string {
  return name;
}

export async function workflow(ctx: DurableContext, flag: boolean) {
  let n = 0;
  const out: Record<string, unknown> = {};
  if (flag) out.orders = await ctx.run(key('getOrders', n++), async () => ['order-1', 'order-2']);
  out.user = await ctx.run(key('getUser', n++), async () => ({ id: 'u1' }));
  return out;
}
