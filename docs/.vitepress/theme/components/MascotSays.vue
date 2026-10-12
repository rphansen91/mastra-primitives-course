<script setup lang="ts">
withDefaults(defineProps<{ mood?: 'happy' | 'thinking' | 'alarmed' | 'sleepy' | 'cheer' }>(), { mood: 'happy' });
</script>
<template>
  <div class="says">
    <Mascot :mood="mood" :size="72" />
    <div class="bubble"><slot /></div>
  </div>
</template>
<style scoped>
.says { display: flex; gap: 14px; align-items: flex-start; margin: 24px 0; }
.bubble {
  position: relative;
  border: 1px solid var(--mpc-line);
  border-radius: var(--r-lg);
  background: var(--mpc-violet-soft);
  padding: 12px 16px;
  font-size: var(--fs-md);
  line-height: 1.6;
  flex: 1;
}
.bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 22px;
  width: 16px;
  height: 16px;
  background: var(--mpc-violet-soft);
  border-left: 2px solid var(--mpc-ink);
  border-bottom: 1px solid var(--mpc-line);
  transform: rotate(45deg);
}
.bubble :deep(p) { margin: 0.4em 0; }
.bubble :deep(p:first-child) { margin-top: 0; }
.bubble :deep(p:last-child) { margin-bottom: 0; }
</style>
