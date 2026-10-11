// Solution 1.3: the storage layer enforces the fence (the worker can't be trusted to check itself).
import type { FencedStore } from '../durability.ts';

export class FenceConflict extends Error {}

export class Store implements FencedStore {
  data = new Map<string, string>();
  #highest = new Map<string, number>();
  write(key: string, value: string, token: number) {
    const hi = this.#highest.get(key) ?? 0;
    if (token < hi) throw new FenceConflict(`stale token ${token} < ${hi} for ${key}`);
    this.#highest.set(key, token);
    this.data.set(key, value);
  }
  read(key: string) {
    return this.data.get(key);
  }
}
