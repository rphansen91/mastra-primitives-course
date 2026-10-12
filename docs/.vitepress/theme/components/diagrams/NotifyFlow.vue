<script setup lang="ts">
const stack = [
  { title: 'External sources', sub: ['GitHub · Chat · Calendar / schedules'], tone: 'ghost' },
  { title: 'SignalProvider', sub: ['poll/webhook → classify → `notify()`'] },
  { title: '`sendNotificationSignal`', sub: ['delivery policy: deliver / summarize / persist'] },
  { title: 'Coordinator agent', sub: ['memory + inbox tool + one thread'], tone: 'accent' },
  { title: 'Fans out to', tone: 'ghost', edge: '', branch: [
    [{ title: 'PubSub peer directory', sub: ['`discoverThreadPeers()`'] }],
    [{ title: 'Worker agent A (running)', sub: ['relay tool → `sendSignal` (deliver)'] }],
    [{ title: 'Worker agent B (idle)', sub: ['`sendSignal` (wake / persist)'] }],
  ] },
  { title: 'Workers advertise themselves', sub: ['`claimThreadOwnership` + advertise → peer directory'], dashed: true, edge: '' },
];
</script>
<template>
  <Dg label="Notifications into a coordinator, which relays signals to worker agents found through the peer directory">
    <template #wide>
      <svg viewBox="0 0 840 560" class="dg" aria-hidden="true">
        <DgDefs />
        <text x="20" y="38" class="dim b">External sources</text>
        <DgBox :x="160" :y="12" :w="140" :h="42" :lines="['GitHub']" />
        <DgBox :x="320" :y="12" :w="140" :h="42" :lines="['Chat']" />
        <DgBox :x="480" :y="12" :w="200" :h="42" :lines="['Calendar / schedules']" />
        <DgEdge d="M230 54 L360 92" />
        <DgEdge d="M390 54 V92" />
        <DgEdge d="M580 54 L430 92" />
        <DgBox :x="210" :y="94" :w="360" :h="58" :lines="['**SignalProvider**', 'poll/webhook → classify → `notify()`']" />
        <DgEdge d="M390 152 V180" />
        <DgBox :x="170" :y="182" :w="440" :h="58" :lines="['`sendNotificationSignal`', '~delivery policy: deliver / summarize / persist~']" />
        <DgEdge d="M390 240 V268" />
        <DgBox :x="220" :y="270" :w="340" :h="58" tone="accent" :lines="['**Coordinator agent**', '~memory + inbox tool + one thread~']" />
        <DgEdge d="M250 328 L140 418" label="discoverThreadPeers()" :lx="188" :ly="374" anchor="end" mono />
        <DgEdge d="M390 328 V418" label="relay tool → sendSignal (deliver)" :lx="382" :ly="398" anchor="end" mono />
        <DgEdge d="M530 328 L660 418" label="sendSignal (wake / persist)" :lx="608" :ly="364" anchor="start" mono />
        <DgBox :x="20" :y="420" :w="230" :h="62" shape="cylinder" :lines="['PubSub peer', 'directory']" />
        <DgBox :x="290" :y="420" :w="210" :h="62" :lines="['**Worker agent A**', '~(running)~']" />
        <DgBox :x="560" :y="420" :w="210" :h="62" :lines="['**Worker agent B**', '~(idle)~']" />
        <DgEdge d="M395 482 C 395 520, 200 520, 150 486" dashed />
        <DgEdge d="M665 482 C 665 540, 180 540, 120 486" dashed />
        <text x="420" y="552" text-anchor="middle" class="mono dim">claimThreadOwnership + advertise</text>
      </svg>
    </template>
    <template #stack><DgStack :items="stack" /></template>
  </Dg>
</template>
