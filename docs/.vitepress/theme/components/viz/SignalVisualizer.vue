<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { fmt } from '../../progress';

/** Where does a signal go? Toggle the thread state and options, then send one. Mirrors sendSignal routing at the pinned commit. */
type TS = 'here' | 'elsewhere' | 'suspended' | 'idle';
const thread = ref<TS>('here');
const activity = ref<'reasoning' | 'tool' | 'text'>('tool');
const ifActive = ref<'deliver' | 'persist' | 'discard'>('deliver');
const ifIdle = ref<'wake' | 'persist'>('wake');
const transient = ref(false);
const frame = ref(0); // 0 compose, 1 route, 2 land

const branch = computed(() => (thread.value === 'here' ? 0 : thread.value === 'idle' ? 2 : 1));
const action = computed(() => {
  if (thread.value === 'elsewhere' || thread.value === 'suspended') return 'blocked';
  if (thread.value === 'here') return ifActive.value;
  return ifIdle.value === 'wake' ? 'wake' : transient.value ? 'discard' : 'persist';
});
const branchAction = (b: number) =>
  b === 0 ? ifActive.value : b === 1 ? 'blocked' : ifIdle.value === 'wake' ? 'wake' : transient.value ? 'discard' : 'persist';
const ACOLOR: Record<string, string> = { deliver: 'teal', wake: 'violet', persist: 'sky', discard: 'amber', blocked: 'coral' };

const explain = computed(() => {
  const a = action.value;
  if (a === 'blocked')
    return thread.value === 'suspended'
      ? 'The run is **suspended** waiting for a tool approval. Mastra returns `blocked`. Nothing retries for you: persist it or try again after the approval.'
      : 'The thread is active in **another process**. This process cannot inject into a run it does not own, so you get `blocked`. Handle it.';
  if (a === 'deliver') {
    if (activity.value === 'reasoning') return 'The model has streamed **only reasoning** so far, so the request is aborted ("Interrupted by a queued signal") and reissued with the signal in it. **No step is spent.**';
    if (activity.value === 'tool') return 'Signals are **cooperative, not preemptive**. It waits in `pendingSignalsByThread` until the tool finishes (yes, all 10 minutes), then `signalDrainStep` adds it and the loop asks the model again.';
    return 'Text has already streamed, so the request is not interrupted. After the step, `signalDrainStep` seals the message, adds the signal and marks the iteration continued: the model gets another turn.';
  }
  if (a === 'wake') return 'Nobody is running, so Mastra reserves the thread, takes a lease and starts `agent.stream(signal, { untilIdle: true })`. A brand-new run, triggered by an event.';
  if (a === 'persist') return 'Written to memory and broadcast to thread subscribers. **No run starts** and no run is interrupted. The model sees it the next time the thread runs.';
  return thread.value === 'idle'
    ? 'A **transient** signal means "deliver to the model, never persist". Combined with `persist` there is nowhere for it to go, so Mastra discards it (Lab 6 confirms `{ action: "discard" }`).'
    : 'Dropped on purpose. Useful for low-value chatter while the agent is busy.';
});
const modelSees = computed(() => ['deliver', 'wake'].includes(action.value));

const POS = [
  { x: 92, y: 150 },
  { x: 250, y: 150 },
  null,
];
const branchY = [55, 150, 245];
const env = computed(() => {
  if (frame.value === 0) return POS[0]!;
  if (frame.value === 1) return { x: 400, y: branchY[branch.value] };
  return { x: 560, y: branchY[branch.value] };
});

