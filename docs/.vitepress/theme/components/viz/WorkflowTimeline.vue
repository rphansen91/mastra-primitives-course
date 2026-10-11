<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue';
import { prefersReducedMotion, fmt } from '../../progress';

/**
 * Module 5: the refund workflow from Lab 5. fetch → approve (suspend) → apply → notify, with the
 * snapshot Mastra writes after every step, a resume in a different process, the double-resume race,
 * and a crash during apply.
 */
type St = 'pending' | 'running' | 'success' | 'suspended';
const STEPS = [
  { id: 'fetch', label: 'fetch', sub: 'load the order' },
  { id: 'approve', label: 'approve', sub: 'suspend() for a human' },
  { id: 'apply', label: 'apply', sub: 'refund $49' },
  { id: 'notify', label: 'notify', sub: 'email the customer' },
] as const;
const buggy = ref(false);
const crash = ref(false);
const phase = ref<'ready' | 'busy' | 'suspended' | 'done' | 'dead'>('ready');
const steps = reactive<Record<string, St>>({ fetch: 'pending', approve: 'pending', apply: 'pending', notify: 'pending' });
const snaps = ref<{ n: number; status: string; after: string }[]>([]);
const runStatus = ref('—');
const proc = ref<'A' | 'B' | 'C'>('A');
const log = ref<{ p: string; text: string; kind?: string }[]>([]);
const outbox = ref<{ to: string; text: string; dup?: boolean }[]>([]);
const ledger = ref<{ text: string; dup?: boolean }[]>([]);
const race = ref<string[]>([]);
const narr = ref('Press **Start the run**. Process A is your web server.');
let timers: ReturnType<typeof setTimeout>[] = [];
onBeforeUnmount(() => timers.forEach(clearTimeout));
const wait = (ms: number) => new Promise<void>((r) => { if (prefersReducedMotion()) return r(); timers.push(setTimeout(r, ms)); });

function snapshot(status: string, after: string) { runStatus.value = status; snaps.value.push({ n: snaps.value.length + 1, status, after }); }
function say(text: string, kind?: string) { log.value.push({ p: proc.value, text, kind }); }
function reset() {
  timers.forEach(clearTimeout); timers = [];
  for (const s of STEPS) steps[s.id] = 'pending';
  snaps.value = []; log.value = []; outbox.value = []; ledger.value = []; race.value = [];
  runStatus.value = '—'; proc.value = 'A'; phase.value = 'ready';
  narr.value = 'Press **Start the run**. Process A is your web server.';
}
async function runStep(id: string, body: () => void | 'suspend') {
  steps[id] = 'running'; await wait(450);
  const r = body();
  steps[id] = r === 'suspend' ? 'suspended' : 'success';
}
async function start() {
  reset(); phase.value = 'busy'; snapshot('running', 'start');
  await runStep('fetch', () => say('fetch order-1042 ($49)'));
  snapshot('running', 'fetch ✓');
  await runStep('approve', () => { outbox.value.push({ to: 'manager', text: 'Approve refund of $49?' }); say('EMAIL manager: approve $49?', 'effect'); return 'suspend'; });
  snapshot('suspended', 'approve ⏸');
  phase.value = 'suspended';
  narr.value = 'Suspended. The snapshot is on disk with `suspendedPaths: { approve: [1] }`. Process A can exit, crash or be redeployed. Nothing is waiting in memory.';
}
async function resume(approved: boolean) {
  phase.value = 'busy'; proc.value = 'B';
  say(`resume({ step: 'approve', resumeData: { approved: ${approved} } })`);
  steps.approve = 'running'; await wait(450);
  if (buggy.value) { outbox.value.push({ to: 'manager', text: 'Approve refund of $49?', dup: true }); say('EMAIL manager: approve $49? (again!)', 'bad'); }
  steps.approve = 'success'; snapshot('running', 'approve ✓');
  await runStep('apply', () => { if (approved) { ledger.value.push({ text: 'refund $49' }); say('apply: refund $49', 'effect'); } else say('apply: skipped (declined)'); });
  if (crash.value && approved) {
    steps.apply = 'running'; phase.value = 'dead';
    say('kill -9 (after the refund, before the snapshot)', 'bad');
    narr.value = 'Process B died **after** the refund went out but **before** the snapshot recorded `apply` as done. Boot a new process with `recovery.workflows: \'auto\'`.';
    return;
  }
  snapshot('running', 'apply ✓');
  await finish(approved);
}
async function finish(approved: boolean) {
  await runStep('notify', () => { outbox.value.push({ to: 'customer', text: approved ? 'Refunded $49' : 'Refund declined' }); say('notify customer', 'effect'); });
  snapshot('success', 'notify ✓'); phase.value = 'done';
  const emails = outbox.value.filter((o) => o.to === 'manager').length;
  const refunds = ledger.value.length;
  narr.value = emails > 1 ? 'Done, but the manager got **two** approval emails. On resume, the step\'s `execute` runs again **from the top**: everything before `suspend()` repeats. Guard it with `if (resumeData)`.'
    : refunds > 1 ? 'Done, with **two refunds**. The in-flight step re-ran from its start after the crash, and nothing told the payments API it was a retry. Module 7 fixes this with an idempotency key.'
    : `Done. Process B did \`${approved ? 'approve → apply → notify' : 'approve → apply (skipped) → notify'}\` and \`fetch\` never ran again: its result came from the snapshot.`;
}
async function recover() {
  phase.value = 'busy'; proc.value = 'C';
  say('boot: restartAllActiveWorkflowRuns()');
  steps.apply = 'pending'; await wait(300);
  await runStep('apply', () => { ledger.value.push({ text: 'refund $49', dup: true }); say('apply: refund $49 (again!)', 'bad'); });
  snapshot('running', 'apply ✓');
  await finish(true);
}
async function doubleResume() {
  phase.value = 'busy'; proc.value = 'B';
  race.value = ['manager A clicks Approve', 'manager B clicks Approve'];
  await wait(400);
  race.value.push("A's resume claims the run: suspended → running ✓");
  race.value.push("B's resume throws: \"This suspended workflow run was already resumed by another caller.\"");
  await wait(400);
  await resume(true);
  if (phase.value === 'done' && emailsToManager.value === 1 && ledger.value.length === 1)
    narr.value = 'Only one resume wins. Mastra claims it with a compare-and-set on the run status (`#claimResume`: suspended → running), so two clicks can\'t both continue the run. The winner carried on to the end.';
}
const snapStatus = computed(() => runStatus.value);
const emailsToManager = computed(() => outbox.value.filter((o) => o.to === 'manager').length);
</script>

