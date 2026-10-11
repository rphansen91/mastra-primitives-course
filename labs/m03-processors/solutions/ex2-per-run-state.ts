// Solution 3.2: use the per-run `state` the runner hands each processor.
// Rule of thumb from packages/core/AGENTS.md: non-serializable per-run state belongs in runScope
// (framework internals) or processor `state` (processor authors), never in module scope.
export const stepBudget = (max = 3) => ({
  id: 'step-budget',
  processInputStep: async ({ messageList, abort, state }: any) => {
    state.steps = ((state.steps as number) ?? 0) + 1;
    if ((state.steps as number) > max) abort(`step budget of ${max} exceeded`);
    return messageList;
  },
});
