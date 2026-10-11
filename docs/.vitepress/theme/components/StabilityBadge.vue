<script setup lang="ts">
import { computed } from 'vue';
import { STABILITY, STATUS_META, type Status } from '../stability';
/** Inline stability pill. Pass `id` (looked up in theme/stability.ts, with a citation link), or `status` + `label`. */
const props = defineProps<{ id?: string; status?: Status; label?: string; since?: string; href?: string; compact?: boolean }>();
const entry = computed(() => (props.id ? STABILITY[props.id] : undefined));
const status = computed<Status>(() => props.status ?? entry.value?.status ?? 'stable');
const meta = computed(() => STATUS_META[status.value]);
const since = computed(() => props.since ?? entry.value?.since);
const href = computed(() => props.href ?? entry.value?.href);
const title = computed(() => [meta.value.label + ': ' + meta.value.meaning, entry.value?.note, entry.value ? 'Source: ' + entry.value.source : ''].filter(Boolean).join('\n'));
</script>
<template>
  <span class="sb" :class="`s-${status}`" :title="title">
    <span class="st"><Icon :name="meta.icon" :size="12" />{{ meta.label }}</span>
    <span v-if="!compact && (label ?? entry?.name)" class="nm">{{ label ?? entry?.name }}</span>
    <span v-if="!compact && since" class="since">since {{ since }}</span>
    <a v-if="href" class="src" :href="href" target="_blank" rel="noopener" :aria-label="`Source for ${label ?? entry?.name ?? meta.label}`">source</a>
  </span>
</template>
<style scoped>
.sb { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; border: 2px solid var(--mpc-ink); border-radius: 999px; padding: 1px 8px 1px 2px; font-size: 12.5px; line-height: 1.6; background: var(--mpc-paper); vertical-align: middle; max-width: 100%; }
.st { display: inline-flex; align-items: center; gap: 4px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; font-size: 11px; border-radius: 999px; padding: 1px 8px; border: 1.5px solid var(--mpc-ink); }
.s-stable .st { background: var(--mpc-lime-soft); }
.s-beta .st { background: var(--mpc-amber-soft); }
.s-experimental .st { background: var(--mpc-coral-soft); }
.s-deprecated .st { background: var(--mpc-ink); color: var(--mpc-paper); }
.s-changed .st { background: var(--mpc-sky-soft); }
.nm { font-weight: 700; }
.since { color: var(--vp-c-text-2); font-family: var(--mpc-mono); font-size: 11.5px; }
.src { font-size: 11.5px; font-weight: 700; }
</style>
