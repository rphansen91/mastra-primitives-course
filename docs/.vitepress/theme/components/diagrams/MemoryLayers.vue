<script setup lang="ts">
// Module 4: memory is storage + input processors that assemble the prompt.
const cyl = (x: number, y: number, w: number, h: number) => `M${x} ${y + 8} a${w / 2} 8 0 0 1 ${w} 0 v${h} a${w / 2} 8 0 0 1 ${-w} 0 Z`;
const stores = [
  { y: 30, title: 'thread messages', sub: 'per thread', color: 'amber' },
  { y: 120, title: 'working memory', sub: 'per thread or resource', color: 'lime' },
  { y: 210, title: 'vector index', sub: 'embeddings', color: 'sky' },
];
const procs = [
  { y: 34, title: 'MessageHistory', sub: 'last N messages', color: 'amber' },
  { y: 124, title: 'WorkingMemory', sub: 'a system note + a tool', color: 'lime' },
  { y: 214, title: 'SemanticRecall', sub: 'similar past messages', color: 'sky' },
];
</script>
<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 330" role="img" aria-label="Memory in Mastra: three stores (thread messages, working memory, a vector index) feed three input processors (MessageHistory, WorkingMemory, SemanticRecall) that add to the MessageList before each model request. New messages are saved back to storage after the run.">
      <ArrowDefs />
      <text x="80" y="18" text-anchor="middle" font-size="12" class="t-strong t-dim">STORAGE</text>
      <text x="335" y="18" text-anchor="middle" font-size="12" class="t-strong t-dim">INPUT PROCESSORS</text>
      <text x="630" y="18" text-anchor="middle" font-size="12" class="t-strong t-dim">ONE REQUEST</text>
      <g v-for="s in stores" :key="s.title">
        <path :d="cyl(14, s.y, 136, 52)" class="shadow" transform="translate(4 4)" />
        <path :d="cyl(14, s.y, 136, 52)" :class="`f-${s.color}`" class="outline" />
        <path :d="`M14 ${s.y + 8} a68 8 0 0 0 136 0`" class="stroke" stroke-width="2" />
        <text x="82" :y="s.y + 38" text-anchor="middle" font-size="14" class="t-strong">{{ s.title }}</text>
        <text x="82" :y="s.y + 56" text-anchor="middle" font-size="11.5" class="t-dim">{{ s.sub }}</text>
      </g>
      <g v-for="p in procs" :key="p.title">
        <IllBox :x="250" :y="p.y" :w="170" :h="56" :color="p.color" :title="p.title" :sub="p.sub" :size="14" mono />
        <Arrow :d="`M158 ${p.y + 30} L244 ${p.y + 30}`" />
        <Arrow :d="`M424 ${p.y + 30} Q480 ${p.y + 30} 520 150`" />
      </g>
      <IllBox :x="524" :y="96" :w="210" :h="108" color="violet" />
      <text x="629" y="122" text-anchor="middle" font-size="15" class="t-strong t-mono">MessageList</text>
      <g font-size="12" class="t-mono">
        <text x="540" y="146">system + working memory</text>
        <text x="540" y="164">recalled messages</text>
        <text x="540" y="182">last N messages</text>
        <text x="540" y="200">+ the new message</text>
      </g>
      <Arrow d="M629 208 L629 244" />
      <IllBox :x="569" :y="248" :w="120" :h="44" color="coral" title="model" :size="15" />
      <path d="M560 290 Q330 330 90 278" class="stroke" stroke-dasharray="6 6" marker-end="url(#ill-arrow)" />
      <text x="330" y="322" text-anchor="middle" font-size="12.5" class="t-dim">after the run: new messages saved back to the thread</text>
    </svg>
    <figcaption>Memory isn't special-cased in the loop. It's storage plus processors (Module 3's house rule, applied).</figcaption>
  </figure>
</template>
