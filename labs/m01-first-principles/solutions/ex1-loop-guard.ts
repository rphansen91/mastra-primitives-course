// Solution 1.1: detect n identical consecutive tool calls.
import type { StopCondition } from '../loop-from-scratch.ts';

export function stopOnRepeat(n = 3): StopCondition {
  return steps => {
    const calls = steps.flatMap(s => s.turn.toolCalls ?? []).map(c => `${c.name}:${JSON.stringify(c.args)}`);
    if (calls.length < n) return undefined;
    const tail = calls.slice(-n);
    return tail.every(c => c === tail[0]) ? 'loop-detected' : undefined;
  };
}
