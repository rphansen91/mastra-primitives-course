// Solution 2.1: a stopWhen predicate over the step history.
// Tool-call chunks in Mastra carry { toolName, args } inside `payload` (or at top level in AI-SDK shape),
// so normalize defensively.
export function stopOnRepeat(n = 3) {
  return ({ steps }: { steps: any[] }) => {
    const calls = steps
      .flatMap(s => s.toolCalls ?? [])
      .map((c: any) => {
        const p = c.payload ?? c;
        return `${p.toolName}:${JSON.stringify(p.args ?? p.input)}`;
      });
    if (calls.length < n) return false;
    const tail = calls.slice(-n);
    return tail.every(c => c === tail[0]);
  };
}
