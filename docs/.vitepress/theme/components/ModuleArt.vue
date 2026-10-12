<script setup lang="ts">
/**
 * One monoline glyph per module, drawn in the module's signature color. Used on curriculum
 * cards, module headers and the certificate so each module is recognisable at a glance.
 */
withDefaults(defineProps<{ module: string; size?: number }>(), { size: 40 });
// 48x48, 1.75 stroke. "a" paths take the accent, the rest are ink.
const ART: Record<string, { ink: string; a: string }> = {
  // 00 setup: a terminal with a pinned commit
  '00': { ink: 'M7 11h34v26H7zM7 17h34', a: 'M13 24l4 3-4 3M21 31h8' },
  // 01 first principles: a hand-drawn loop around a dot
  '01': { ink: 'M24 9c9 0 15 6 15 15s-6 15-15 15S9 33 9 24c0-5 2-9 6-12', a: 'M12 8l3 4-4 3M24 21.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z' },
  // 02 agent loop: ring of four stations
  '02': { ink: 'M24 10a14 14 0 0 1 14 14M38 24a14 14 0 0 1-14 14M24 38a14 14 0 0 1-14-14M10 24a14 14 0 0 1 14-14', a: 'M24 6.5v7M41.5 24h-7M24 41.5v-7M6.5 24h7M35 10l3 4-4 2' },
  // 03 processors: a stream passing through filters
  '03': { ink: 'M6 24h36M14 14v20M24 14v20M34 14v20', a: 'M38 20l4 4-4 4M10 21h0M19 27h0M29 21h0' },
  // 04 memory: a context window over stacked messages
  '04': { ink: 'M10 12h28M10 19h28M10 26h28M10 33h20M10 40h14', a: 'M7 16h34v20H7z' },
  // 05 workflows: a small DAG
  '05': { ink: 'M14 14l10 10M14 34l10-10M24 24h10', a: 'M10 10h8v8h-8zM10 30h8v8h-8zM20 20h8v8h-8zM34 20h8v8h-8z' },
  // 06 signals: an envelope arriving at a running loop
  '06': { ink: 'M24 36a10 10 0 1 1 10-10', a: 'M4 9h16v11H4zM4 10l8 5 8-5M34 26l-3-4M34 26l4-3' },
  // 07 durability: a process restarted after a crash
  '07': { ink: 'M11 24a13 13 0 1 0 4-9.4M11 9v6h6', a: 'M25 15l-5 10h6l-3 8' },
  // 08 multi-agent: two loops sharing a channel
  '08': { ink: 'M16 24a7 7 0 1 1-7-7M39 31a7 7 0 1 1 0-14', a: 'M18 22h12M30 26H18M27 19l3 3-3 3M21 29l-3-3 3-3' },
  // 09 evals: a trace with a grade
  '09': { ink: 'M8 38V10M8 38h32', a: 'M12 32l7-9 6 5 10-13M33 15h3v3' },
  // 10 capstone: a blueprint and a compass
  '10': { ink: 'M8 8h32v32H8zM8 16h32M16 8v32', a: 'M29 21l-5 14M29 21l5 14M26 30h6M29 19v2' },
};
</script>

<template>
  <svg class="mart" :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path :d="ART[module]?.ink" class="ink" />
    <path :d="ART[module]?.a" class="acc" />
  </svg>
</template>

<style scoped>
.mart { flex: none; overflow: visible; }
path { fill: none; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ink { stroke: var(--vp-c-text-2); }
.acc { stroke: var(--art, var(--mod-accent, var(--vp-c-brand-1))); stroke-width: 2; }
</style>
