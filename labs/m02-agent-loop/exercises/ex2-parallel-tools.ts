// Exercise 2.2 (break-it): parallel tool calls + read-modify-write = lost update.
// The model books two seats in ONE step (two tool calls). Mastra runs tool calls of a step
// concurrently by default (toolCallConcurrency limit 10). The tool reads the counter, awaits,
// then writes: classic race.
// TODO: fix it WITHOUT changing the model script. Either serialize these tool calls via the
// agent's options, or make the tool itself safe under concurrency.
export const agentOptions: Record<string, unknown> = {};

export function makeReserveSeat(db: { seatsLeft: number }) {
  return async () => {
    const left = db.seatsLeft; // read
    await new Promise(r => setTimeout(r, 20)); // e.g. a network call
    db.seatsLeft = left - 1; // write (BROKEN: overwrites the concurrent call's write)
    return { seatsLeft: db.seatsLeft };
  };
}
