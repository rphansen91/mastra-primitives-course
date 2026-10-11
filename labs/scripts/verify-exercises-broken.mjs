// CI guard: the starter code in every exercises/ folder must actually exhibit its bug.
// Runs each break-it suite with LAB_TARGET=exercises and requires at least one failing test.
import { spawnSync } from 'node:child_process';

const suites = [
  'm01-first-principles/break-it.test.ts',
  'm02-agent-loop/break-it.test.ts',
  'm03-processors/break-it.test.ts',
  'm04-memory/break-it.test.ts',
  'm05-workflows/break-it.test.ts',
  'm06-signals/break-it.test.ts',
  'm07-durability/crash-lab.test.ts',
  'm08-multi-agent/break-it.test.ts',
  'm09-evals/break-it.test.ts',
];
let ok = true;
for (const s of suites) {
  const r = spawnSync(process.execPath, ['--import', 'tsx', '--test', s], { env: { ...process.env, LAB_TARGET: 'exercises' }, encoding: 'utf8' });
  const fail = Number(/^# fail (\d+)/m.exec(r.stdout)?.[1] ?? 0);
  const pass = Number(/^# pass (\d+)/m.exec(r.stdout)?.[1] ?? 0);
  const good = fail > 0;
  ok &&= good;
  console.log(`${good ? 'ok  ' : 'FAIL'} ${s}: starter code fails ${fail} test(s), passes ${pass}`);
}
if (!ok) {
  console.error('Some exercises/ starters no longer exhibit their deliberate bug.');
  process.exit(1);
}
