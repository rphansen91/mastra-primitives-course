// Exercise 3.3 (break-it): an enrichment processor whose dependency is down.
// It adds CRM context to the prompt. When the CRM throws, the whole agent run fails:
// "Input processor error". For a guardrail that is right (fail closed). For an enrichment it is
// wrong: the user gets nothing because a nice-to-have was unavailable.
// TODO: make it fail OPEN: on error, record what happened (push to `errors`) and pass the
// messages through unchanged.
export function crmEnricher(fetchCrm: () => Promise<string>, errors: string[]) {
  return {
    id: 'crm-enricher',
    processInput: async ({ messages }: any) => {
      const ctx = await fetchCrm(); // BROKEN: throws straight through
      return [...messages, { role: 'user', content: { format: 2, parts: [{ type: 'text', text: `CRM: ${ctx}` }] }, createdAt: new Date(), id: 'crm' }];
    },
  };
}
