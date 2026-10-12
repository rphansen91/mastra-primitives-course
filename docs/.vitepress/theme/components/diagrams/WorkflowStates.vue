<script setup lang="ts">
const stack = [
  { title: 'start()', sub: ['→ running'] },
  { title: 'running → running', sub: ['step done → snapshot'] },
  { title: 'running → suspended', sub: ['`suspend(payload)`'] },
  { title: 'suspended → running', sub: ['`resume()` (CAS-claimed)'] },
  { title: 'running → success', tone: 'tip' },
  { title: 'running → failed', sub: ['retries exhausted'], tone: 'danger' },
  { title: 'crash: running → running', sub: ['`restartAllActiveWorkflowRuns()`', 'completed steps memoized, in-flight step re-runs'], tone: 'warn' },
];
</script>
<template>
  <Dg label="Workflow run states: running, suspended, success, failed, and what a crash does">
    <template #wide>
      <svg viewBox="0 0 760 330" class="dg" aria-hidden="true">
        <DgDefs />
        <circle cx="34" cy="120" r="9" class="dg-start" />
        <DgEdge d="M44 120 H158" label="start()" :lx="100" :ly="111" mono />
        <DgBox :x="160" :y="95" :w="170" :h="50" tone="accent" :lines="['**running**']" />
        <DgEdge d="M215 95 C 205 40, 285 40, 275 93" label="step done → snapshot" :lx="245" :ly="36" />
        <DgBox :x="570" :y="95" :w="170" :h="50" :lines="['**suspended**']" />
        <DgEdge d="M330 110 H568" label="suspend(payload)" :lx="449" :ly="101" mono />
        <DgEdge d="M570 132 H332" label="resume() (CAS-claimed)" :lx="451" :ly="156" mono />
        <DgEdge d="M185 145 L112 248" />
        <DgBox :x="30" :y="250" :w="150" :h="46" tone="tip" :lines="['**success**']" />
        <DgEdge d="M262 145 L300 248" tone="danger" label="retries exhausted" :lx="262" :ly="206" anchor="end" />
        <DgBox :x="230" :y="250" :w="150" :h="46" tone="danger" :lines="['**failed**']" />
        <DgEdge d="M330 140 C 400 165, 410 228, 362 228 C 330 228, 318 198, 318 149" dashed tone="accent" />
        <text x="424" y="206" class="mono">crash → restartAllActiveWorkflowRuns()</text>
        <text x="424" y="227" class="dim">completed steps memoized,</text>
        <text x="424" y="246" class="dim">in-flight step re-runs</text>
      </svg>
    </template>
    <template #stack><DgStack :items="stack" /></template>
  </Dg>
</template>
