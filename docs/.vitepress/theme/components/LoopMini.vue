<script setup lang="ts">
/**
 * Landing-page hero: a small, autoplaying run of the agent loop (one tool call, then an
 * answer). Pauses off-screen, on hover/focus, with the pause button, and never autoplays
 * under prefers-reduced-motion. Module 2 has the full, steppable version.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const ST = [
  { k: 'prep', label: 'Prepare', x: 120, y: 26 },
  { k: 'model', label: 'Model', x: 210, y: 92 },
  { k: 'tools', label: 'Run tools', x: 176, y: 196 },
  { k: 'fold', label: 'Fold results', x: 64, y: 196 },
  { k: 'stop', label: 'Stop check', x: 30, y: 92 },
] as const;
type Msg = { role: 'user' | 'assistant' | 'tool'; text: string };
const STEPS: { at: (typeof ST)[number]['k']; step: number; note: string; add?: Msg; done?: boolean }[] = [
  { at: 'prep', step: 0, note: 'processInputStep runs before every model request', add: { role: 'user', text: 'Why is PR 42 red?' } },
  { at: 'model', step: 0, note: 'the model does not answer yet: it asks for a tool', add: { role: 'assistant', text: 'call check_ci({ pr: 42 })' } },
  { at: 'tools', step: 0, note: 'the tool runs; if it threw, the error would become data for the model' },
  { at: 'fold', step: 0, note: 'the result folds into the message list, in call order', add: { role: 'tool', text: "{ status: 'failed', reason: 'docker hub 429' }" } },
  { at: 'stop', step: 0, note: 'the turn ended with tool calls, so the loop goes round again' },
  { at: 'prep', step: 1, note: 'this time the prompt contains the tool result' },
  { at: 'model', step: 1, note: 'the model answers in plain text', add: { role: 'assistant', text: 'Docker Hub rate-limited the build (429). Re-run it.' } },
  { at: 'stop', step: 1, note: 'no tool calls, so the loop stops and the stream ends with finish', done: true },
];
const i = ref(0);
const playing = ref(false);
const hold = ref(false); // hover / focus
const visible = ref(false);
const reduced = ref(false);
const cur = computed(() => STEPS[i.value]);
const msgs = computed(() => STEPS.slice(0, i.value + 1).flatMap((s) => (s.add ? [s.add] : [])));
const pos = computed(() => ST.find((s) => s.k === cur.value.at)!);
let timer: ReturnType<typeof setTimeout> | undefined;
let io: IntersectionObserver | undefined;
const root = ref<HTMLElement>();

function tick() {
  clearTimeout(timer);
  if (!playing.value || hold.value || !visible.value) return;
  timer = setTimeout(() => {
    i.value = i.value === STEPS.length - 1 ? 0 : i.value + 1;
    tick();
  }, cur.value.done ? 2600 : 1500);
}
function toggle() { playing.value = !playing.value; tick(); }
function setHold(v: boolean) { hold.value = v; tick(); }
onMounted(() => {
  reduced.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  playing.value = !reduced.value;
  if (reduced.value) i.value = STEPS.length - 1;
  io = new IntersectionObserver(([e]) => { visible.value = e.isIntersecting; tick(); }, { threshold: 0.2 });
  if (root.value) io.observe(root.value);
});
onBeforeUnmount(() => { clearTimeout(timer); io?.disconnect(); });
</script>

<template>
  <figure ref="root" class="lm mod-02" aria-label="Animated example: one run of the agent loop" @mouseenter="setHold(true)" @mouseleave="setHold(false)" @focusin="setHold(true)" @focusout="setHold(false)">
    <div class="top">
      <span class="ttl">One run of <code>agent.stream()</code></span>
      <button type="button" class="pp" :aria-pressed="!playing" @click="toggle">
        <Icon :name="playing ? 'pause' : 'play'" :size="12" /> {{ playing ? 'Pause' : 'Play' }}
      </button>
    </div>
    <div class="body">
      <svg class="ring" viewBox="0 0 240 230" aria-hidden="true">
        <circle cx="120" cy="116" r="86" class="track" />
        <g v-for="s in ST" :key="s.k" :class="['st', { on: s.k === cur.at }]">
          <rect :x="s.x - 40" :y="s.y - 13" width="80" height="26" rx="13" />
          <text :x="s.x" :y="s.y + 4.5" text-anchor="middle">{{ s.label }}</text>
        </g>
        <circle class="dot" r="5" :style="{ transform: `translate(${pos.x}px, ${pos.y - 19}px)` }" />
        <text x="120" y="112" text-anchor="middle" class="stepn">step {{ cur.step }}</text>
        <text x="120" y="130" text-anchor="middle" class="stepd">maxSteps 5</text>
      </svg>
      <div class="msgs">
        <div class="mh">Message list</div>
        <TransitionGroup tag="ol" name="m">
          <li v-for="(m, k) in msgs" :key="k" :class="m.role"><span class="r">{{ m.role }}</span><code>{{ m.text }}</code></li>
        </TransitionGroup>
      </div>
    </div>
    <figcaption aria-live="polite" :aria-atomic="true"><strong>{{ ST.find((s) => s.k === cur.at)!.label }}:</strong> {{ cur.note }}</figcaption>
  </figure>
</template>

<style scoped>
.lm { margin: 0; border: 1px solid var(--mpc-line); border-radius: var(--r-lg); background: var(--vp-c-bg); box-shadow: var(--mpc-shadow-2); padding: 14px 16px 12px; min-width: 0; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ttl { font-size: var(--fs-sm); font-weight: var(--fw-semibold); }
.ttl code { font-size: 0.92em; }
.pp { display: inline-flex; align-items: center; gap: 5px; font-size: var(--fs-xs); font-weight: var(--fw-semibold); padding: 3px 10px; border-radius: var(--r-pill); border: 1px solid var(--mpc-line-strong); color: var(--vp-c-text-1); }
.pp:hover { background: var(--mpc-surface-2); }
.pp:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.body { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; margin-top: 6px; }
.ring { width: 100%; height: auto; display: block; overflow: visible; }
.track { fill: none; stroke: var(--mpc-line-strong); stroke-width: 1.5; stroke-dasharray: 3 5; }
.st rect { fill: var(--vp-c-bg); stroke: var(--mpc-line-strong); stroke-width: 1.25; transition: fill 0.25s, stroke 0.25s; }
.st text { font-size: 11.5px; font-weight: 500; fill: var(--vp-c-text-2); transition: fill 0.25s; }
.st.on rect { fill: var(--mod-tint); stroke: var(--mod-accent); stroke-width: 1.75; }
.st.on text { fill: var(--vp-c-text-1); font-weight: 600; }
.dot { fill: var(--mod-accent); transition: transform 0.6s var(--mpc-ease); }
.stepn { font-size: 15px; font-weight: 600; fill: var(--vp-c-text-1); font-variant-numeric: tabular-nums; }
.stepd { font-size: 10.5px; fill: var(--vp-c-text-2); font-family: var(--vp-font-family-mono); }
.msgs { min-width: 0; align-self: stretch; display: flex; flex-direction: column; }
.mh { font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-2); margin-bottom: 6px; }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; align-content: start; min-height: 236px; }
li { display: grid; gap: 2px; padding: 6px 8px; border-radius: var(--r-md); background: var(--mpc-surface-2); border-left: 2px solid var(--mpc-line-strong); min-width: 0; }
li.assistant { border-left-color: var(--mod-accent); }
li.tool { border-left-color: var(--mpc-tip); }
.r { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-2); }
li code { font-size: 12px; background: none !important; border: 0 !important; padding: 0 !important; color: var(--vp-c-text-1); overflow-wrap: anywhere; }
figcaption { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--mpc-line); font-size: var(--fs-sm); color: var(--vp-c-text-2); min-height: 2.9em; }
figcaption strong { color: var(--vp-c-text-1); font-weight: var(--fw-semibold); }
.m-enter-active { transition: opacity 0.35s, transform 0.35s var(--mpc-ease); }
.m-enter-from { opacity: 0; transform: translateY(6px); }
@media (prefers-reduced-motion: reduce) { .dot, .st rect, .m-enter-active { transition: none; } }
@media (max-width: 520px) { .body { grid-template-columns: 1fr; } .ring { max-width: 260px; margin: 0 auto; } }
</style>
