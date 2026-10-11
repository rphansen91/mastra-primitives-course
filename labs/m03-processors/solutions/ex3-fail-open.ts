// Solution 3.3: fail open for enrichment, with a record of the failure (log/metric/span).
// Decide per processor: guardrails fail closed (abort), enrichers fail open.
export function crmEnricher(fetchCrm: () => Promise<string>, errors: string[]) {
  return {
    id: 'crm-enricher',
    processInput: async ({ messages }: any) => {
      let ctx: string;
      try {
        ctx = await fetchCrm();
      } catch (e) {
        errors.push(`crm-enricher: ${(e as Error).message}`);
        return messages;
      }
      return [...messages, { role: 'user', content: { format: 2, parts: [{ type: 'text', text: `CRM: ${ctx}` }] }, createdAt: new Date(), id: 'crm' }];
    },
  };
}
