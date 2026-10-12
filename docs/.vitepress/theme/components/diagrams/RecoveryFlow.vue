<script setup lang="ts">
const stack = [
  { title: 'Process boot', tone: 'ghost', branch: [
    [
      { title: "`recovery.workflows: 'auto'` (default)", sub: ['`restartAllActiveWorkflowRuns()`'] },
      { title: 'Re-run from the last snapshot', sub: ['completed steps memoized', 'in-flight step re-runs', '**no claim**'], edge: '' },
    ],
    [
      { title: "`recovery.durableAgents: 'auto'` (opt-in)", sub: ['`recoverAllDurableAgents()`'] },
      { title: 'Run claim held by a live owner?', tone: 'warn', edge: '', branch: [
        [{ title: 'Yes: skip, retry after the TTL', sub: ['1.76.0+'] }],
        [{ title: 'No / expired: recover', sub: ['rebuild state, re-drive from the step-boundary checkpoint'], tone: 'tip' }],
      ] },
    ],
  ] },
];
</script>
<template>
  <Dg label="Recovery at process boot: workflows restart without a claim; durable agents check the run claim first">
    <template #wide>
      <svg viewBox="0 0 820 350" class="dg" aria-hidden="true">
        <DgDefs />
        <rect x="8" y="8" width="340" height="300" rx="12" class="dg-group" />
        <text x="24" y="34" class="dim b">Process boot</text>
        <DgBox :x="22" :y="52" :w="312" :h="62" :lines="['`recovery.workflows: \'auto\'` (default)', '`restartAllActiveWorkflowRuns()`']" />
        <DgBox :x="22" :y="178" :w="312" :h="62" :lines="['`recovery.durableAgents: \'auto\'` (opt-in)', '`recoverAllDurableAgents()`']" />
        <DgEdge d="M334 83 H398" />
        <DgBox :x="400" :y="34" :w="390" :h="98" :lines="['re-run from the last snapshot', '~completed steps memoized~', '~in-flight step re-runs~', '**no claim**']" />
        <DgEdge d="M334 209 H404" />
        <DgBox :x="406" :y="160" :w="240" :h="98" shape="diamond" tone="warn" :lines="['run claim held by', 'a live owner?']" />
        <DgEdge d="M630 200 C 700 170, 700 240, 632 218" />
        <text x="704" y="196" class="dim">yes → skip,</text>
        <text x="704" y="215" class="dim">retry after TTL</text>
        <text x="704" y="234" class="dim">(1.76.0+)</text>
        <DgEdge d="M526 258 V290" label="no / expired" :lx="536" :ly="279" anchor="start" />
        <DgBox :x="380" :y="292" :w="430" :h="50" tone="tip" :lines="['**recover:** rebuild state,', 're-drive from the step-boundary checkpoint']" :lh="18" />
      </svg>
    </template>
    <template #stack><DgStack :items="stack" /></template>
  </Dg>
</template>
