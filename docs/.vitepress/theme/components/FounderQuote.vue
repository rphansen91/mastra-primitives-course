<script setup lang="ts">
import { computed } from 'vue';
import { QUOTES, PEOPLE } from '../reading';
/** A block quote from one of Mastra's founders: verbatim, attributed and linked. One per module at most. */
const props = defineProps<{ id: string }>();
const q = computed(() => { const x = QUOTES[props.id]; return x && x.kind === 'founder' ? x : undefined; });
</script>
<template>
  <figure v-if="q" class="fq mpc-card">
    <blockquote><p class="mpc-quote" :data-quote-id="id">{{ q.text }}</p></blockquote>
    <figcaption>{{ PEOPLE[q.who].name }}, {{ PEOPLE[q.who].role }}, in <a :href="q.href" target="_blank" rel="noopener">{{ q.source }}</a> ({{ q.date }})</figcaption>
    <div v-if="$slots.default" class="ctx"><slot /></div>
  </figure>
  <span v-else class="cite-missing">[missing founder quote {{ id }}]</span>
</template>
<style scoped>
.fq { margin: 24px 0; padding: 4px 18px 4px 20px; background: transparent; border: 0 !important; border-left: 3px solid var(--mod-accent) !important; border-radius: 0; }
blockquote { margin: 0 !important; padding: 0 !important; border: 0 !important; }
.mpc-quote { margin: 0 !important; font-size: var(--fs-body); line-height: 1.5; font-style: italic; color: var(--vp-c-text-1); }
.mpc-quote::before { content: '“'; }
.mpc-quote::after { content: '”'; }
figcaption { margin-top: 6px; font-size: var(--fs-sm); color: var(--vp-c-text-2); }
.ctx { margin-top: 8px; font-size: var(--fs-sm); }
.ctx :deep(p) { margin: 4px 0 !important; }
.cite-missing { color: red; font-weight: var(--fw-semibold); }
</style>
