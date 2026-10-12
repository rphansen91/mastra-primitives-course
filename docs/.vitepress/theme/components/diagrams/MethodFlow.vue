<script setup lang="ts">
const steps = [
  { t: '1. Problem', s: ['What breaks', 'without it?'] },
  { t: '2. Built', s: ['Real source at', 'a pinned SHA'] },
  { t: '3. Breaks', s: ['Deliberate', 'break-it exercise'] },
  { t: '4. Choose', s: ['Decision table', 'vs alternatives'] },
];
const stack = [
  { title: '1. Problem', sub: ['What breaks without it?'] },
  { title: '2. Built', sub: ['Real source at a pinned SHA'] },
  { title: '3. Breaks', sub: ['Deliberate break-it exercise'] },
  { title: '4. Choose', sub: ['Decision table vs alternatives'] },
  { title: 'Capstone: a new primitive', tone: 'accent', edge: 'gaps become', dashed: true },
];
</script>
<template>
  <Dg label="The four-pass method: problem, built, breaks, choose; gaps become the capstone">
    <template #wide>
      <svg viewBox="0 0 760 214" class="dg" aria-hidden="true">
        <DgDefs />
        <DgBox v-for="(s, i) in steps" :key="i" :x="i * 196" :y="8" :w="172" :h="88" :lines="[`**${s.t}**`, `~${s.s[0]}~`, `~${s.s[1]}~`]" />
        <DgEdge v-for="i in 3" :key="'e' + i" :d="`M${i * 196 - 22} 52 H${i * 196 - 2}`" />
        <DgEdge d="M674 98 V146" dashed tone="accent" label="gaps become" :lx="664" :ly="126" anchor="end" />
        <DgBox :x="560" :y="148" :w="200" :h="56" tone="accent" :lines="['**Capstone:**', 'a new primitive']" />
      </svg>
    </template>
    <template #stack><DgStack :items="stack" /></template>
  </Dg>
</template>
