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
.mis { background: var(--mpc-coral-soft); padding: 14px 18px; }
.myth { font-size: 17px !important; font-weight: 700; margin: 8px 0 10px !important; }
.myth > span:last-child { text-decoration: line-through; text-decoration-color: var(--mpc-coral); text-decoration-thickness: 2px; }
.tag { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 6px; background: var(--mpc-danger); color: #fff; vertical-align: 2px; }
.tag.ok { background: var(--mpc-tip); }
.dark .tag { color: #14112b; }
.reality { margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); }
.rbody :deep(p) { margin: 6px 0; }
.rbody :deep(> :last-child) { margin-bottom: 0; }
</style>
