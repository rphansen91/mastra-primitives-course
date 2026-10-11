<script setup lang="ts">
import { computed } from 'vue';
import { STABILITY, STATUS_META, SHA, type Status } from '../stability';
import { fmt } from '../progress';
/** A per-module table of the primitives it teaches and how much weight each one can bear in production. */
const props = withDefaults(defineProps<{ ids: string[]; title?: string }>(), { title: 'Stability of what this module teaches' });
const rows = computed(() => props.ids.map(id => ({ id, ...STABILITY[id] })).filter(r => r.name));
const used = computed(() => [...new Set(rows.value.map(r => r.status))] as Status[]);
</script>
<template>
  <section class="sp mpc-card" :aria-label="title">
    <div class="hd"><span class="mpc-kicker">{{ title }}</span><span class="pin">checked at <code>@mastra/core@1.76.0</code> · <a :href="`https://github.com/mastra-ai/mastra/tree/${SHA}`" target="_blank" rel="noopener">{{ SHA.slice(0, 7) }}</a></span></div>
    <ul>
      <li v-for="r in rows" :key="r.id">
        <StabilityBadge :id="r.id" compact />
        <span class="body"><strong>{{ r.name }}</strong><span v-if="r.since" class="since"> · since {{ r.since }}</span><br /><span class="note" v-html="fmt(r.note)" /> <a :href="r.href" target="_blank" rel="noopener" class="cite">{{ r.source }}</a></span>
      </li>
    </ul>
    <p class="legend"><span v-for="s in used" :key="s"><strong>{{ STATUS_META[s].label }}:</strong> {{ STATUS_META[s].meaning }} </span></p>
  </section>
</template>
<style scoped>
.sp { padding: 14px 16px; margin: 20px 0; }
.hd { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; align-items: baseline; }
.pin { font-size: 12.5px; color: var(--vp-c-text-2); }
ul { list-style: none; padding: 0 !important; margin: 10px 0 0 !important; }
li { display: grid; grid-template-columns: 150px 1fr; gap: 10px; align-items: start; padding: 8px 0; border-top: 1.5px dashed var(--vp-c-divider); margin: 0 !important; }
li :deep(.sb) { justify-self: start; }
.body { font-size: 14.5px; line-height: 1.5; min-width: 0; overflow-wrap: anywhere; }
.since { font-family: var(--mpc-mono); font-size: 12px; color: var(--vp-c-text-2); }
.note { color: var(--vp-c-text-1); }
.cite { font-size: 12px; white-space: nowrap; }
.legend { font-size: 12.5px; color: var(--vp-c-text-2); margin: 10px 0 0 !important; line-height: 1.5 !important; }
.legend span { display: block; }
@media (max-width: 520px) { li { grid-template-columns: 1fr; gap: 4px; } .cite { white-space: normal; } }
</style>
