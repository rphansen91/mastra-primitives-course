// Lab 7.1 — the crash lab driver. Runs two scenarios in child processes:
//  A) kill -9 mid-tool / mid-step, then a fresh process recovers
//  B) a second replica boots while the first is still alive (the plain-workflow double-run)
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { banner } from '../shared/mock-model.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function child(script: string, dir: string): ChildProcess {
  return spawn(process.execPath, ['--import', 'tsx', join(HERE, script)], {
    env: { ...process.env, CRASH_DIR: dir },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}
const lines = (dir: string) => (existsSync(join(dir, 'side-effects.log')) ? readFileSync(join(dir, 'side-effects.log'), 'utf8').trim().split('\n') : []);
async function waitFor(dir: string, pred: (ls: string[]) => boolean, ms = 30_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (pred(lines(dir))) return; await sleep(100); }
  throw new Error('timed out waiting for side effects: ' + lines(dir).join('\n'));
}
const collect = (p: ChildProcess) => new Promise<string>(res => { let s = ''; p.stdout!.on('data', d => (s += d)); p.on('exit', () => res(s)); });
const fresh = (dir: string) => { rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); return dir; };
const bothInFlight = (ls: string[]) => ls.some(l => l.includes('TOOL slow_deploy started')) && ls.some(l => l.includes('WF step slow-step started'));

export async function scenarioA() {
  const dir = fresh(join(HERE, '.crash', 'A'));
  const p1 = child('phase-run.ts', dir);
  await waitFor(dir, bothInFlight);
  p1.kill('SIGKILL');
  await new Promise(r => p1.on('exit', r));
  const p2 = child('phase-recover.ts', dir);
  const out = await collect(p2);
  const ledger = existsSync(join(dir, 'deploy-ledger.log')) ? readFileSync(join(dir, 'deploy-ledger.log'), 'utf8').trim().split('\n') : [];
  return { ...JSON.parse(out.trim().split('\n').at(-1)!), ledger };
}

export async function scenarioB() {
  const dir = fresh(join(HERE, '.crash', 'B'));
  const p1 = child('phase-run.ts', dir);
  await waitFor(dir, bothInFlight);
  const p2 = child('phase-replica.ts', dir);
  await collect(p2);
  p1.kill('SIGKILL');
  const c: Record<string, number> = {};
  const pids: Record<string, Set<string>> = {};
  for (const l of lines(dir)) {
    const [, pid, ...rest] = l.split(' ');
    const k = rest.join(' ');
    c[k] = (c[k] ?? 0) + 1;
    (pids[k] ??= new Set()).add(pid!);
  }
  return { counts: c, pidsPerEffect: Object.fromEntries(Object.entries(pids).map(([k, v]) => [k, v.size])) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2];
  if (!only || only === 'A') {
    banner('A) kill -9 mid-flight, then a fresh process recovers');
    const a = await scenarioA();
    console.log('persisted runs after crash:', a.persisted);
    console.log('active durable runs:', a.active);
    for (const x of a.attempts) console.log(`recoverAllDurableAgents t+${x.t}s`, JSON.stringify(x));
    console.log('side-effect counts:', a.counts);
    console.log('deploy API ledger (effects actually applied):', a.ledger);
  }
  if (!only || only === 'B') {
    banner('B) second replica boots while the first is alive');
    const b = await scenarioB();
    console.log('side-effect counts:', b.counts);
    console.log('distinct pids per effect:', b.pidsPerEffect);
  }
}
