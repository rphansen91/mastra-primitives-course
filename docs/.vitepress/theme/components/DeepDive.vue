<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: 'the source' });
</script>
<template>
  <details class="deep mpc-card">
    <summary class="mpc-focus">
      <span class="ico"><Icon name="book" :size="17" /></span>
      <span><span class="mpc-kicker">Go deeper into the source</span><br /><strong>{{ title }}</strong></span>
      <span class="chev" aria-hidden="true"><Icon name="down" :size="16" /></span>
    </summary>
    <div class="body"><slot /></div>
  </details>
</template>
<style scoped>
.deep { padding: 0; background: var(--mpc-sky-soft); }
summary { list-style: none; display: flex; gap: 12px; align-items: center; padding: 12px 16px; cursor: pointer; border-radius: 12px; }
summary::-webkit-details-marker { display: none; }
.ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); flex: none; }
summary > span:nth-child(2) { flex: 1; line-height: 1.35; }
.chev { transition: transform 0.2s; }
details[open] .chev { transform: rotate(180deg); }
.body { padding: 4px 18px 16px; border-top: 2px dashed var(--mpc-ink); background: var(--mpc-paper); border-radius: 0 0 12px 12px; }
.body :deep(table) { font-size: 14px; }
@media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
</style>
