<script setup lang="ts">
// A labelled, collapsible answer: solutions, model answers, hints. Native <details>, so it works without JS.
withDefaults(defineProps<{ title?: string; kicker?: string; color?: 'violet' | 'teal' | 'amber' | 'coral' | 'sky' | 'lime'; icon?: string }>(), {
  title: 'Show the solution', kicker: 'Solution', color: 'teal', icon: 'bulb',
});
</script>
<template>
  <details class="reveal mpc-card" :class="`r-${color}`">
    <summary class="mpc-focus">
      <span class="ico"><Icon :name="icon" :size="17" /></span>
      <span><span class="mpc-kicker">{{ kicker }}</span><br /><strong>{{ title }}</strong></span>
      <span class="chev" aria-hidden="true"><Icon name="down" :size="16" /></span>
    </summary>
    <div class="body"><slot /></div>
  </details>
</template>
<style scoped>
.reveal { padding: 0; }
.r-teal { background: var(--mpc-teal-soft); } .r-violet { background: var(--mpc-violet-soft); } .r-amber { background: var(--mpc-amber-soft); }
.r-coral { background: var(--mpc-coral-soft); } .r-sky { background: var(--mpc-sky-soft); } .r-lime { background: var(--mpc-lime-soft); }
summary { list-style: none; display: flex; gap: 12px; align-items: center; padding: 12px 16px; cursor: pointer; border-radius: 12px; }
summary::-webkit-details-marker { display: none; }
.ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); flex: none; }
summary > span:nth-child(2) { flex: 1; line-height: 1.35; }
.chev { transition: transform 0.2s; }
details[open] .chev { transform: rotate(180deg); }
.body { padding: 4px 18px 16px; border-top: 2px dashed var(--mpc-ink); background: var(--mpc-paper); border-radius: 0 0 12px 12px; min-width: 0; }
@media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
</style>
