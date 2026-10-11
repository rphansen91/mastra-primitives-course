// Solution 6.1. Keep deciders pure and side-effect free: Mastra calls decide() at receipt time
// AND again at delivery time for deferred/summarized records (see delivery-policy.ts).
export const decide = ({ record }: { record: { source: string; priority: string }; threadState: 'active' | 'idle' }) => {
  if (record.source === 'spam') return 'discard' as const;
  if (record.source === 'calendar') return 'deliver' as const;
  if (record.source === 'chat' && record.priority === 'low') return 'persist' as const;
  return undefined;
};
