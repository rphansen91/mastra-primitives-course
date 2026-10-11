// Exercise 8.1 solution: carry a hop count in the signal's attributes and refuse to relay past
// a budget. The guard lives in code (the tool), not in the prompt: a model can't be trusted to stop.
export type Hop = { hops: number };
export const MAX_HOPS = 3;

export function nextHop(incoming: Hop): Hop | null {
  if (incoming.hops >= MAX_HOPS) return null;
  return { hops: incoming.hops + 1 };
}
