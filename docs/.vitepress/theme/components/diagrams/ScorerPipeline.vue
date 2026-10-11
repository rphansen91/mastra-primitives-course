<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 270" role="img" aria-label="A scorer is a pipeline: a run's input and output go through preprocess, analyze, generateScore and generateReason, producing a score and a reason. Each stage is a function or an LLM judge prompt. The same scorer can run live on an agent, over stored traces, in CI with runEvals, or inside the loop with isTaskComplete.">
      <ArrowDefs />
      <IllBox :x="10" :y="40" :w="104" :h="62" color="sky" title="run" sub="input + output" :size="14" />
      <Arrow d="M118 71 L140 71" />
      <IllBox :x="144" :y="40" :w="116" :h="62" color="paper" title="preprocess" sub="extract" :size="13.5" />
      <Arrow d="M264 71 L286 71" />
      <IllBox :x="290" :y="40" :w="116" :h="62" color="violet" title="analyze" sub="fn or LLM judge" :size="13.5" />
      <Arrow d="M410 71 L432 71" />
      <IllBox :x="436" :y="40" :w="128" :h="62" color="paper" title="generateScore" sub="→ number" :size="13.5" />
      <Arrow d="M568 71 L590 71" />
      <IllBox :x="594" :y="40" :w="150" :h="62" color="paper" title="generateReason" sub="→ why" :size="13.5" />
      <text x="380" y="24" text-anchor="middle" font-size="12.5" class="t-dim">createScorer({ id, description, judge? }) · each stage optional except generateScore</text>
      <path d="M380 116 L380 140" class="stroke" />
      <path d="M100 140 L660 140" class="stroke" />
      <g v-for="(p, k) in places" :key="p.t">
        <Arrow :d="`M${100 + k * 186.6} 140 L${100 + k * 186.6} 162`" />
        <IllBox :x="20 + k * 186.6" :y="166" :w="160" :h="74" :color="p.c" :title="p.t" :sub="p.s" :size="13.5" />
      </g>
      <text x="380" y="262" text-anchor="middle" font-size="12.5" class="t-dim">One definition, four places to run it.</text>
    </svg>
  </figure>
</template>
<script setup lang="ts">
const places = [
  { t: 'live on an agent', s: 'scorers: { … sampling }', c: 'teal' },
  { t: 'over traces', s: 'scoreTraces', c: 'amber' },
  { t: 'in CI', s: 'runEvals(dataset)', c: 'lime' },
  { t: 'inside the loop', s: 'isTaskComplete', c: 'coral' },
];
</script>
