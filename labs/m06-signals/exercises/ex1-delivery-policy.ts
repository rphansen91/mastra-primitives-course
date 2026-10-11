// Exercise 6.1: write a delivery policy (notifications.deliveryPolicy.decide).
// Requirements:
//   - calendar notifications are time-sensitive: always 'deliver' (interject even into an active run)
//   - low-priority chat chatter must never wake or interrupt: 'persist' (inbox only)
//   - anything from source 'spam': 'discard'
//   - everything else: fall back to Mastra's priority-aware default (return undefined)
// The starter returns undefined for everything, so calendar items get summarized while the
// agent is busy and spam reaches the model.
export const decide = (_input: { record: { source: string; priority: string }; threadState: 'active' | 'idle' }) => {
  return undefined as undefined | 'deliver' | 'persist' | 'discard' | 'summarize';
};
