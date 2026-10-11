// Lab 1.2 — Durability from first principles: journals, idempotency keys, fencing tokens.
// Everything here is in-memory so you can read it in one sitting; swap the Maps for a database
// and you have the core of Temporal/Restate/DBOS/Inngest-style durable execution.

// ---------------------------------------------------------------------------
// 1. The journal: memoize each side effect under a STABLE key.
//    On replay (after a crash), completed entries are returned instead of re-executed.
// ---------------------------------------------------------------------------
export class Journal {
  entries = new Map<string, unknown>();
  has(key: string) {
    return this.entries.has(key);
  }
  get(key: string) {
    return this.entries.get(key);
  }
  set(key: string, value: unknown) {
    this.entries.set(key, structuredClone(value));
  }
}

export class Crash extends Error {
  constructor(where: string) {
    super(`crash at ${where}`);
  }
}

/** The durable context handed to user code. `run(key, fn)` is the whole trick. */
export class DurableContext {
  executed: string[] = [];
  replayed: string[] = [];
  constructor(
    readonly runId: string,
    readonly journal: Journal,
    private crashAfter?: string,
  ) {}

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const k = `${this.runId}:${key}`;
    if (this.journal.has(k)) {
      this.replayed.push(key);
      return this.journal.get(k) as T;
    }
    const value = await fn();
    this.executed.push(key);
    // The at-least-once window: the effect happened, but the journal write did not.
    // `crashAfter` simulates kill -9 exactly here, so the replay must run `fn` again.
    if (this.crashAfter === key) throw new Crash(key);
    this.journal.set(k, value);
    return value;
  }
}

/** Run `body` to completion, "restarting the process" each time it crashes. */
export async function runDurably<T>(runId: string, journal: Journal, body: (ctx: DurableContext) => Promise<T>, crashes: string[] = []) {
  const attempts: { executed: string[]; replayed: string[] }[] = [];
  for (let attempt = 0; ; attempt++) {
    const ctx = new DurableContext(runId, journal, crashes[attempt]);
    try {
      const result = await body(ctx);
      attempts.push({ executed: ctx.executed, replayed: ctx.replayed });
      return { result, attempts };
    } catch (e) {
      attempts.push({ executed: ctx.executed, replayed: ctx.replayed });
      if (!(e instanceof Crash)) throw e;
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Idempotency keys: the effect itself must tolerate being asked twice.
//    The journal cannot cover the window between "effect happened" and "journal written".
// ---------------------------------------------------------------------------
export class FakePaymentsApi {
  charges: { amount: number; key?: string }[] = [];
  #seen = new Map<string, { chargeId: number }>();
  async charge(amount: number, idempotencyKey?: string) {
    if (idempotencyKey && this.#seen.has(idempotencyKey)) return this.#seen.get(idempotencyKey)!;
    this.charges.push({ amount, key: idempotencyKey });
    const res = { chargeId: this.charges.length };
    if (idempotencyKey) this.#seen.set(idempotencyKey, res);
    return res;
  }
}

// ---------------------------------------------------------------------------
// 3. Leases + fencing tokens: "only one worker owns this run" must hold even when
//    a paused worker wakes up after its lease expired.
// ---------------------------------------------------------------------------
export class LeaseStore {
  #holder?: { owner: string; expiresAt: number; token: number };
  #nextToken = 1;
  constructor(private now: () => number = Date.now) {}
  acquire(owner: string, ttlMs: number): { token: number } | undefined {
    const h = this.#holder;
    if (h && h.expiresAt > this.now() && h.owner !== owner) return undefined;
    this.#holder = { owner, expiresAt: this.now() + ttlMs, token: this.#nextToken++ };
    return { token: this.#holder.token };
  }
}

export interface FencedStore {
  write(key: string, value: string, token: number): void;
  read(key: string): string | undefined;
}

// Events vs requests: a request expects a reply now; an event (signal) is a fact delivered
// to a mailbox and consumed at the receiver's next safe point. See loop-from-scratch.ts SignalQueue.
