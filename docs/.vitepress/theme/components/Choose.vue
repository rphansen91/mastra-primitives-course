<script setup lang="ts">
import { fmt } from '../progress';
/** Decision table as cards: reach for it when / skip it when / reach for this instead. */
defineProps<{ rows: { name?: string; when: string; not: string; alt: string }[]; subject?: string }>();
</script>
<template>
  <div class="choose" role="table" :aria-label="`When to use ${subject ?? 'it'}`">
    <div class="hdr" role="row">
      <span role="columnheader" class="c-teal"><Icon name="check" :size="15" /> Reach for {{ subject ?? 'it' }} when…</span>
      <span role="columnheader" class="c-coral"><Icon name="x" :size="15" /> Skip it when…</span>
      <span role="columnheader" class="c-sky"><Icon name="compass" :size="15" /> …reach for this instead</span>
    </div>
    <template v-for="(r, i) in rows" :key="i">
    <div v-if="r.name" class="rname" role="row"><span role="rowheader" v-html="fmt(r.name)" /></div>
    <div class="row" role="row">
      <span role="cell" class="cell c-teal"><span class="ml">Reach for it when</span><span v-html="fmt(r.when)" /></span>
      <span role="cell" class="cell c-coral"><span class="ml">Skip it when</span><span v-html="fmt(r.not)" /></span>
      <span role="cell" class="cell c-sky"><span class="ml">Instead</span><span v-html="fmt(r.alt)" /></span>
    </div>
    </template>
  </div>
</template>
<style scoped>
.choose { margin: 24px 0; display: grid; gap: 10px; }
.hdr, .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.hdr span { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 6px 10px; border-radius: 10px; border: 2px solid var(--mpc-ink); display: flex; gap: 6px; align-items: center; }
.cell { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; font-size: 15px; line-height: 1.5; background: var(--mpc-paper); box-shadow: 3px 3px 0 var(--mpc-shadow); }
.hdr .c-teal, .cell.c-teal { background: var(--mpc-teal-soft); }
.hdr .c-coral, .cell.c-coral { background: var(--mpc-coral-soft); }
.hdr .c-sky, .cell.c-sky { background: var(--mpc-sky-soft); }
.ml { display: none; }
.rname { margin-top: 8px; font-weight: 800; font-size: 16px; }
.rname span::before { content: '▸ '; color: var(--mpc-violet); }
@media (max-width: 720px) {
  .hdr { display: none; }
  .row { grid-template-columns: 1fr; gap: 6px; padding-bottom: 10px; border-bottom: 2px dashed var(--vp-c-divider); }
  .ml { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vp-c-text-2); }
}
</style>
