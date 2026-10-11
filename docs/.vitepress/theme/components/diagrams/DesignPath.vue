<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 200" role="img" aria-label="How a core contributor designs a primitive: 1, read the source and tests at the pinned commit. 2, write the break-it test first; it fails on stock Mastra. 3, study prior art in at least two systems. 4, implement the smallest surface, outside core if possible. 5, write the RFC last, from what you learned.">
      <ArrowDefs />
      <g v-for="(s, k) in steps" :key="s.t">
        <IllBox :x="8 + k * 152" :y="44" :w="132" :h="92" :color="s.c" :size="14" />
        <circle :cx="30 + k * 152" :cy="44" r="15" class="f-paper outline" />
        <text :x="30 + k * 152" :y="49" text-anchor="middle" font-size="14" class="t-strong">{{ k + 1 }}</text>
        <text :x="74 + k * 152" y="84" text-anchor="middle" font-size="14.5" class="t-strong">{{ s.t }}</text>
        <text :x="74 + k * 152" y="106" text-anchor="middle" font-size="11.5" class="t-dim">{{ s.a }}</text>
        <text :x="74 + k * 152" y="121" text-anchor="middle" font-size="11.5" class="t-dim">{{ s.b }}</text>
        <Arrow v-if="k < 4" :d="`M${144 + k * 152} 90 L${156 + k * 152} 90`" />
      </g>
      <path d="M690 150 C690 186 74 186 74 150" class="stroke" stroke-dasharray="6 6" marker-end="url(#ill-arrow)" />
      <text x="380" y="194" text-anchor="middle" font-size="12" class="t-dim">a reviewer's question sends you back to step 1, and that's normal</text>
    </svg>
  </figure>
</template>
<script setup lang="ts">
const steps = [
  { t: 'Read', a: 'source + tests', b: 'at the pinned commit', c: 'sky' },
  { t: 'Break it', a: 'a test that fails', b: 'on stock Mastra', c: 'coral' },
  { t: 'Prior art', a: 'two systems,', b: 'real APIs', c: 'amber' },
  { t: 'Build small', a: 'outside core', b: 'if at all possible', c: 'teal' },
  { t: 'RFC last', a: 'from what', b: 'you learned', c: 'violet' },
]
</script>
