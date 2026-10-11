<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { progress, loadProgress, STATIONS } from '../progress';
const props = defineProps<{ station: number; module: string }>();
onMounted(loadProgress);
const s = computed(() => STATIONS[props.station - 1]);
const done = (n: number) => !!progress.done[`${props.module}:station:${n}`];
</script>
<template>
  <div class="journey" :class="`c-${s.color}`" role="group" :aria-label="`Station ${station} of 4: ${s.title}`">
    <div class="badge"><Icon :name="s.icon" :size="26" /></div>
    <div class="meta">
      <div class="mpc-kicker">Station {{ station }} of 4</div>
      <div class="title">{{ s.title }}</div>
    </div>
    <ol class="track" aria-hidden="true">
      <li v-for="t in STATIONS" :key="t.n" :class="{ cur: t.n === station, done: done(t.n) }"><span /></li>
    </ol>
  </div>
</template>
<style scoped>
.journey { display: flex; align-items: center; gap: 14px; margin: 64px 0 0; padding: 10px 14px; border-radius: 16px; border: 2px dashed var(--mpc-ink); }
.c-coral { background: var(--mpc-coral-soft); }
.c-violet { background: var(--mpc-violet-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-teal { background: var(--mpc-teal-soft); }
.badge { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); box-shadow: 3px 3px 0 var(--mpc-shadow); }
.title { font-weight: 800; font-size: 18px; }
.meta { flex: 1; }
.track { display: flex; gap: 6px; list-style: none; padding: 0 !important; margin: 0 !important; }
.track li { margin: 0 !important; }
.track span { display: block; width: 26px; height: 8px; border-radius: 99px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); }
.track .done span { background: var(--mpc-teal); }
.track .cur span { background: var(--mpc-ink); width: 40px; }
@media (max-width: 480px) { .track { display: none; } }
</style>
