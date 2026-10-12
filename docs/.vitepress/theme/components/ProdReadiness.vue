<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { fmt } from '../progress';
import { PROD } from '../production';
/** The enterprise review for one module: what to lean on, how it fails, the guardrails, and the alternatives. Content: theme/production.ts. */
const props = defineProps<{ module: string }>();
const p = computed(() => PROD[props.module]);
const { frontmatter } = useData();
const v = computed(() => frontmatter.value.verified as { core: string; sha: string; date: string } | undefined);
</script>
<template>
  <section v-if="p" class="pr" aria-label="Production readiness">
    <StabilityPanel :ids="p.ids" />
    <div class="verdict mpc-card"><span class="mpc-kicker">Reviewer's verdict</span><p v-html="fmt(p.verdict)" /></div>
    <div class="grid">
      <div class="col c-lime mpc-card"><h3><Icon name="check" :size="16" /> Safe to lean on</h3><ul><li v-for="(s, i) in p.safe" :key="i" v-html="fmt(s)" /></ul></div>
      <div class="col c-amber mpc-card"><h3><Icon name="flask" :size="16" /> Beta, new or caveated</h3><ul><li v-for="(s, i) in p.caution" :key="i" v-html="fmt(s)" /></ul></div>
    </div>
    <div class="fm mpc-card">
      <h3><Icon name="skull" :size="16" /> Failure modes → guardrail</h3>
      <div v-for="(f, i) in p.failures" :key="i" class="row"><span class="mode" v-html="fmt(f.mode)" /><span class="arrow" aria-hidden="true">→</span><span class="guard" v-html="fmt(f.guard)" /></div>
    </div>
    <div class="grid">
      <div class="col c-sky mpc-card"><h3><Icon name="wrench" :size="16" /> Guardrails checklist</h3><ul class="checks"><li v-for="(s, i) in p.guardrails" :key="i" v-html="fmt(s)" /></ul></div>
      <div class="col c-violet mpc-card"><h3><Icon name="compass" :size="16" /> Alternatives</h3><ul><li v-for="(s, i) in p.alternatives" :key="i" v-html="fmt(s)" /></ul></div>
    </div>
    <p v-if="v" class="verified"><Icon name="check" :size="14" /> Verified against <code>@mastra/core@{{ v.core }}</code> at <a :href="`https://github.com/mastra-ai/mastra/tree/${v.sha}`" target="_blank" rel="noopener"><code>{{ v.sha.slice(0, 7) }}</code></a> on {{ v.date }}. A weekly CI job flags this module when the Mastra files it cites change upstream.</p>
    <Quiz :module="module" id="prod" :question="p.check.question" :options="p.check.options" />
  </section>
</template>
<style scoped>
.pr { margin: 20px 0; display: grid; gap: 14px; }
.verified { margin: 0 !important; font-size: var(--fs-sm); color: var(--vp-c-text-2); }
.verified :deep(svg) { vertical-align: -2px; margin-right: 4px; }
.verdict { padding: 12px 16px; background: var(--mpc-paper); }
.verdict p { margin: 4px 0 0 !important; font-size: var(--fs-md); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.col, .fm { padding: 12px 16px; }
h3 { margin: 0 0 6px !important; display: flex; gap: 6px; align-items: center; font-size: var(--fs-md); }
ul { margin: 0 !important; padding-left: 18px !important; }
li { font-size: var(--fs-sm); line-height: 1.5; margin: 4px 0 !important; overflow-wrap: break-word; }
.checks { list-style: '☐  '; }
.col { background: var(--vp-c-bg); border-top: 3px solid var(--rule) !important; }
.c-lime { --rule: var(--mpc-tip); } .c-amber { --rule: var(--mpc-warn); } .c-sky { --rule: var(--mpc-info); } .c-violet { --rule: var(--mod-accent); }
.fm { background: var(--mpc-danger-bg); border-left: 3px solid var(--mpc-danger) !important; }
.row { display: grid; grid-template-columns: 1fr 22px 1fr; gap: 8px; padding: 7px 0; border-top: 1.5px dashed var(--vp-c-divider); font-size: var(--fs-sm); line-height: 1.5; }
.row:first-of-type { border-top: 0; }
.mode { font-weight: 600; overflow-wrap: break-word; }
.guard { overflow-wrap: break-word; }
.arrow { text-align: center; font-weight: var(--fw-semibold); }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } .row { grid-template-columns: 1fr; gap: 2px; } .arrow { display: none; } .guard::before { content: '→ '; font-weight: var(--fw-semibold); } }
</style>
