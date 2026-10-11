// Lab 5, process 2: a brand-new process resumes the suspended run from the LibSQL file.
import { LibSQLStore } from '@mastra/libsql';
import { join } from 'node:path';
import { DIR, makeMastra } from './refund-flow.ts';

const mastra = await makeMastra(new LibSQLStore({ id: 'm05', url: `file:${join(DIR, 'wf.db')}` }));
const run = await mastra.getWorkflow('refund').createRun({ runId: process.env.RUN_ID! });
const res: any = await run.resume({ step: 'approve', resumeData: { approved: process.env.APPROVED !== 'false' } });
console.log(JSON.stringify({ status: res.status, result: res.result }));
process.exit(0);