// timeline for "active here"
const SEG = [
  { k: 'reasoning', label: 'model: reasoning', w: 110 },
  { k: 'text', label: 'model: text + tool call', w: 130 },
  { k: 'tool', label: 'tool: deploy (10 min)', w: 170 },
  { k: 'drain', label: 'signal drain', w: 80 },
  { k: 'next', label: 'next request', w: 110 },
];
const segX = (idx: number) => 10 + SEG.slice(0, idx).reduce((n, s) => n + s.w + 6, 0);
const sentAt = computed(() => {
  const idx = activity.value === 'reasoning' ? 0 : activity.value === 'text' ? 1 : 2;
  return segX(idx) + SEG[idx].w / 2;
});
const landAt = computed(() => (activity.value === 'reasoning' ? segX(0) + 4 : segX(3) + SEG[3].w / 2));

watch([thread, activity, ifActive, ifIdle, transient], () => (frame.value = Math.min(frame.value, 2)));
let t1: any, t2: any;
function send() {
  clearTimeout(t1); clearTimeout(t2);
  frame.value = 0;
  const fast = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  t1 = setTimeout(() => (frame.value = 1), fast ? 0 : 450);
  t2 = setTimeout(() => (frame.value = 2), fast ? 0 : 1300);
}
function nextF() { frame.value = (frame.value + 1) % 3; }
const FLAB = ['1 · compose', '2 · route', '3 · land'];
</script>

