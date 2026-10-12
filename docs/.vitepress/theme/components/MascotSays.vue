<script setup lang="ts">
withDefaults(defineProps<{ mood?: 'happy' | 'thinking' | 'alarmed' | 'sleepy' | 'cheer' }>(), { mood: 'happy' });
</script>
<template>
  <div class="says">
    <Mascot :mood="mood" :size="48" />
    <div class="bubble"><slot /></div>
  </div>
</template>
<style scoped>
.says { display: flex; gap: 12px; align-items: flex-start; margin: 24px 0; }
.bubble { position: relative; border: 1px solid var(--mpc-line); border-radius: var(--r-lg); background: var(--mpc-surface-2); padding: 12px 16px; font-size: var(--fs-md); line-height: 1.6; flex: 1; }
.bubble::before { content: ''; position: absolute; left: -7px; top: 18px; width: 12px; height: 12px; background: var(--mpc-surface-2); border-left: 1px solid var(--mpc-line); border-bottom: 1px solid var(--mpc-line); transform: rotate(45deg); }
.bubble :deep(p) { margin: 0.4em 0; }
.bubble :deep(p:first-child) { margin-top: 0; }
.bubble :deep(p:last-child) { margin-bottom: 0; }
</style>
