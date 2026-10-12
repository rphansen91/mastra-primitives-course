<script setup lang="ts">
import { computed } from 'vue';
import { READING, BOOKS, PEOPLE } from '../reading';
import { fmt } from '../progress';
import { withBase } from 'vitepress';
/** Per-module further reading: book chapters, founders' essays, and one outside source where useful. */
const props = defineProps<{ module: string }>();
const r = computed(() => READING[props.module]);
</script>
<template>
  <section v-if="r" class="fr mpc-card" aria-label="Further reading">
    <div v-if="r.books.length" class="grp">
      <h3><Icon name="book" :size="16" /> From the books <small>(free from the official pages: read the chapter, not just our summary)</small></h3>
      <ul><li v-for="(b, i) in r.books" :key="i"><BookRef :book="b.book" :chapter="b.chapter" />: <span v-html="fmt(b.why)" /></li></ul>
    </div>
    <div v-if="r.essays.length" class="grp">
      <h3><Icon name="pen" :size="16" /> From the people who build it</h3>
      <ul><li v-for="(e, i) in r.essays" :key="i">{{ PEOPLE[e.who].name }}, <a :href="e.href" target="_blank" rel="noopener">{{ e.title }}</a> ({{ e.date }}): <span v-html="fmt(e.why)" /></li></ul>
    </div>
    <div v-if="r.outside?.length" class="grp">
      <h3><Icon name="compass" :size="16" /> Go deeper</h3>
      <ul><li v-for="(o, i) in r.outside" :key="i"><a :href="o.href" target="_blank" rel="noopener">{{ o.title }}</a>: <span v-html="fmt(o.why)" /></li></ul>
    </div>
    <p class="fine">Book citations are short excerpts for teaching, with attribution. Behavior claims in this course are checked against pinned Mastra source, not against the books. This is an independent course; see <a :href="withBase('/reading')">Reading list</a>.</p>
  </section>
</template>
<style scoped>
.fr { padding: 12px 18px; margin: 16px 0; display: grid; gap: 8px; background: var(--mpc-paper); }
h3 { margin: 0 0 4px !important; display: flex; align-items: center; gap: 6px; font-size: 15.5px; flex-wrap: wrap; }
h3 small { font-weight: 400; font-size: 12.5px; color: var(--vp-c-text-2); }
ul { margin: 0 !important; padding-left: 18px !important; }
li { font-size: 14.5px; line-height: 1.6; margin: 4px 0 !important; overflow-wrap: break-word; }
.fine { margin: 4px 0 0 !important; font-size: 12.5px; color: var(--vp-c-text-2); }
</style>
