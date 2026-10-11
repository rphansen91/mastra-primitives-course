// Exercise 1.3 (break-it): a lease without fencing.
// Worker A takes the lease, then stalls (GC pause, laptop sleep, slow network). The lease expires,
// worker B takes it and writes. A wakes up and writes its stale result over B's.
// TODO: reject any write whose fencing token is lower than the highest token seen for that key.
import type { FencedStore } from '../durability.ts';

export class Store implements FencedStore {
  data = new Map<string, string>();
  write(key: string, value: string, _token: number) {
    this.data.set(key, value); // BROKEN: last writer wins, even if it no longer owns the run
  }
  read(key: string) {
    return this.data.get(key);
  }
}
