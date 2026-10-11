// Exercise 3.1 (break-it): a streaming secret redactor that only looks at one chunk at a time.
// Models emit text in arbitrary deltas. "sk-abc123" can arrive as "sk-ab" + "c123", and a
// per-chunk regex leaks the tail. Worse, it can't see "s" + "k-abc123" at all.
// TODO: make it correct across chunk boundaries. Hint: keep a buffer in `state` (per run), only
// emit text that can no longer be part of a secret, and flush the rest on text-end/finish.
export const SECRET = /sk-[a-z0-9]+/g;

export const redactor = {
  id: 'secret-redactor',
  processOutputStream: async ({ part }: any) => {
    if (part.type !== 'text-delta') return part;
    // BROKEN: per-chunk only
    return { ...part, payload: { ...part.payload, text: part.payload.text.replace(SECRET, '[REDACTED]') } };
  },
};
