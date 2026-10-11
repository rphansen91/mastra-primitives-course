<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { fmt, prefersReducedMotion } from '../../progress';

/**
 * Press play, hit kill -9 whenever you like, restart, and see what recovers,
 * what re-runs, and what the outside world saw.
 *  variant "durable": a Mastra durable agent (Module 7), step-boundary checkpoints
 *  variant "journal": the hand-built ctx.run journal from Module 1
 */
const props = withDefaults(defineProps<{ variant?: 'durable' | 'journal' }>(), { variant: 'durable' });

type Seg = { id: string; kind: 'llm' | 'tool' | 'step'; label: string; sub: string; effect?: { at: number; ledger: string; text: string } };
const SEGS: Seg[] =
  props.variant === 'durable'
    ? [
        { id: 'llm1', kind: 'llm', label: 'LLM step', sub: 'decides: charge the card', },
        { id: 'charge', kind: 'tool', label: 'charge_card', sub: '$49 upgrade', effect: { at: 0.55, ledger: 'Payments API', text: 'charge $49' } },
        { id: 'llm2', kind: 'llm', label: 'LLM step', sub: 'decides: send receipt' },
        { id: 'email', kind: 'tool', label: 'send_receipt', sub: 'email the customer', effect: { at: 0.5, ledger: 'Email outbox', text: 'receipt email' } },
        { id: 'llm3', kind: 'llm', label: 'LLM step', sub: '"You\'re on Pro!"' },
      ]
    : [
        { id: 'charge', kind: 'step', label: "ctx.run('charge')", sub: 'payments.charge(500)', effect: { at: 0.5, ledger: 'Payments API', text: 'charge $5.00' } },
        { id: 'deploy', kind: 'step', label: "ctx.run('deploy')", sub: 'start a 10-min deploy', effect: { at: 0.5, ledger: 'Deploy API', text: 'deploy started' } },
        { id: 'email', kind: 'step', label: "ctx.run('email')", sub: 'notify the team', effect: { at: 0.5, ledger: 'Email outbox', text: 'email sent' } },
      ];
const N = SEGS.length;
const LBL =
  props.variant === 'durable'
    ? { plain: 'Plain agent.stream()', durable: 'Durable agent (recovery: auto)', ck: 'checkpoint', memo: 'from snapshot' }
    : { plain: 'No journal', durable: 'Journal (ctx.run)', ck: 'journal write', memo: 'from journal' };

const mode = ref<'plain' | 'durable'>('durable');
const idem = ref(false);
const version = ref<'1.75' | '1.76'>('1.75');
const t = ref(0);
const phase = ref<'ready' | 'running' | 'paused' | 'dead' | 'waiting' | 'recovered' | 'finished'>('ready');
const killedAt = ref<number | null>(null);
const claimLeft = ref(0);
let timer: any;
let claimTimer: any;

function clear() { clearInterval(timer); clearInterval(claimTimer); }
function play() {
  if (phase.value === 'running') { clear(); phase.value = 'paused'; return; }
  if (['dead', 'waiting', 'recovered', 'finished'].includes(phase.value)) reset();
  phase.value = 'running';
  timer = setInterval(() => {
    t.value = Math.min(N, +(t.value + 0.04).toFixed(2));
    if (t.value >= N) { clear(); phase.value = 'finished'; }
  }, prefersReducedMotion() ? 120 : 60);
}
function kill() {
  if (!['running', 'paused', 'ready'].includes(phase.value)) return;
  clear();
  killedAt.value = t.value;
  phase.value = 'dead';
}
function restart() {
  if (phase.value !== 'dead') return;
  if (mode.value === 'durable' && props.variant === 'durable' && version.value === '1.76') {
    phase.value = 'waiting';
    claimLeft.value = 30;
    claimTimer = setInterval(() => {
      claimLeft.value -= 3;
      if (claimLeft.value <= 0) { clearInterval(claimTimer); phase.value = 'recovered'; }
    }, prefersReducedMotion() ? 100 : 220);
  } else phase.value = 'recovered';
}
function reset() { clear(); t.value = 0; killedAt.value = null; phase.value = 'ready'; }
watch([mode, idem, version], reset);
onBeforeUnmount(clear);