<template>
  <section class="wt mpc-card mpc-anim" aria-label="Workflow suspend and resume simulator">
    <div class="mpc-kicker"><Icon name="clock" :size="14" /> Interactive: suspend, resume, snapshot</div>
    <p class="intro">The refund workflow from Lab 5. A manager must approve it. Watch what's written to disk after every step, and which process does what.</p>
    <div class="opts">
      <label class="sw"><input type="checkbox" v-model="buggy" :disabled="phase === 'busy'" /> approval email sent <strong>before</strong> the <code>resumeData</code> check (the Exercise 5.1 bug)</label>
      <label class="sw"><input type="checkbox" v-model="crash" :disabled="phase === 'busy'" /> <code>kill -9</code> during <code>apply</code></label>
    </div>

    <ol class="graph" aria-label="Steps">
      <li v-for="(s, i) in STEPS" :key="s.id" class="node" :class="steps[s.id]">
        <span class="nm">{{ s.label }}</span><span class="sb">{{ s.sub }}</span>
        <span class="badge">{{ { pending: 'pending', running: 'running…', success: 'success', suspended: '⏸ suspended' }[steps[s.id]] }}</span>
        <span v-if="i < STEPS.length - 1" class="link" aria-hidden="true">→</span>
      </li>
    </ol>

    <div class="disks" aria-label="Snapshots written">
      <span class="mpc-kicker">Snapshots written ({{ snaps.length }})</span>
      <div class="dl">
        <span v-for="s in snaps" :key="s.n" class="disk" :class="s.status"><b>#{{ s.n }}</b> {{ s.after }}</span>
        <span v-if="!snaps.length" class="none">none yet</span>
      </div>
    </div>

    <div class="ctrl">
      <button type="button" class="mpc-btn primary" :disabled="phase === 'busy' || phase === 'suspended'" @click="start"><Icon name="play" :size="15" /> Start the run</button>
      <button type="button" class="mpc-btn" :disabled="phase !== 'suspended'" @click="resume(true)"><Icon name="check" :size="15" /> Manager approves</button>
      <button type="button" class="mpc-btn" :disabled="phase !== 'suspended'" @click="resume(false)"><Icon name="x" :size="15" /> Manager declines</button>
      <button type="button" class="mpc-btn" :disabled="phase !== 'suspended'" @click="doubleResume"><Icon name="cards" :size="15" /> Two managers click at once</button>
      <button type="button" class="mpc-btn danger" :disabled="phase !== 'dead'" @click="recover"><Icon name="reset" :size="15" /> Boot a new process</button>
      <button type="button" class="mpc-btn small" @click="reset">Reset</button>
    </div>

    <div class="narr" aria-live="polite"><Mascot :mood="phase === 'dead' ? 'alarmed' : phase === 'suspended' ? 'sleepy' : phase === 'done' ? (emailsToManager > 1 || ledger.length > 1 ? 'alarmed' : 'cheer') : 'thinking'" :size="50" /><p v-html="fmt(narr)" /></div>

    <div class="panels">
      <div class="pn">
        <div class="mpc-kicker">Snapshot on disk</div>
        <pre class="json"><code>{
  status: '{{ snapStatus }}',
  suspendedPaths: {{ steps.approve === 'suspended' ? '{ approve: [1] }' : '{}' }},
  context: {
<template v-for="s in STEPS" :key="s.id"><template v-if="steps[s.id] !== 'pending'">    {{ s.id }}: '{{ steps[s.id] }}',
</template></template>  },
}</code></pre>
      </div>
      <div class="pn">
        <div class="mpc-kicker">Who did what</div>
        <ul class="log">
          <li v-for="(l, k) in log" :key="k" :class="[`p${l.p}`, l.kind]"><span class="pid">process {{ l.p }}</span> {{ l.text }}</li>
          <li v-for="(r, k) in race" :key="'r' + k" class="race">{{ r }}</li>
          <li v-if="!log.length" class="none">nothing yet</li>
        </ul>
      </div>
      <div class="pn">
        <div class="mpc-kicker">The outside world</div>
        <div class="ow"><b>Emails</b><span v-for="(o, k) in outbox" :key="k" class="tag" :class="{ dup: o.dup }">{{ o.to }}: {{ o.text }}</span><span v-if="!outbox.length" class="none">none</span></div>
        <div class="ow"><b>Payments</b><span v-for="(o, k) in ledger" :key="k" class="tag" :class="{ dup: o.dup }">{{ o.text }}{{ o.dup ? ' (AGAIN!)' : '' }}</span><span v-if="!ledger.length" class="none">none</span></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wt { background: var(--vp-c-bg-soft); }
