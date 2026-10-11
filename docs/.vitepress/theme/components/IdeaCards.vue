<script setup lang="ts">
import { fmt } from '../progress';
/** A grid of short, colorful idea cards: much easier to scan than a table. */
withDefaults(defineProps<{ cards: { title: string; body: string; icon?: string; color?: string; tag?: string }[]; cols?: number }>(), { cols: 3 });
const COLORS = ['violet', 'amber', 'teal', 'coral', 'sky', 'lime'];
</script>
<template>
  <div class="ideas" :style="{ '--cols': cols }">
    <div v-for="(c, i) in cards" :key="i" class="idea" :class="`c-${c.color ?? COLORS[i % COLORS.length]}`">
      <div class="h">
        <span class="ic"><Icon :name="c.icon ?? 'bulb'" :size="17" /></span>
        <strong v-html="fmt(c.title)" />
      </div>
      <p v-html="fmt(c.body)" />
      <span v-if="c.tag" class="tag" v-html="fmt(c.tag)" />
    </div>
  </div>
</template>
<style scoped>
.ideas { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 12px; margin: 22px 0; }
.idea { border: 2px solid var(--mpc-ink); border-radius: 14px; padding: 12px 14px; box-shadow: 3px 3px 0 var(--mpc-shadow); display: flex; flex-direction: column; }
.c-violet { background: var(--mpc-violet-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-teal { background: var(--mpc-teal-soft); }
.c-coral { background: var(--mpc-coral-soft); }
.c-sky { background: var(--mpc-sky-soft); }
.c-lime { background: var(--mpc-lime-soft); }
.h { display: flex; gap: 8px; align-items: center; font-size: 15.5px; line-height: 1.3; }
.ic { width: 30px; height: 30px; flex: none; border-radius: 9px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); display: grid; place-items: center; }
p { margin: 8px 0 0 !important; font-size: 14.5px !important; line-height: 1.55 !important; flex: 1; }
.tag { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: var(--vp-c-text-2); }
@media (max-width: 860px) { .ideas { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .ideas { grid-template-columns: 1fr; } }
</style>
