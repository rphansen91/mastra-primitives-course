<script setup lang="ts">
import { computed } from 'vue';
import { fmt } from '../progress';
import { PROD } from '../production';
/** The enterprise review for one module: what to lean on, how it fails, the guardrails, and the alternatives. Content: theme/production.ts. */
const props = defineProps<{ module: string }>();
const p = computed(() => PROD[props.module]);
</script>
<template>
  <section v-if="p" class="pr" aria-label="Production readiness">
    <StabilityPanel :ids="p.ids" />
    <div class="verdict mpc-card"><span class="mpc-kicker">Reviewer's verdict</span><p v-html="fmt(p.verdict)" /></div>
    <div class="grid">
      <div class="col c-lime mpc-card"><h4><Icon name="check" :size="16" /> Safe to lean on</h4><ul><li v-for="(s, i) in p.safe" :key="i" v-html="fmt(s)" /></ul></div>
      <div class="col c-amber mpc-card"><h4><Icon name="flask" :size="16" /> Beta, new or caveated</h4><ul><li v-for="(s, i) in p.caution" :key="i" v-html="fmt(s)" /></ul></div>
    </div>
    <div class="fm mpc-card">
      <h4><Icon name="skull" :size="16" /> Failure modes → guardrail</h4>
      <div v-for="(f, i) in p.failures" :key="i" class="row"><span class="mode" v-html="fmt(f.mode)" /><span class="arrow" aria-hidden="true">→</span><span class="guard" v-html="fmt(f.guard)" /></div>
    </div>
    <div class="grid">
      <div class="col c-sky mpc-card"><h4><Icon name="wrench" :size="16" /> Guardrails checklist</h4><ul class="checks"><li v-for="(s, i) in p.guardrails" :key="i" v-html="fmt(s)" /></ul></div>
      <div class="col c-violet mpc-card"><h4><Icon name="compass" :size="16" /> Alternatives</h4><ul><li v-for="(s, i) in p.alternatives" :key="i" v-html="fmt(s)" /></ul></div>
    </div>
  </section>
</template>
<style scoped>
.pr { margin: 20px 0; display: grid; gap: 14px; }
.verdict { padding: 12px 16px; background: var(--mpc-paper); }
.verdict p { margin: 4px 0 0 !important; font-size: 15.5px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.col, .fm { padding: 12px 16px; }
h4 { margin: 0 0 6px !important; display: flex; gap: 6px; align-items: center; font-size: 15.5px; }
ul { margin: 0 !important; padding-left: 18px !important; }
li { font-size: 14.5px; line-height: 1.5; margin: 4px 0 !important; overflow-wrap: anywhere; }
.checks { list-style: '☐  '; }
.c-lime { background: var(--mpc-lime-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-sky { background: var(--mpc-sky-soft); }
.c-violet { background: var(--mpc-violet-soft); }
.fm { background: var(--mpc-coral-soft); }
.row { display: grid; grid-template-columns: 1fr 22px 1fr; gap: 8px; padding: 7px 0; border-top: 1.5px dashed var(--vp-c-divider); font-size: 14.5px; line-height: 1.5; }
.row:first-of-type { border-top: 0; }
.mode { font-weight: 600; overflow-wrap: anywhere; }
.guard { overflow-wrap: anywhere; }
.arrow { text-align: center; font-weight: 800; }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } .row { grid-template-columns: 1fr; gap: 2px; } .arrow { display: none; } .guard::before { content: '→ '; font-weight: 800; } }
</style>
