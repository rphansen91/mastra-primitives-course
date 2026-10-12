<script setup lang="ts">
/**
 * Loopy: a monoline robot whose antenna is a loop arrow. Loopy only appears where it reports
 * state (a visualizer's current step, a quiz answer, a lab's outcome), and the antenna color
 * carries that state: accent = working, green = done, red = something is wrong, grey = parked.
 */
const props = withDefaults(defineProps<{ mood?: 'happy' | 'thinking' | 'alarmed' | 'sleepy' | 'cheer'; size?: number; label?: string }>(), {
  mood: 'happy',
  size: 48,
});
const word = { happy: 'content', thinking: 'working on it', alarmed: 'alarmed', sleepy: 'parked, waiting', cheer: 'pleased' } as const;
const aria = props.label ?? `Loopy: ${word[props.mood]}`;
</script>

<template>
  <svg class="loopy" :class="`mood-${mood}`" :width="size" :height="size" viewBox="0 0 48 48" role="img" :aria-label="aria">
    <g class="ant">
      <path d="M24 13.5 V9.5" />
      <path d="M27.6 4.2 A3.9 3.9 0 1 1 24 1.9" />
      <path d="M22.6 0.6 L24.4 2 L22.8 3.6" />
    </g>
    <rect class="head" x="5.5" y="13.5" width="37" height="27" rx="10" />
    <path class="ear" d="M5.5 24 H3.5 M42.5 24 H44.5" />
    <g class="face" v-if="mood === 'happy' || mood === 'cheer'">
      <path d="M15.5 26 Q18 23 20.5 26 M27.5 26 Q30 23 32.5 26" />
      <path d="M19.5 31.5 Q24 35 28.5 31.5" />
    </g>
    <g class="face" v-else-if="mood === 'thinking'">
      <circle cx="18" cy="25.5" r="1.7" class="dotf" /><circle cx="30" cy="25.5" r="1.7" class="dotf" />
      <path d="M20.5 33 H27.5" />
    </g>
    <g class="face" v-else-if="mood === 'alarmed'">
      <circle cx="18" cy="25.5" r="2.8" /><circle cx="30" cy="25.5" r="2.8" />
      <circle cx="24" cy="33" r="2" />
    </g>
    <g class="face" v-else>
      <path d="M15.5 26 H20.5 M27.5 26 H32.5" />
      <path d="M22 33 Q24 34 26 33" />
    </g>
  </svg>
</template>

<style scoped>
.loopy { flex: none; overflow: visible; --st: var(--mod-accent, var(--vp-c-brand-1)); }
.loopy path, .loopy circle, .loopy rect { fill: none; stroke: var(--vp-c-text-1); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.loopy .head { fill: var(--vp-c-bg); }
.loopy .dotf { fill: var(--vp-c-text-1); stroke: none; }
.loopy .ant path { stroke: var(--st); stroke-width: 2; }
.mood-cheer, .mood-happy { --st: var(--mpc-tip); }
.mood-alarmed { --st: var(--mpc-danger); }
.mood-alarmed .head { stroke: var(--mpc-danger); }
.mood-sleepy { --st: var(--vp-c-text-3); }
@media (prefers-reduced-motion: no-preference) {
  .mood-thinking .ant { animation: spin 2.4s linear infinite; transform-origin: 24px 5.8px; transform-box: view-box; }
  .mood-cheer { animation: bob 0.5s var(--mpc-ease, ease) 2; }
}
@keyframes spin { 0%, 70% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
@keyframes bob { 50% { transform: translateY(-2px); } }
</style>
