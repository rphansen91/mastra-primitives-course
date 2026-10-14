// Phase 1 (child process): start a durable agent run and a workflow run. The driver kill -9s us mid-tool/mid-step.
import { RequestContext } from '@mastra/core/request-context';
import { build, log } from './common.ts';
const { durable, wf } = build();
const run = await wf.createRun({ runId: 'wf-run-1' });
void run.start({ inputData: {} }).then((r: any) => log(`WF finished status=${r.status}`));
// Durable-agent tool contexts on 1.75.0 through 1.77.0 carry toolCallId but not runId (regular agents carry both),
// so we also put the run id in the request context, which is serialized into the snapshot.
const requestContext = new RequestContext();
requestContext.set('runId', 'agent-run-1');
const res: any = await durable.stream('charge and deploy', { runId: 'agent-run-1', requestContext } as any);
for await (const c of res.fullStream) if (c.type === 'text-delta') log(`AGENT text: ${c.payload.text}`);
log('AGENT stream ended (should not happen when killed)');
