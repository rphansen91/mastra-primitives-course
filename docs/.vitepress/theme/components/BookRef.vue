<script setup lang="ts">
import { computed } from 'vue';
import { BOOKS, type BookId } from '../reading';
/** A small chip citing a book chapter, linked to the official free book page. */
const props = defineProps<{ book: BookId; chapter?: string; page?: string }>();
const b = computed(() => BOOKS[props.book]);
</script>
<template>
  <a class="bookref" :href="b.href" target="_blank" rel="noopener" :title="`${b.title} (${b.edition}) by ${b.author}. Free from the official page.`">
    <Icon name="book" :size="13" /><span class="t"><em>{{ b.short }}</em><template v-if="book === 'principles'"> (3rd ed.)</template></span><span v-if="chapter" class="c">{{ chapter }}</span><span v-if="page" class="p">p. {{ page }}</span>
  </a>
</template>
<style scoped>
.bookref { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 1px 9px; border: 1.5px solid var(--mpc-ink, currentColor); border-radius: 999px; font-size: 12.5px; line-height: 1.6; text-decoration: none !important; color: var(--vp-c-text-1) !important; background: var(--mpc-paper, transparent); vertical-align: 1px; }
.bookref:hover { background: var(--mpc-sky-soft, #eef); }
.c::before, .p::before { content: '·'; margin-right: 6px; color: var(--vp-c-text-3); }
</style>
