// Solution 3.1: buffer across chunks in per-run `state`.
// Strategy: append each delta to a buffer; redact complete secrets; hold back any suffix that
// could still grow into a secret ("s", "sk", "sk-ab..."); emit the rest. When the text block
// ends, flush the held tail (redacted) as one more delta. The processor contract is
// "one chunk in, at most one chunk out", so the flush rides on the text-end chunk: we return the
// tail as a text-delta IN PLACE OF text-end. The final text is right, but that text block has no
// text-end chunk on the stream. (Verified on @mastra/core 1.75.0 and 1.76.0; see the lesson's
// "where it falls down": processors cannot emit extra non-data chunks. A capstone candidate.)
// Trade-off: you add latency equal to the held-back suffix. That is the price of correctness.
export const SECRET = /sk-[a-z0-9]+/g;
const MAYBE_SECRET_SUFFIX = /(?:^|[^a-z0-9-])(s|sk|sk-[a-z0-9]*)$/;

export function split(buf: string): { emit: string; hold: string } {
  const m = buf.match(MAYBE_SECRET_SUFFIX);
  const cut = m ? buf.length - m[1]!.length : buf.length;
  return { emit: buf.slice(0, cut).replace(SECRET, '[REDACTED]'), hold: buf.slice(cut) };
}

export const redactor = {
  id: 'secret-redactor',
  processOutputStream: async ({ part, state }: any) => {
    if (part.type === 'text-delta') {
      const { emit, hold } = split(((state.buf as string) ?? '') + part.payload.text);
      state.buf = hold;
      return { ...part, payload: { ...part.payload, text: emit } };
    }
    if (part.type === 'text-end' && state.buf) {
      const tail = (state.buf as string).replace(SECRET, '[REDACTED]');
      state.buf = '';
      return { ...part, type: 'text-delta', payload: { ...part.payload, text: tail } };
    }
    return part;
  },
};
