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
.r-teal, .r-lime { --ink: var(--mpc-tip-ink); } .r-amber { --ink: var(--mpc-warn-ink); } .r-coral { --ink: var(--mpc-danger-ink); } .r-sky { --ink: var(--mpc-info-ink); } .r-violet { --ink: var(--mod-accent); }

summary { list-style: none; display: flex; gap: 12px; align-items: center; padding: 12px 16px; cursor: pointer; border-radius: var(--r-lg); transition: background var(--mpc-dur) var(--mpc-ease); }
summary:hover { background: var(--mpc-surface-2); }
summary::-webkit-details-marker { display: none; }
.ico { width: 32px; height: 32px; border-radius: var(--r-md); display: grid; place-items: center; background: var(--mpc-surface-2); color: var(--ink, var(--vp-c-text-2)); flex: none; }
summary > span:nth-child(2) { flex: 1; line-height: 1.35; }
summary strong { font-weight: var(--fw-semibold); }
.chev { transition: transform var(--mpc-dur) var(--mpc-ease); color: var(--vp-c-text-2); }
details[open] .chev { transform: rotate(180deg); }
details[open] > summary { border-radius: var(--r-lg) var(--r-lg) 0 0; }
.body { padding: 4px 18px 16px; border-top: 1px solid var(--mpc-line); min-width: 0; }
</style>
