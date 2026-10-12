<script setup lang="ts">
/** "The book says X, Mastra does Y": a book quote next to verified framework behavior. */
defineProps<{ quote: string; version?: string }>();
</script>
<template>
  <aside class="bs mpc-card" aria-label="The book vs Mastra">
    <div class="col book"><span class="mpc-kicker"><Icon name="book" :size="14" /> The book says</span><p><Cite :id="quote" /></p></div>
    <div class="col fw"><span class="mpc-kicker"><Icon name="check" :size="14" /> Mastra {{ version ?? '1.76.0' }} does</span><div class="body"><slot /></div></div>
  </aside>
</template>
<style scoped>
.bs { display: grid; grid-template-columns: 1fr 1fr; margin: 18px 0; overflow: hidden; padding: 0 !important; }
.col { padding: 12px 16px; }
.book { background: var(--mpc-amber-soft); border-right: 2px solid var(--mpc-ink); }
.fw { background: var(--mpc-lime-soft); }
.col p, .body :deep(p) { margin: 6px 0 0 !important; font-size: var(--fs-md); line-height: 1.55; }
.mpc-kicker { display: inline-flex; gap: 5px; align-items: center; }
@media (max-width: 640px) { .bs { grid-template-columns: 1fr; } .book { border-right: 0; border-bottom: 1px solid var(--mpc-line); } }
</style>
