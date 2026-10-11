// Solution 2.2: two valid fixes, shown together.
//  (a) agent-level: serialize tool calls for this agent (toolCallConcurrency: 1)
//  (b) tool-level: make the effect atomic (here: a per-db promise-chain mutex).
// Prefer (b): the tool is then safe no matter who calls it (another agent, a workflow, a retry).
export const agentOptions: Record<string, unknown> = { toolCallConcurrency: 1 };

const locks = new WeakMap<object, Promise<unknown>>();
export function makeReserveSeat(db: { seatsLeft: number }) {
  return async () => {
    const prev = locks.get(db) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>(r => (release = r));
    locks.set(db, prev.then(() => mine));
    await prev;
    try {
      const left = db.seatsLeft;
      await new Promise(r => setTimeout(r, 20));
      db.seatsLeft = left - 1;
      return { seatsLeft: db.seatsLeft };
    } finally {
      release();
    }
  };
}
