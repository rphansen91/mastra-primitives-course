// Exercise 1.1 (break-it): a model that calls the same tool with the same args forever.
// maxSteps is the only thing stopping it, and maxSteps is a budget, not a diagnosis.
// TODO: return a reason string ('loop-detected') once the last `n` tool calls are identical
// (same tool name AND same args). Otherwise return undefined.
import type { StopCondition } from '../loop-from-scratch.ts';

export function stopOnRepeat(_n = 3): StopCondition {
  return _steps => undefined; // BROKEN: never stops; the run burns the whole step budget
}