const k = computed(() => killedAt.value ?? t.value);
const segState = (i: number) => {
  const s = SEGS[i];
  const live = phase.value === 'recovered' ? k.value : t.value;
  if (phase.value !== 'recovered') return live >= i + 1 ? 'done' : live > i ? 'active' : 'todo';
  if (mode.value === 'plain') return i < k.value ? 'rerun' : 'fresh';
  if (k.value >= i + 1) return 'memo';
  if (k.value > i) return 'rerun';
  return 'fresh';
};
const fired = (i: number, at: number) => at <= i + (SEGS[i].effect?.at ?? 2);

type Entry = { text: string; status: 'ok' | 'dup' | 'deduped' };
const ledger = computed(() => {
  const out: Record<string, Entry[]> = {};
  SEGS.forEach((s) => s.effect && (out[s.effect.ledger] = []));
  const firstRunUntil = phase.value === 'recovered' || phase.value === 'dead' || phase.value === 'waiting' ? k.value : t.value;
  SEGS.forEach((s, i) => {
    if (!s.effect) return;
    const firedFirst = i + s.effect.at <= firstRunUntil;
    if (firedFirst) out[s.effect.ledger].push({ text: s.effect.text, status: 'ok' });
    if (phase.value !== 'recovered') return;
    const st = segState(i);
    if (st === 'memo') return;
    // second execution after restart
    if (firedFirst) {
      const sameKey = idem.value && (mode.value === 'durable' || props.variant === 'journal');
      out[s.effect.ledger].push({ text: s.effect.text, status: sameKey ? 'deduped' : 'dup' });
    } else out[s.effect.ledger].push({ text: s.effect.text, status: 'ok' });
  });
  return out;
});
const dupCount = computed(() => Object.values(ledger.value).flat().filter((e) => e.status === 'dup').length);
const dedupCount = computed(() => Object.values(ledger.value).flat().filter((e) => e.status === 'deduped').length);

const story = computed(() => {
  const p = phase.value;
  if (p === 'ready') return 'Press **Play**, then hit **kill -9** at any moment. Try killing it in the middle of a tool, right after its side effect fires (the lightning bolt).';
  if (p === 'running' || p === 'paused') return 'The run is executing. Every lightning bolt is a side effect the outside world can see.';
  if (p === 'finished') return 'No crash, so everything happened exactly once. Boring in production, which is the goal. Now replay and kill it.';
  if (p === 'dead') return `**SIGKILL** at ${Math.round((killedAt.value! / N) * 100)}% through the run. No cleanup, no finally blocks. Now press **Restart process**.`;
  if (p === 'waiting') return `The dead process still holds the **run claim**. On the 1.76 pre-release, recovery skips the run until the claim expires (TTL 30 s). ${claimLeft.value} s left…`;
  const inflight = SEGS.findIndex((_, i) => k.value > i && k.value < i + 1);
  if (mode.value === 'plain')
    return props.variant === 'durable'
      ? 'Nothing was checkpointed, so there is nothing to recover. The customer clicks "try again": a **new run with a new runId** re-asks the model and re-runs every tool. An idempotency key built from `runId` would not help: the key changed.'
      : idem.value
        ? 'With no journal, the replay starts from zero and **redoes every step**. The receivers dedupe on the stable key, so the world sees each effect once, but you paid for all the work twice.'
        : 'With no journal, the replay starts from zero and every effect that already happened **happens again**.';
  const memoN = SEGS.filter((_, i) => segState(i) === 'memo').length;
  let s = `${memoN} completed step${memoN === 1 ? '' : 's'} came back ${LBL.memo} (no model re-asked, no tool re-run). `;
  if (inflight >= 0) {
    const seg = SEGS[inflight];
    s += `The **in-flight** step (${seg.label}) runs again from its start: step granularity, not effect granularity. `;
    if (seg.effect && fired(inflight, k.value)) s += idem.value ? 'Its effect fired before the crash, but the receiver saw the **same idempotency key** and deduped it.' : 'Its effect had **already fired**, so the outside world sees it twice.';
  }
  return s;
});
const mood = computed(() => (phase.value === 'dead' ? 'alarmed' : phase.value === 'recovered' ? (dupCount.value ? 'alarmed' : 'cheer') : phase.value === 'waiting' ? 'sleepy' : 'thinking'));
const pct = (x: number) => `${(x / N) * 100}%`;
</script>

