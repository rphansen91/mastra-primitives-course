<script setup lang="ts">
import { computed } from 'vue';
import { QUOTES, BOOKS, citeHref, citeLabel } from '../reading';
/** An inline, verbatim quote from theme/reading.ts with a linked attribution. */
const props = defineProps<{ id: string }>();
const q = computed(() => QUOTES[props.id]);
const short = computed(() => {
  const x = q.value;
  if (!x) return '';
  if (x.kind === 'founder') return x.source;
  return `${BOOKS[x.book].short}${x.book === 'principles' ? ' (3rd ed.)' : ''}, ${x.chapter}${x.page ? `, p. ${x.page}` : ''}`;
});
</script>
<template>
  <span v-if="q" class="cite"><q class="mpc-quote" :data-quote-id="id">{{ q.text }}</q> <a class="src" :href="citeHref(q)" target="_blank" rel="noopener" :title="citeLabel(q)">({{ short }})</a></span>
  <span v-else class="cite-missing">[missing quote {{ id }}]</span>
</template>
<style scoped>
.mpc-quote { font-style: italic; }
.mpc-quote::before { content: '“'; }
.mpc-quote::after { content: '”'; }
.src { font-size: 0.86em; white-space: normal; }
.cite-missing { color: red; font-weight: 700; }
</style>
