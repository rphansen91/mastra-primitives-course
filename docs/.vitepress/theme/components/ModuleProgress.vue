<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { progress, loadProgress, registry, STATIONS, unmarkPrefix } from '../progress';
import { withBase } from 'vitepress';

const props = withDefaults(defineProps<{ module: string; compact?: boolean; base?: string }>(), { compact: false, base: '' });
onMounted(loadProgress);

const stationDone = (n: number) => !!progress.done[`${props.module}:station:${n}`];
const checks = computed(() => registry[props.module] ?? []);
const checksDone = computed(() => checks.value.filter((id) => progress.done[`${props.module}:check:${id}`]).length);
const total = computed(() => STATIONS.length + checks.value.length);
const doneCount = computed(() => STATIONS.filter((s) => stationDone(s.n)).length + checksDone.value);
const pct = computed(() => (progress.loaded && total.value ? Math.round((100 * doneCount.value) / total.value) : 0));
const href = (key: string) => (props.base ? withBase(props.base) : '') + '#' + key;
function reset() {
  if (confirm('Reset your progress for this module?')) {
    unmarkPrefix(`${props.module}:`);
    try { localStorage.removeItem('mpc-recall-v1'); } catch {}
  }
}
</script>

<template>
  <nav class="mp mpc-card" :class="{ compact }" :aria-label="`Module ${module} progress`">
    <div class="top">
      <div>
        <div class="mpc-kicker">Your journey</div>
        <div class="pct" aria-live="polite"><strong>{{ pct }}%</strong> complete
          <span class="sub" v-if="progress.loaded && checks.length">· {{ checksDone }}/{{ checks.length }} checks passed</span>
        </div>
      </div>
      <button class="mpc-btn small" type="button" @click="reset">Reset</button>
    </div>
    <div class="bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Module progress">
      <div class="fill" :style="{ width: pct + '%' }" />
    </div>
    <ol class="stations">
      <li v-for="s in STATIONS" :key="s.n" :class="[`c-${s.color}`, { done: stationDone(s.n) }]">
        <a :href="href(s.key)" class="mpc-focus">
          <span class="dot"><Icon :name="stationDone(s.n) ? 'check' : s.icon" :size="16" /></span>
          <span class="txt"><span class="n">Station {{ s.n }}</span>{{ s.title }}</span>
        </a>
      </li>
    </ol>
    <p class="note" v-if="!compact">Progress is saved in this browser only (localStorage). Nothing is sent anywhere.</p>
  </nav>
</template>

<style scoped>
.mp { padding: 16px 18px; }
.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.pct { font-size: var(--fs-md); }
.pct strong { font-size: var(--fs-h3); }
.sub { color: var(--vp-c-text-2); font-size: var(--fs-sm); }
.bar { height: 10px; border: 1px solid var(--mpc-line); border-radius: var(--r-pill); margin: 10px 0 14px; overflow: hidden; background: var(--mpc-paper); }
.fill { height: 100%; background: linear-gradient(90deg, var(--mpc-violet), var(--mpc-teal)); transition: width 0.4s ease; }
.stations { list-style: none; padding: 0 !important; margin: 0 !important; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stations li { margin: 0 !important; }
.stations a { display: flex; align-items: center; gap: 8px; text-decoration: none !important; color: var(--vp-c-text-1) !important; font-weight: var(--fw-semibold); font-size: var(--fs-sm); line-height: 1.25; padding: 6px; border-radius: var(--r-md); }
.stations a:hover { background: var(--vp-c-bg-soft); }
.n { display: block; font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-2); }
.dot { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; border: 1px solid var(--mpc-line); flex: none; }
.c-coral .dot { background: var(--mpc-coral-soft); }
.c-violet .dot { background: var(--mpc-violet-soft); }
.c-amber .dot { background: var(--mpc-amber-soft); }
.c-teal .dot { background: var(--mpc-teal-soft); }
.done .dot { background: var(--mpc-teal); color: #fff; }
.note { font-size: var(--fs-xs); color: var(--vp-c-text-3); margin: 10px 0 0 !important; }
@media (max-width: 640px) {
  .stations { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
</style>
