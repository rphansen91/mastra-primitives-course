// Exercise 7.1 (break-it): the double deploy.
// Durable-agent recovery re-executes the tool call that was in flight when the process died.
// The deploy API supports idempotency keys, but the tool doesn't send one, so recovery deploys twice.
// TODO: return a key that is (a) identical when the SAME tool call is re-executed after a crash,
// and (b) different for a genuinely new call. Look at what the tool execution context gives you
// (ctx.runId, ctx.agent?.toolCallId, ...). Run `npm run lab:crash` and check the DEPLOY API lines.
export function deployKey(_input: unknown, _ctx: any): string | undefined {
  return undefined; // BROKEN: no key → the API can't tell a retry from a new deploy
}
