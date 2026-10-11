// Phase B (child): a second "replica" boots while the first is still alive and runs boot recovery
// exactly like the deployer would: restart workflows and recover durable agents (concurrently).
import { build, log, sleep, SLOW_MS } from './common.ts';
const { mastra } = build();
log('--- second replica boots while first is alive ---');
const [, r] = await Promise.all([mastra.restartAllActiveWorkflowRuns(), mastra.recoverAllDurableAgents() as Promise<any>]);
log(`second replica recoverAllDurableAgents recovered=${r.recovered}`);
await sleep(SLOW_MS + 2000);
process.exit(0);