<template>
  <section class="cs mpc-card mpc-anim" :class="{ dead: phase === 'dead' }" aria-label="Crash simulator">
    <div class="mpc-kicker"><Icon name="skull" :size="14" /> Interactive: crash simulator</div>
    <p class="intro" v-if="variant === 'durable'">A support agent upgrades a customer to Pro: it charges their card, then emails a receipt.</p>
    <p class="intro" v-else>A three-step job: charge, deploy, email. Each side effect is wrapped in <code>ctx.run(key, fn)</code>.</p>

    <div class="row">
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Execution mode">
        <span class="label">Mode</span>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'plain'" @click="mode = 'plain'">{{ LBL.plain }}</button>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'durable'" @click="mode = 'durable'">{{ LBL.durable }}</button>
      </div>
      <label class="sw"><input type="checkbox" v-model="idem" /> idempotency key <code>{{ variant === 'durable' ? 'runId:toolCallId' : 'runId:charge' }}</code></label>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Mastra version" v-if="variant === 'durable' && mode === 'durable'">
        <span class="label">@mastra/core</span>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="version === '1.75'" @click="version = '1.75'">1.75.0</button>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="version === '1.76'" @click="version = '1.76'">1.76 pre-release (claims)</button>
      </div>
    </div>

    <div class="tlwrap">
      <div class="tl" role="img" :aria-label="`Run timeline, ${Math.round((t / N) * 100)} percent`">
        <div v-for="(s, i) in SEGS" :key="s.id" class="seg" :class="[s.kind, segState(i)]">
          <div class="sl">{{ s.label }}</div>
          <div class="ss">{{ s.sub }}</div>
          <span v-if="s.effect" class="bolt" :style="{ left: s.effect.at * 100 + '%' }" :class="{ hit: fired(i, phase === 'recovered' || phase === 'dead' || phase === 'waiting' ? k : t) }" title="side effect"><Icon name="bolt" :size="14" /></span>
          <span v-if="mode === 'durable'" class="ck" :title="LBL.ck" :class="{ hit: (killedAt ?? t) >= i + 1 }" />
          <span class="badge" v-if="phase === 'recovered'">{{ { memo: LBL.memo, rerun: 're-runs ↻', fresh: 'runs (first time)', done: '', active: '', todo: '' }[segState(i)] }}</span>
        </div>
        <div class="head" :style="{ left: pct(killedAt ?? t) }" :class="{ killed: killedAt !== null }"><span v-if="killedAt !== null">✕ kill -9</span></div>
      </div>
    </div>
    <div class="legend"><span><Icon name="bolt" :size="13" /> side effect</span><span v-if="mode === 'durable'"><i class="ckl" /> {{ LBL.ck }} (step boundary)</span></div>

    <div class="ctrl">
      <button type="button" class="mpc-btn primary" @click="play" :disabled="phase === 'waiting'"><Icon :name="phase === 'running' ? 'pause' : 'play'" :size="15" /> {{ phase === 'running' ? 'Pause' : phase === 'paused' ? 'Resume' : 'Play' }}</button>
      <button type="button" class="mpc-btn danger" @click="kill" :disabled="!['running', 'paused', 'ready'].includes(phase) || t === 0"><Icon name="skull" :size="15" /> kill -9</button>
      <button type="button" class="mpc-btn" @click="restart" :disabled="phase !== 'dead'"><Icon name="reset" :size="15" /> Restart process</button>
      <button type="button" class="mpc-btn small" @click="reset">Reset</button>
      <label class="scrub"><span class="mpc-sr">Scrub the timeline</span>
        <input type="range" min="0" :max="N" step="0.05" v-model.number="t" :disabled="!['ready', 'paused'].includes(phase)" @input="phase === 'ready' && t > 0 ? (phase = 'paused') : null" />
      </label>
    </div>

    <div class="bottom">
      <div class="story" aria-live="polite">
        <Mascot :mood="mood" :size="60" />
        <p v-html="fmt(story)" />
      </div>
      <div class="ledger">
        <div class="mpc-kicker">What the outside world saw</div>
        <div v-for="(entries, name) in ledger" :key="name" class="lg">
          <strong>{{ name }}</strong>
          <span v-if="!entries.length" class="none">nothing yet</span>
          <span v-for="(e, j) in entries" :key="j" class="ent" :class="e.status">{{ e.text }}{{ e.status === 'dup' ? ' (AGAIN!)' : e.status === 'deduped' ? ' (deduped ✓)' : '' }}</span>
        </div>
        <div v-if="phase === 'recovered'" class="verdict" :class="dupCount ? 'bad' : 'good'">
          {{ dupCount ? `${dupCount} duplicate side effect${dupCount > 1 ? 's' : ''}` : dedupCount ? 'Exactly-once-effective: retried, deduped' : 'Every effect happened exactly once' }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cs { background: var(--vp-c-bg-soft); transition: background 0.3s; }
.cs.dead { background: var(--mpc-coral-soft); }
.intro { margin: 6px 0 10px !important; }
.row { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.sw { display: inline-flex; gap: 6px; align-items: center; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.sw input { accent-color: var(--mpc-violet); width: 16px; height: 16px; }
.tlwrap { overflow-x: auto; margin-top: 8px; padding: 34px 4px 8px; }
.tl { position: relative; display: flex; gap: 0; min-width: 600px; }
.seg { position: relative; flex: 1; border: 2px solid var(--mpc-ink); margin-right: -2px; padding: 10px 10px 26px; background: var(--mpc-paper); min-height: 86px; }
.seg:first-child { border-radius: 12px 0 0 12px; }
.seg:last-of-type { border-radius: 0 12px 12px 0; }
.seg.llm { background: var(--mpc-violet-soft); }
.seg.tool, .seg.step { background: var(--mpc-amber-soft); }
.seg.todo { opacity: 0.6; }
.seg.memo { background: var(--mpc-teal-soft); }
.seg.rerun { background: var(--mpc-coral-soft); box-shadow: inset 0 0 0 3px var(--mpc-coral); }
.seg.fresh { background: var(--mpc-sky-soft); }
.sl { font-weight: 800; font-size: 13.5px; font-family: var(--mpc-mono); }
.ss { font-size: 12px; color: var(--vp-c-text-2); line-height: 1.3; }
.bolt { position: absolute; bottom: 4px; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); color: var(--vp-c-text-3); }
.bolt.hit { background: var(--mpc-amber); color: var(--mpc-ink); }
.ck { position: absolute; right: -9px; top: -12px; width: 16px; height: 16px; border-radius: 4px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); z-index: 2; }
.ck.hit { background: var(--mpc-teal); }
.ckl { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 2px solid var(--mpc-ink); background: var(--mpc-teal); vertical-align: -1px; }
.badge { position: absolute; left: 8px; bottom: 4px; font-size: 11px; font-weight: 800; background: var(--mpc-paper); border: 1.5px solid var(--mpc-ink); border-radius: 99px; padding: 0 7px; }
.head { position: absolute; top: -14px; bottom: -6px; width: 3px; margin-left: -1.5px; background: var(--mpc-violet); border-radius: 2px; z-index: 3; }
.head.killed { background: var(--mpc-coral); width: 4px; }
.head span { position: absolute; top: -18px; left: 6px; white-space: nowrap; font-size: 12px; font-weight: 800; color: var(--mpc-coral); }
.legend { display: flex; gap: 16px; font-size: 12.5px; color: var(--vp-c-text-2); margin-top: 2px; }
.legend span { display: inline-flex; gap: 5px; align-items: center; }
.ctrl { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
.scrub { flex: 1; min-width: 140px; display: flex; }
.scrub input { width: 100%; accent-color: var(--mpc-violet); }
.bottom { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; margin-top: 12px; }
.story { display: flex; gap: 10px; align-items: flex-start; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; }
.story p { margin: 0 !important; font-size: 15.5px !important; line-height: 1.6 !important; }
.ledger { background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; }
.lg { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; font-size: 13.5px; }
.lg strong { min-width: 100%; font-size: 13px; }
.none { color: var(--vp-c-text-3); font-size: 12.5px; }
.ent { font-family: var(--mpc-mono); font-size: 12px; padding: 2px 8px; border-radius: 99px; border: 1.5px solid var(--mpc-ink); background: var(--mpc-teal-soft); }
.ent.dup { background: var(--mpc-coral); color: #fff; font-weight: 800; }
.ent.deduped { background: var(--mpc-sky-soft); text-decoration: line-through; }
.verdict { margin-top: 10px; font-weight: 800; padding: 6px 10px; border-radius: 10px; border: 2px solid var(--mpc-ink); }
.verdict.bad { background: var(--mpc-coral-soft); }
.verdict.good { background: var(--mpc-teal-soft); }
@media (max-width: 760px) { .bottom { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .cs { transition: none; } }
</style>
