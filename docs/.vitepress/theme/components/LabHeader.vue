<script setup lang="ts">
// Top of every lab page: what you run, how long it takes, and where the code lives.
withDefaults(defineProps<{ module: string; folder: string; runs?: string; tests?: number; mood?: string }>(), { runs: 'a few seconds', mood: 'happy' });
const REPO = 'https://github.com/rphansen91/mastra-primitives-course/tree/main/labs/';
</script>
<template>
  <section class="lab-hero mpc-card" aria-label="Lab overview">
    <div class="chips">
      <span class="chip"><Icon name="flask" :size="15" /> Lab {{ Number(module) }}</span>
      <span class="chip"><Icon name="clock" :size="15" /> runs in {{ runs }}</span>
      <span class="chip"><Icon name="check" :size="15" /> no API keys: a scripted mock model</span>
      <span class="chip" v-if="tests"><Icon name="star" :size="15" /> {{ tests }} tests in CI</span>
    </div>
    <div class="row">
      <div class="txt">
        <slot />
        <p class="code"><Icon name="book" :size="15" /> Code: <a :href="REPO + folder" target="_blank" rel="noopener"><code>labs/{{ folder }}</code></a> · against the published <code>@mastra/core@1.76.0</code></p>
      </div>
    </div>
  </section>
</template>
<style scoped>
.lab-hero { background: var(--mpc-surface-2); margin: 18px 0 28px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px 6px; margin-bottom: 10px; }
.chips { color: var(--vp-c-text-2); }
.chip { display: inline-flex; gap: 5px; align-items: center; font-size: var(--fs-sm); font-weight: var(--fw-medium); }
.chip + .chip::before { content: "·"; margin: 0 8px 0 2px; color: var(--vp-c-text-3); }
@media (max-width: 560px) { .chips { gap: 4px 14px; } .chip + .chip::before { content: none; } }
.row { display: flex; gap: 14px; align-items: flex-start; }
.txt { min-width: 0; flex: 1; }
.txt :deep(p) { margin: 4px 0 8px !important; }
.code { font-size: var(--fs-sm); }
@media (max-width: 560px) { .row { flex-direction: column; } }
</style>
