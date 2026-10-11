<script setup lang="ts">
// Small stroke icon set (24x24, 2px) so chrome looks the same on every OS (no emoji fonts needed).
defineProps<{ name: string; size?: number }>();
const P: Record<string, string> = {
  puzzle: 'M9 3h3a2 2 0 1 1 4 0h3v5a2 2 0 1 1 0 4v6h-5a2 2 0 1 0-4 0H4v-6a2 2 0 1 0 0-4V3z',
  wrench: 'M14.5 4.5a4.5 4.5 0 0 0-5.6 5.9L3 16.3 6.7 20l5.9-5.9a4.5 4.5 0 0 0 5.9-5.6l-2.7 2.7-2.8-.6-.6-2.8z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9',
  check: 'M4 12.5 9.5 18 20 6',
  x: 'M6 6l12 12M18 6 6 18',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v6H5a1 1 0 0 1-1-1zM20 15h-3v6h2a1 1 0 0 0 1-1z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  terminal: 'M3 5h18v14H3zM7 9l3 3-3 3M12 15h5',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  download: 'M12 3v12M7 10l5 5 5-5M4 19h16',
  print: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  next: 'M9 5l7 7-7 7',
  prev: 'M15 5l-7 7 7 7',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  skull: 'M12 3a8 8 0 0 0-5 14.2V21h10v-3.8A8 8 0 0 0 12 3zM9 11h.01M15 11h.01M10 21v-3M14 21v-3',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  cards: 'M7 3h12v15H7zM4 6v15h12',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
};
</script>
<template>
  <svg :width="size ?? 18" :height="size ?? 18" :style="{ width: `${size ?? 18}px`, height: `${size ?? 18}px` }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="mpc-icon">
    <path :d="P[name] ?? P.star" />
  </svg>
</template>
<style scoped>
/* Inline width/height win over any inherited `svg { width: 100% }` rule; never let flex squash or stretch it. */
.mpc-icon { flex: 0 0 auto; flex-shrink: 0; vertical-align: -0.2em; display: inline-block; max-width: none; min-width: 0; }
</style>
