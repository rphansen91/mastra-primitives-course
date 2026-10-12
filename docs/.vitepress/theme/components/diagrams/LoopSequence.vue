<script setup lang="ts">
const participants = [
  { id: 'C', short: 'C', name: 'Caller' },
  { id: 'A', short: 'A', name: 'Agent.stream' },
  { id: 'RT', short: 'RT', name: 'ThreadStreamRuntime' },
  { id: 'P', short: 'P', name: 'prepare-stream workflow' },
  { id: 'L', short: 'L', name: 'AgenticLoop (dowhile)' },
  { id: 'M', short: 'M', name: 'Model' },
  { id: 'T', short: 'T', name: 'Tools' },
];
const rows = [
  { from: 'C', to: 'A', label: '`stream(messages, { memory: { thread, resource } })`' },
  { from: 'A', to: 'RT', label: '`waitForCrossAgentThreadRun` (reserve the thread)' },
  { from: 'A', to: 'RT', label: '`prepareRunOptions` (signal drain wiring)' },
  { from: 'A', to: 'P', label: '`prepareTools` ∥ `prepareMemory` → map' },
  { from: 'P', to: 'L', label: '`streamStep` → `loop()`' },
  { from: 'A', to: 'RT', label: '`registerRun` (thread active)' },
  { loop: 'each iteration', rows: [
    { from: 'L', to: 'M', label: 'input processors → `doStream(prompt + pending signals)`' },
    { from: 'M', to: 'L', label: 'chunks → `processOutputStream` → `processOutputStep`', reply: true },
    { from: 'L', to: 'T', label: '`foreach` toolCall → `execute` → `processToolResult`' },
    { from: 'L', to: 'L', label: 'mapping (call order) → bg check → signal drain → goal' },
    { from: 'L', to: 'L', label: 'predicate: inline drain · preempted? · `decideContinuation`' },
  ] },
  { from: 'L', to: 'A', label: '`processOutputResult` → `finish`', reply: true },
  { from: 'A', to: 'RT', label: 'run ends → thread idle → release the reservation' },
];
</script>
<template>
  <SeqLanes label="One agent.stream() call, from the caller to finish, with the loop iteration in the middle" :participants="participants" :rows="rows" />
</template>
