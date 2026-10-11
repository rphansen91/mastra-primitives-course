// Exercise 8.1: two helpful agents acknowledge each other's notices... forever.
// nextHop() decides whether a relay goes out and what it carries. Make the ping-pong stop.
export type Hop = { hops: number };

export function nextHop(incoming: Hop): Hop | null {
  return { hops: incoming.hops + 1 };
}
