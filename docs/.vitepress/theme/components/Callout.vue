<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ type?: 'analogy' | 'tip' | 'warn' | 'story' | 'note' | 'win'; title?: string }>(), { type: 'note' });
const meta = computed(() => ({
  analogy: { icon: 'bulb', label: 'Analogy', color: 'violet' },
  tip: { icon: 'star', label: 'Pro tip', color: 'teal' },
  warn: { icon: 'alert', label: 'Careful', color: 'coral' },
  story: { icon: 'book', label: 'Story time', color: 'amber' },
  note: { icon: 'eye', label: 'Notice', color: 'sky' },
  win: { icon: 'check', label: 'You just learned', color: 'lime' },
})[props.type]);
</script>
<template>
  <aside class="callout mpc-card" :class="`c-${meta.color}`" :aria-label="title ?? meta.label">
    <div class="head">
      <span class="ico" aria-hidden="true"><Icon :name="meta.icon" :size="16" /></span>
      <span class="mpc-kicker">{{ meta.label }}</span>
      <strong v-if="title" class="t">{{ title }}</strong>
    </div>
    <div class="body"><slot /></div>
  </aside>
</template>
<style scoped>
.callout { position: relative; padding: 14px 18px 14px 16px; border: 0; border-left: 3px solid var(--rule); border-radius: 0 var(--r-md) var(--r-md) 0; background: var(--fill); }
.head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; color: var(--ink); }
.head .mpc-kicker { color: var(--ink); }
.t { font-size: var(--fs-md); font-weight: var(--fw-semibold); color: var(--vp-c-text-1); }
.ico { display: inline-grid; place-items: center; }
.c-violet { --rule: var(--mod-accent); --fill: var(--mpc-surface-2); --ink: var(--mod-accent); }
.c-amber { --rule: var(--mpc-line-strong); --fill: var(--mpc-surface-2); --ink: var(--vp-c-text-2); }
.c-teal, .c-lime { --rule: var(--mpc-tip); --fill: var(--mpc-tip-bg); --ink: var(--mpc-tip-ink); }
.c-coral { --rule: var(--mpc-warn); --fill: var(--mpc-warn-bg); --ink: var(--mpc-warn-ink); }
.c-sky { --rule: var(--mpc-info); --fill: var(--mpc-info-bg); --ink: var(--mpc-info-ink); }
.body :deep(p) { margin: 6px 0; }
.body :deep(> :last-child) { margin-bottom: 0; }
</style>
