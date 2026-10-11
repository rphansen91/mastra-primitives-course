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
      <span class="ico"><Icon :name="meta.icon" :size="18" /></span>
      <span class="mpc-kicker">{{ meta.label }}</span>
      <strong v-if="title" class="t">{{ title }}</strong>
    </div>
    <div class="body"><slot /></div>
    <Mascot v-if="type === 'analogy'" class="peek" mood="thinking" :size="64" />
  </aside>
</template>
<style scoped>
.callout { position: relative; padding: 14px 18px; }
.head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.t { font-size: 16.5px; }
.ico { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); }
.c-violet { background: var(--mpc-violet-soft); }
.c-teal { background: var(--mpc-teal-soft); }
.c-coral { background: var(--mpc-coral-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-sky { background: var(--mpc-sky-soft); }
.c-lime { background: var(--mpc-lime-soft); }
.body :deep(p) { margin: 8px 0; }
.body :deep(> :last-child) { margin-bottom: 0; }
.c-violet .body { padding-right: 64px; }
.peek { position: absolute; right: 10px; bottom: 8px; }
@media (max-width: 520px) { .c-violet .body { padding-right: 0; } .peek { display: none; } }
</style>
