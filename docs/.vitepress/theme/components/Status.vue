<script setup lang="ts">
/** Status chip for decision tables: icon + word, same on every OS (replaces emoji). */
const props = defineProps<{ kind: 'yes' | 'caveat' | 'no' | 'build'; label?: string }>();
const M = { yes: { icon: 'check', word: 'Yes' }, caveat: { icon: 'alert', word: 'Caveat' }, no: { icon: 'x', word: 'No' }, build: { icon: 'gear', word: 'Build' } } as const;
</script>
<template>
  <span class="mpc-status" :class="`s-${kind}`"><Icon :name="M[kind].icon" :size="12" />{{ label || M[kind].word }}</span>
</template>
<style scoped>
.mpc-status { display: inline-flex; align-items: center; gap: 4px; padding: 0 7px; border-radius: var(--r-sm); font-size: var(--fs-xs); font-weight: 600; line-height: 20px; white-space: nowrap; vertical-align: 1px; margin-right: 4px; border: 1px solid transparent; }
.s-yes { color: var(--mpc-tip-ink); background: var(--mpc-tip-bg); border-color: var(--mpc-tip-line); }
.s-caveat { color: var(--mpc-warn-ink); background: var(--mpc-warn-bg); border-color: var(--mpc-warn-line); }
.s-no { color: var(--mpc-danger-ink); background: var(--mpc-danger-bg); border-color: var(--mpc-danger-line); }
.s-build { color: var(--vp-c-text-1); background: var(--mpc-surface-2); border-color: var(--mpc-line-strong); }
</style>
