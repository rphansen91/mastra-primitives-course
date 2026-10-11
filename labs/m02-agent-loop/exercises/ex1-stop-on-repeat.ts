// Exercise 2.1 (break-it): runaway loop in a real Mastra agent.
// The mock model calls `search` with the same query forever. The agent runs until maxSteps.
// TODO: implement a stopWhen condition. Mastra passes AI-SDK style `{ steps }`; each step has
// `toolCalls` (look at the shape in a debugger or console.log: toolName + input/args).
// Return true once the last `n` tool calls are identical.
export function stopOnRepeat(_n = 3) {
  return ({ steps }: { steps: any[] }) => false; // BROKEN: never stops
}
