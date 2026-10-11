// Working memory is just Markdown. We keep it as "- key: value" lines.
export const TEMPLATE = '# About the user\n';
export function parseFacts(md: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of (md ?? '').split('\n')) {
    const m = /^- ([^:]+):\s*(.*)$/.exec(line.trim());
    if (m && m[2]) out[m[1]!] = m[2];
  }
  return out;
}
export const renderFacts = (f: Record<string, string>) => TEMPLATE + Object.entries(f).map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n';
