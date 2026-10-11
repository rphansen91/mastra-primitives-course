// Exercise 3.2 (break-it): per-run state stored at module scope.
// This processor enforces "at most 3 model steps per run" by counting processInputStep calls.
// The count lives in a closure shared by EVERY run of the agent, so the second run trips
// immediately. (In a server, it's shared across users too.)
// TODO: keep the counter per run. Processor methods receive a `state` object scoped to this
// processor for the current run; use it.
let steps = 0; // BROKEN: module scope = process scope

export const stepBudget = (max = 3) => ({
  id: 'step-budget',
  processInputStep: async ({ messageList, abort }: any) => {
    steps++;
    if (steps > max) abort(`step budget of ${max} exceeded`);
    return messageList;
  },
});
