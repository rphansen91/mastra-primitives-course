// Solution 7.1: runId + toolCallId.
// - runId is stable across recovery (the recovered run keeps its id).
// - toolCallId comes from the persisted LLM response: the checkpoint is at the tool-call step
//   boundary, so recovery replays the SAME tool call (same id); it does not re-ask the model.
// Not stable: Date.now(), a random UUID, a per-process counter. Too coarse: the input alone
// (two legitimate deploys with the same args would be merged).
//
// Version note (verified on @mastra/core 1.75.0): a regular Agent's tool context has
// ctx.runId and ctx.agent.toolCallId; a DurableAgent's tool context has ctx.toolCallId and
// no runId. phase-run.ts therefore also puts the run id in the RequestContext, which the
// durable snapshot persists and recovery restores. That asymmetry is itself a finding:
// "an idempotency key on every tool call" is a capstone candidate primitive.
export function deployKey(_input: unknown, ctx: any): string | undefined {
  const toolCallId = ctx?.agent?.toolCallId ?? ctx?.toolCallId;
  const runId = ctx?.runId ?? ctx?.requestContext?.get?.('runId');
  if (!runId || !toolCallId) return undefined;
  return `${runId}:${toolCallId}`;
}