.intro { margin: 6px 0 10px !important; }
.opts { display: grid; gap: 4px; }
.sw { font-size: 14px; display: inline-flex; gap: 6px; align-items: baseline; }
.graph { list-style: none; padding: 0 !important; margin: 16px 0 8px !important; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px; }
@media (max-width: 640px) { .graph { grid-template-columns: repeat(2, minmax(0, 1fr)); } .link { display: none; } }
.node { position: relative; margin: 0 !important; border: 2.5px solid var(--mpc-ink); border-radius: 14px; padding: 10px; background: var(--mpc-paper); box-shadow: 3px 3px 0 var(--mpc-shadow); display: grid; gap: 2px; min-width: 0; }
.node.running { background: var(--mpc-amber-soft); }
.node.success { background: var(--mpc-teal-soft); }
.node.suspended { background: var(--mpc-violet-soft); border-style: dashed; }
.nm { font-family: var(--mpc-mono); font-weight: 800; font-size: 15px; }
.sb { font-size: 12.5px; color: var(--mpc-ink-2); }
.badge { justify-self: start; font-size: 11.5px; font-weight: 800; border: 1.5px solid var(--mpc-ink); border-radius: 99px; padding: 0 7px; background: var(--mpc-paper); margin-top: 4px; }
.link { position: absolute; right: -19px; top: 38%; font-weight: 800; font-size: 18px; }
.disks { margin: 6px 0 10px; }
.dl { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.disk { font-size: 12.5px; padding: 2px 9px; border: 2px solid var(--mpc-ink); border-radius: 8px 8px 12px 12px; background: var(--mpc-sky-soft); }
.disk.suspended { background: var(--mpc-violet-soft); } .disk.success { background: var(--mpc-teal-soft); }
.none { font-size: 13px; color: var(--mpc-ink-2); font-style: italic; }
.ctrl { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.narr { display: flex; gap: 10px; align-items: flex-start; border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 8px 12px; background: var(--mpc-paper); }
.narr p { margin: 4px 0 0 !important; font-size: 15px !important; }
.panels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
@media (max-width: 760px) { .panels { grid-template-columns: minmax(0, 1fr); } }
.pn { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 8px 10px; background: var(--mpc-paper); min-width: 0; }
.json { margin: 6px 0 0 !important; font-size: 12px; line-height: 1.5; background: var(--vp-c-bg-soft) !important; border-radius: 8px; padding: 6px 8px !important; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
.json code { background: none !important; padding: 0 !important; font-size: 11.5px !important; white-space: pre-wrap !important; }
.log { list-style: none; padding: 0 !important; margin: 6px 0 0 !important; display: grid; gap: 4px; }
.log li { margin: 0 !important; font-size: 12.5px !important; line-height: 1.4; padding: 2px 6px; border-radius: 6px; overflow-wrap: anywhere; }
.pid { font-weight: 800; font-size: 11px; text-transform: uppercase; margin-right: 4px; }
.pA .pid { color: var(--mpc-violet); } .pB .pid { color: var(--mpc-sky); } .pC .pid { color: var(--mpc-teal); }
.log .effect { background: var(--mpc-amber-soft); }
.log .bad { background: var(--mpc-coral-soft); }
.log .race { background: var(--mpc-violet-soft); }
.ow { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-top: 6px; font-size: 13px; }
.ow b { width: 100%; font-size: 12.5px; }
.tag { font-family: var(--mpc-mono); font-size: 12px; padding: 1px 8px; border: 1.5px solid var(--mpc-ink); border-radius: 99px; background: var(--mpc-teal-soft); }
.tag.dup { background: var(--mpc-coral); color: #fff; font-weight: 800; }
@media (prefers-reduced-motion: no-preference) { .node { transition: background 0.25s; } }
</style>
