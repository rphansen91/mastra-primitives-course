// Lab 5.1 — suspend, cross-process resume, snapshot inspection, and the double-resume race.
import { spawn } from 'node:child_process';
import { rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LibSQLStore } from '@mastra/libsql';
import { InMemoryStore } from '@mastra/core/storage';
import { banner } from '../shared/mock-model.ts';
import { DIR, events, makeMastra } from './refund-flow.ts';

function resumeInChild(runId: string, approved = true) {
  return new Promise<any>((res, rej) => {
    const p = spawn(process.execPath, ['--import', 'tsx', join(import.meta.dirname, 'phase-resume.ts')], { env: { ...process.env, WF_DIR: DIR, RUN_ID: runId, APPROVED: String(approved) }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = ''; p.stdout.on('data', (d) => (out += d));
    p.on('exit', (code) => (code === 0 ? res(JSON.parse(out.trim().split('\n').at(-1)!)) : rej(new Error('child failed ' + code))));
  });
}

export async function runSuspendResume() {
  rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true });
  const storage = new LibSQLStore({ id: 'm05', url: `file:${join(DIR, 'wf.db')}` });
  const mastra = await makeMastra(storage);
  const run = await mastra.getWorkflow('refund').createRun();
  const started: any = await run.start({ inputData: { orderId: 'order-1042' } });
  const wf: any = await storage.getStore('workflows');
  const snap: any = await wf.loadWorkflowSnapshot({ workflowName: 'refund', runId: run.runId });
  const snapshot = { status: snap.status, suspendedPaths: snap.suspendedPaths, stepResults: Object.keys(snap.context).filter((k) => k !== 'input'), suspendPayload: snap.context.approve?.suspendPayload };
  const resumed = await resumeInChild(run.runId, true);
  const ev = events();
  const pids = [...new Set(ev.map((e) => e.pid))];
  const byProcess = pids.map((pid, i) => ({ process: i === 0 ? 'starter' : 'resumer', events: ev.filter((e) => e.pid === pid).map((e) => e.event) }));

  // Double resume, in memory: two callers race to approve the same run.
  const mem = await makeMastra(new InMemoryStore());
  const w = mem.getWorkflow('refund');
  const r = await w.createRun();
  await r.start({ inputData: { orderId: 'order-7' } });
  const race = await Promise.allSettled([1, 2].map(async () => (await w.createRun({ runId: r.runId })).resume({ step: 'approve', resumeData: { approved: true } })));
  const raceOut = race.map((x: any) => (x.status === 'fulfilled' ? `won → ${x.value.status}` : `lost → ${x.reason.message}`));
  return { startedStatus: started.status, suspendPayload: started.suspendPayload ?? started.suspended, snapshot, resumed, byProcess, raceOut };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runSuspendResume();
  banner('1) Start: fetch → approve suspends');
  console.log('status:', r.startedStatus);
  banner('2) The snapshot on disk while suspended');
  console.log(r.snapshot);
  banner('3) A NEW process resumes with { approved: true }');
  console.log('result:', r.resumed);
  for (const p of r.byProcess) console.log(`${p.process.padEnd(8)}:`, p.events);
  banner('4) Two callers resume the same run at once');
  r.raceOut.forEach((x) => console.log('  ' + x));
  process.exit(0);
}
