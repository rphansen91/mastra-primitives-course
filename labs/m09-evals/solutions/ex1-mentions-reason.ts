// Exercise 9.1 solution: an agent's output is a list of messages, and each message is a list of
// parts. After a tool call the first part is a tool-invocation, not text. Read every text part.
import { createScorer } from '@mastra/core/evals';

export const mentionsReason = createScorer({ id: 'mentions-reason', description: 'The answer names the CI failure reason', type: 'agent' })
  .preprocess(({ run }: any) => {
    const text = (run.output ?? [])
      .filter((m: any) => m.role === 'assistant')
      .flatMap((m: any) => m.content?.parts ?? [])
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('\n');
    return { text };
  })
  .generateScore(({ results }: any) => (/lint error/i.test(results.preprocessStepResult.text) ? 1 : 0))
  .generateReason(({ score }: any) => (score ? 'names the failure reason' : 'does not name the failure reason'));
