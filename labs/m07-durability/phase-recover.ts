// Phase 2 (fresh process, same LibSQL file): what is left, and what does recovery do?
import { build, log, counts, sleep, SLOW_MS } from './common.ts';
const { mastra, durable } = build();
const wfStore: any = await mastra.getStorage()!.getStore('workflows');
const runs = await wfStore.listWorkflowRuns({});
const persisted = runs.runs.map((r: any) => `${r.workflowName}/${r.runId}=${(typeof r.snapshot === 'string' ? JSON.parse(r.snapshot) : r.snapshot)?.status}`).sort();
const active = (await durable.listActiveRuns?.())?.runs?.map?.((r: any) => r.runId) ?? [];
log('--- recovery process start ---');
const wfRestart = mastra.restartAllActiveWorkflowRuns().then(() => log('WF restartAllActiveWorkflowRuns returned'));
const t0 = Date.now();
const attempts: any[] = [];
for (let i = 0; i < 14; i++) {
  const rec: any = await mastra.recoverAllDurableAgents();
  attempts.push({ t: Math.round((Date.now() - t0) / 1000), ...rec });
  if (rec.recovered > 0 || (i > 0 && rec.skipped === 0)) break;
  await sleep(5000);
}
await wfRestart;
// give the auto re-check + remaining LLM call + slow tool time to finish
const deadline = Date.now() + 60_000;
while (Date.now() < deadline && !counts()['LLM call (tool results so far: charge_card,slow_deploy)']) await sleep(500);
await sleep(SLOW_MS + 1000);
console.log(JSON.stringify({ persisted, active, attempts, counts: counts() }));
process.exit(0);
