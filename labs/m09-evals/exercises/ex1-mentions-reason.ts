// Exercise 9.1: a rule-based scorer. "Does the answer mention the failure reason?"
// It passes on a plain text answer but scores 0 on answers that came after a tool call. Why?
import { createScorer } from '@mastra/core/evals';

export const mentionsReason = createScorer({ id: 'mentions-reason', description: 'The answer names the CI failure reason', type: 'agent' })
  .preprocess(({ run }: any) => {
    const text: string = run.output[0]?.content?.parts?.[0]?.text ?? '';
    return { text };
  })
  .generateScore(({ results }: any) => (/lint error/i.test(results.preprocessStepResult.text) ? 1 : 0))
  .generateReason(({ score }: any) => (score ? 'names the failure reason' : 'does not name the failure reason'));