<template>
  <section class="sv mpc-card mpc-anim" aria-label="Signal delivery visualizer">
    <div class="mpc-kicker"><Icon name="mail" :size="14" /> Interactive: where does this signal go?</div>
    <p class="intro">CI just failed on PR 42. You call <code>agent.sendSignal(signal, { threadId })</code>. Set the scene, then follow the envelope.</p>

    <div class="controls-grid">
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Thread state">
        <span class="label">Thread is</span>
        <button v-for="t in [['here', 'running here'], ['elsewhere', 'running in another process'], ['suspended', 'suspended (approval)'], ['idle', 'idle']]" :key="t[0]"
          type="button" role="radio" class="mpc-toggle" :aria-checked="thread === t[0]" @click="thread = t[0] as TS">{{ t[1] }}</button>
      </div>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="What the run is doing" v-if="thread === 'here'">
        <span class="label">Run is busy</span>
        <button v-for="t in [['reasoning', 'thinking (reasoning only)'], ['text', 'streaming its answer'], ['tool', 'running a 10-min tool']]" :key="t[0]"
          type="button" role="radio" class="mpc-toggle" :aria-checked="activity === t[0]" @click="activity = t[0] as any">{{ t[1] }}</button>
      </div>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="ifActive" v-if="thread === 'here'">
        <span class="label"><code>ifActive</code></span>
        <button v-for="t in ['deliver', 'persist', 'discard']" :key="t" type="button" role="radio" class="mpc-toggle" :aria-checked="ifActive === t" @click="ifActive = t as any">{{ t }}</button>
      </div>
      <div class="mpc-toggle-group" v-if="thread === 'idle'">
        <span class="label"><code>ifIdle</code></span>
        <span role="radiogroup" aria-label="ifIdle" class="mpc-toggle-group">
          <button v-for="t in ['wake', 'persist']" :key="t" type="button" role="radio" class="mpc-toggle" :aria-checked="ifIdle === t" @click="ifIdle = t as any">{{ t }}</button>
        </span>
        <label class="sw"><input type="checkbox" v-model="transient" /> <code>transient: true</code></label>
      </div>
    </div>

    <svg class="ill tree" viewBox="0 0 680 300" role="img" :aria-label="`Routing: thread ${thread}, result ${action}`">
      <defs>
        <marker id="sv-a" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0 L10 5 L0 10z" class="f-ink" /></marker>
      </defs>
      <rect x="18" y="122" width="150" height="56" rx="14" class="shadow" transform="translate(4 4)" />
      <rect x="18" y="122" width="150" height="56" rx="14" class="f-amber outline" />
      <text x="93" y="146" text-anchor="middle" font-size="14" class="t-strong">sendSignal()</text>
      <text x="93" y="165" text-anchor="middle" font-size="11" class="t-mono t-dim">CI failed on PR 42</text>
      <path d="M170 150 L208 150" class="stroke" marker-end="url(#sv-a)" />
      <g transform="translate(250 150)">
        <path d="M0 -40 L46 0 L0 40 L-46 0Z" class="shadow" transform="translate(4 4)" />
        <path d="M0 -40 L46 0 L0 40 L-46 0Z" class="f-violet outline" />
        <text y="-2" text-anchor="middle" font-size="12.5" class="t-strong">thread</text>
        <text y="13" text-anchor="middle" font-size="12.5" class="t-strong">state?</text>
      </g>
      <g v-for="(lbl, b) in ['active, this process', 'active elsewhere / suspended', 'idle']" :key="b" :class="{ dim: frame > 0 && branch !== b }" class="br">
        <path :d="`M296 150 Q320 ${branchY[b]} 336 ${branchY[b]}`" class="stroke" :class="{ hotpath: frame > 0 && branch === b }" marker-end="url(#sv-a)" />
        <rect x="340" :y="branchY[b] - 22" width="128" height="44" rx="12" class="f-paper outline" />
        <text x="404" :y="branchY[b] - 2" text-anchor="middle" font-size="11.5" class="t-strong">{{ lbl.split(' / ')[0] }}</text>
        <text x="404" :y="branchY[b] + 13" text-anchor="middle" font-size="11" class="t-dim">{{ lbl.includes(' / ') ? '/ ' + lbl.split(' / ')[1] : b === 0 ? `ifActive: ${ifActive}` : `ifIdle: ${ifIdle}` }}</text>
        <path :d="`M470 ${branchY[b]} L516 ${branchY[b]}`" class="stroke" :class="{ hotpath: frame > 1 && branch === b }" marker-end="url(#sv-a)" />
        <rect x="520" :y="branchY[b] - 20" width="130" height="40" rx="20" :class="`f-${ACOLOR[branchAction(b)]}`" class="outline" />
        <text x="585" :y="branchY[b] + 5" text-anchor="middle" font-size="14" class="t-strong t-mono">{{ branchAction(b) }}</text>
      </g>
      <g class="env" :style="{ transform: `translate(${env.x}px, ${env.y - 34}px)` }" aria-hidden="true">
        <rect x="-17" y="-11" width="34" height="23" rx="4" class="c-amber outline" stroke-width="2" />
        <path d="M-17 -10 L0 3 L17 -10" class="stroke" stroke-width="2" />
      </g>
    </svg>

    <div class="fr" role="group" aria-label="Animation steps">
      <button type="button" class="mpc-btn primary" @click="send"><Icon name="mail" :size="15" /> Send signal</button>
      <button type="button" class="mpc-btn" @click="nextF"><Icon name="next" :size="15" /> Step</button>
      <span class="mpc-chip" v-for="(l, k) in FLAB" :key="k" :class="{ on: frame === k }">{{ l }}</span>
    </div>

    <div class="out" aria-live="polite">
      <div v-if="frame === 0" class="proj">
        <div class="mpc-kicker">One signal, three projections</div>
        <div class="pg">
          <div><span class="pl">toLLMMessage()</span><code>user: &lt;notification source="ci"&gt;CI failed on PR 42&lt;/notification&gt;</code></div>
          <div><span class="pl">toDBMessage()</span><code>{ role: 'signal', metadata: { signal } }</code></div>
          <div><span class="pl">toDataPart()</span><code>{ type: 'data-signal', … }</code></div>
        </div>
      </div>
      <div v-else class="result" :class="`r-${ACOLOR[action]}`">
        <div class="rh"><Mascot :mood="action === 'blocked' ? 'alarmed' : action === 'discard' ? 'sleepy' : action === 'persist' ? 'thinking' : 'cheer'" :size="56" />
          <div>
            <code class="acc">await accepted → { action: '{{ action }}'{{ action === 'wake' ? ", runId, output" : action === 'deliver' ? ', runId' : '' }} }</code>
            <p v-html="fmt(explain)" />
          </div>
        </div>
        <svg v-if="thread === 'here' && action === 'deliver' && frame === 2" class="ill tl" viewBox="0 -18 640 110" role="img" aria-label="Run timeline showing where the signal lands">
          <g v-for="(s, k) in SEG" :key="s.k">
            <rect :x="segX(k)" y="30" :width="s.w" height="34" rx="9" class="outline" :class="s.k === 'drain' ? 'f-teal' : s.k === 'tool' ? 'f-amber' : 'f-violet'" stroke-width="2" />
            <text :x="segX(k) + s.w / 2" y="52" text-anchor="middle" font-size="11.5" class="t-strong">{{ s.label }}</text>
          </g>
          <path :d="`M${sentAt} 18 Q${(sentAt + landAt) / 2} ${activity === 'reasoning' ? 4 : -6} ${landAt} 26`" class="stroke s-coral" stroke-width="3" stroke-dasharray="5 5" />
          <text :x="sentAt" y="-6" text-anchor="middle" font-size="11" class="t-strong" style="fill: var(--mpc-coral)">signal sent</text>
          <text :x="landAt" y="84" text-anchor="middle" font-size="11" class="t-strong" style="fill: var(--mpc-teal)">{{ activity === 'reasoning' ? '↑ request reissued' : '↑ lands here' }}</text>
        </svg>
        <div class="sees"><span class="mpc-kicker">The model sees</span>
          <code v-if="modelSees">user: &lt;notification source="ci" pr="42"&gt;CI failed on PR 42&lt;/notification&gt;</code>
          <span v-else class="dimtxt">{{ action === 'persist' ? 'nothing now (it is in memory for the next run)' : 'nothing' }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sv { background: var(--vp-c-bg-soft); }
.intro { margin: 6px 0 10px !important; }
.controls-grid { display: flex; flex-direction: column; gap: 8px; }
.sw { display: inline-flex; gap: 6px; align-items: center; font-size: 13.5px; font-weight: 600; margin-left: 8px; cursor: pointer; }
.sw input { accent-color: var(--mpc-violet); }
.tree { width: 100%; height: auto; margin-top: 12px; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 14px; }
.br { transition: opacity 0.3s; }
.br.dim { opacity: 0.28; }
.hotpath { stroke: var(--mpc-violet) !important; stroke-width: 4 !important; }
.env { transition: transform 0.6s cubic-bezier(0.5, 0, 0.2, 1); }
.fr { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
.fr .mpc-chip { color: var(--vp-c-text-3); }
.fr .mpc-chip.on { color: var(--mpc-violet); background: var(--mpc-violet-soft); }
.out { margin-top: 12px; }
.proj, .result { background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 12px 14px; }
.pg { display: grid; gap: 6px; margin-top: 8px; }
.pg div { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; font-size: 13px; }
.pl { font-family: var(--mpc-mono); font-weight: 800; font-size: 12px; min-width: 120px; }
.result { border-left-width: 8px; }
.r-teal { border-left-color: var(--mpc-teal); }
.r-violet { border-left-color: var(--mpc-violet); }
.r-sky { border-left-color: var(--mpc-sky); }
.r-amber { border-left-color: var(--mpc-amber); }
.r-coral { border-left-color: var(--mpc-coral); background: var(--mpc-coral-soft); }
.rh { display: flex; gap: 12px; align-items: flex-start; }
.acc { font-size: 13.5px; font-weight: 700; }
.rh p { margin: 6px 0 0 !important; font-size: 15.5px !important; line-height: 1.6 !important; }
.tl { width: 100%; height: auto; margin-top: 10px; }
.sees { margin-top: 10px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; font-size: 13.5px; }
.dimtxt { color: var(--vp-c-text-3); }
@media (prefers-reduced-motion: reduce) { .env, .br { transition: none; } }
</style>
