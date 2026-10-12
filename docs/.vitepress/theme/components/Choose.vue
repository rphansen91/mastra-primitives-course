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
.hdr span { font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 10px; border-radius: var(--r-md); border: 1px solid var(--mpc-line); display: flex; gap: 6px; align-items: center; }
.cell { border: 1px solid var(--mpc-line); border-radius: var(--r-md); padding: 10px 12px; font-size: var(--fs-md); line-height: 1.5; background: var(--mpc-paper); box-shadow: none; }
.hdr .c-teal { color: var(--mpc-tip-ink); border-color: var(--mpc-tip-line); background: var(--mpc-tip-bg); }
.hdr .c-coral { color: var(--mpc-danger-ink); border-color: var(--mpc-danger-line); background: var(--mpc-danger-bg); }
.hdr .c-sky { color: var(--mpc-info-ink); border-color: var(--mpc-info-line); background: var(--mpc-info-bg); }
.cell.c-teal { border-left: 3px solid var(--mpc-tip); } .cell.c-coral { border-left: 3px solid var(--mpc-danger); } .cell.c-sky { border-left: 3px solid var(--mpc-info); }
.ml { display: none; }
.rname { margin-top: 8px; font-weight: var(--fw-semibold); font-size: var(--fs-md); }
.rname span::before { content: '▸ '; color: var(--mpc-violet); }
@media (max-width: 720px) {
  .hdr { display: none; }
  .row { grid-template-columns: 1fr; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid var(--vp-c-divider); }
  .ml { display: block; font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--vp-c-text-2); }
}
</style>
