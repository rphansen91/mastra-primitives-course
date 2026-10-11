// Regenerate expected-output/*.txt by running every lab script. Run ids, timestamps and
// pids are normalized so diffs only show behavioral changes.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const labs = {
  'm01-loop-from-scratch': 'm01-first-principles/loop-from-scratch.ts',
  'm02-anatomy': 'm02-agent-loop/anatomy.ts',
  'm02-thread-reservation': 'm02-agent-loop/thread-reservation.ts',
  'm03-composition': 'm03-processors/composition.ts',
  'm03-guardrails': 'm03-processors/guardrails.ts',
  'm06-signal-mid-run': 'm06-signals/signal-mid-run.ts',
  'm06-notifications': 'm06-signals/notifications.ts',
  'm07-crash-lab': 'm07-durability/crash-lab.ts',
  'm08-coordinator-relay': 'm08-multi-agent/coordinator-relay.ts',
};
const only = process.argv[2];
mkdirSync('expected-output', { recursive: true });
for (const [name, file] of Object.entries(labs)) {
  if (only && !name.includes(only)) continue;
  const r = spawnSync(process.execPath, ['--import', 'tsx', file], { encoding: 'utf8', env: process.env });
  const out = (r.stdout + (r.status ? `\n[exit ${r.status}]\n${r.stderr}` : ''))
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
    .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z/g, '<time>')
    .replace(/pid=\d+/g, 'pid=<pid>');
  writeFileSync(`expected-output/${name}.txt`, out);
  console.log(`${r.status === 0 ? 'ok  ' : 'FAIL'} ${name}`);
}
