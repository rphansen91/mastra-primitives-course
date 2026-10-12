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
/* Inline citation, not a pill: wraps cleanly inside sentences and table cells. */
.bookref { display: inline; padding: 1px 6px; border: 1px solid var(--mpc-line-strong); border-radius: var(--r-sm); -webkit-box-decoration-break: clone; box-decoration-break: clone; font-size: 0.86em; line-height: 1.9; text-decoration: none !important; color: var(--vp-c-text-1) !important; background: var(--mpc-surface-2); white-space: normal; }
.bookref:hover { border-color: var(--vp-c-brand-1); }
.bookref :deep(svg) { display: inline-block; vertical-align: -2px; margin-right: 4px; }
.c::before, .p::before { content: ' · '; color: var(--vp-c-text-3); }
</style>
