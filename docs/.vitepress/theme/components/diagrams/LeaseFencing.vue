<script setup lang="ts">
const participants = [
  { id: 'A', short: 'A', name: 'Worker A' },
  { id: 'L', short: 'L', name: 'Lease store' },
  { id: 'B', short: 'B', name: 'Worker B' },
  { id: 'S', short: 'S', name: 'Storage' },
];
const rows = [
  { from: 'A', to: 'L', label: 'acquire → token 1' },
  { note: 'GC pause longer than the TTL', over: 'A' },
  { from: 'B', to: 'L', label: 'acquire (A expired) → token 2' },
  { from: 'B', to: 'S', label: '`write(result, token 2)` accepted', tone: 'tip' },
  { from: 'A', to: 'S', label: '`write(stale, token 1)` **rejected** (1 < 2)', tone: 'danger' },
];
</script>
<template>
  <SeqLanes label="Fencing tokens: a stale worker's write is rejected because its token is older" :participants="participants" :rows="rows" />
</template>
