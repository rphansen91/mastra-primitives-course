<script setup lang="ts">
import { ref, useId } from 'vue';
defineProps<{ myth: string }>();
const open = ref(false);
const id = useId();
</script>
<template>
  <aside class="mis mpc-card" aria-label="Common misconception">
    <div class="mpc-kicker"><Icon name="alert" :size="15" /> Common misconception</div>
    <p class="myth"><span class="tag">Myth</span> <span>“{{ myth }}”</span></p>
    <button type="button" class="mpc-btn small" :aria-expanded="open" :aria-controls="id" @click="open = !open">
      <Icon :name="open ? 'up' : 'eye'" :size="15" /> {{ open ? 'Hide' : "What's actually true?" }}
    </button>
    <div :id="id" class="reality" v-show="open">
      <span class="tag ok">Reality</span>
      <div class="rbody"><slot /></div>
    </div>
  </aside>
</template>
<style scoped>
.mis { padding: 14px 18px 14px 16px; border: 0; border-left: 3px solid var(--mpc-danger); border-radius: 0 var(--r-md) var(--r-md) 0; background: var(--mpc-danger-bg); }
.mis > .mpc-kicker { color: var(--mpc-danger-ink); display: flex; align-items: center; gap: 6px; }
.myth { font-size: var(--fs-body); font-weight: var(--fw-medium); margin: 8px 0 10px !important; }
.myth > span:last-child { text-decoration: line-through; text-decoration-color: var(--mpc-danger); text-decoration-thickness: 1.5px; }
.tag { display: inline-block; font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; padding: 1px 7px; border-radius: var(--r-sm); background: var(--mpc-danger); color: #fff; vertical-align: 2px; }
.tag.ok { background: var(--mpc-tip); }
.dark .tag { color: #14112b; }
.reality { margin-top: 12px; padding: 12px 14px; border-radius: var(--r-md); background: var(--vp-c-bg); border: 1px solid var(--mpc-line); }
.rbody :deep(p) { margin: 6px 0; }
.rbody :deep(> :last-child) { margin-bottom: 0; }
</style>
