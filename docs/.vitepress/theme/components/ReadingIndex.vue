<script setup lang="ts">
import { computed } from 'vue';
import { BOOKS, READING, QUOTES, PEOPLE, citeLabel, citeHref, type BookId } from '../reading';
import { fmt } from '../progress';
/** Renders parts of /reading from theme/reading.ts so the page and the modules can't drift apart. */
const props = defineProps<{ part: 'books' | 'chapters' | 'quotes' }>();
const label = (m: string) => (m === 'adopting' ? 'Adopting' : `M${m}`);
const href = (m: string) => (m === 'adopting' ? './adopting' : `./m${m}/#further-reading`);
const chapters = computed(() => {
  const rows: { book: BookId; chapter: string; modules: string[] }[] = [];
  for (const [m, r] of Object.entries(READING)) for (const b of r.books) {
    const row = rows.find((x) => x.book === b.book && x.chapter === b.chapter);
    if (row) row.modules.push(m); else rows.push({ book: b.book, chapter: b.chapter, modules: [m] });
  }
  const order: BookId[] = ['principles', 'patterns', 'modular'];
  return rows.sort((a, b) => order.indexOf(a.book) - order.indexOf(b.book) || a.chapter.localeCompare(b.chapter, undefined, { numeric: true }));
});
const quotes = computed(() => Object.entries(QUOTES));
</script>
<template>
  <div v-if="part === 'books'" class="books">
    <a v-for="(b, id) in BOOKS" :key="id" class="book mpc-card" :href="b.href" target="_blank" rel="noopener">
      <span class="mpc-kicker">{{ b.edition }}</span>
      <strong><em>{{ b.title }}</em></strong>
      <span class="by">{{ b.author }}</span>
      <span class="note">{{ b.note }}</span>
      <span class="go">Official page →</span>
    </a>
  </div>
  <table v-else-if="part === 'chapters'" class="chap">
    <thead><tr><th>Book and chapter</th><th>Used in</th></tr></thead>
    <tbody><tr v-for="(r, i) in chapters" :key="i"><td><BookRef :book="r.book" :chapter="r.chapter" /></td><td><a v-for="m in r.modules" :key="m" class="mod" :href="href(m)">{{ label(m) }}</a></td></tr></tbody>
  </table>
  <ol v-else class="quotes">
    <li v-for="[id, q] in quotes" :key="id"><q class="mpc-quote" :data-quote-id="id">{{ q.text }}</q> <span class="att">— <a :href="citeHref(q)" target="_blank" rel="noopener">{{ q.kind === 'founder' ? `${PEOPLE[q.who].name}, "${q.source}" (${q.date})` : citeLabel(q) }}</a></span></li>
  </ol>
</template>
<style scoped>
.books { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 16px 0; }
.book { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; text-decoration: none !important; color: var(--vp-c-text-1) !important; background: var(--mpc-paper); }
.book strong { font-size: var(--fs-md); line-height: 1.3; }
.by { font-size: var(--fs-sm); color: var(--vp-c-text-2); }
.note { font-size: var(--fs-sm); line-height: 1.5; margin-top: 4px; }
.go { margin-top: auto; padding-top: 6px; font-weight: 600; color: var(--vp-c-brand-1); }
.chap { width: 100%; display: table; }
.mod { display: inline-block; margin: 0 6px 2px 0; font-weight: 600; }
.quotes li { margin: 6px 0; line-height: 1.55; }
.mpc-quote { font-style: italic; }
.mpc-quote::before { content: '“'; }
.mpc-quote::after { content: '”'; }
.att { font-size: var(--fs-sm); color: var(--vp-c-text-2); }
</style>
