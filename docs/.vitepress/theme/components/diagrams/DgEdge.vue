<script setup lang="ts">
import { ref, onMounted } from 'vue';
/** An arrow with an optional label. The label gets a background plate sized on mount. */
const props = withDefaults(defineProps<{ d: string; label?: string; lx?: number; ly?: number; anchor?: 'start' | 'middle' | 'end'; dashed?: boolean; tone?: 'plain' | 'accent' | 'danger'; mono?: boolean; head?: boolean }>(), { anchor: 'middle', tone: 'plain', head: true });
const t = ref<SVGTextElement | null>(null);
const plate = ref<{ x: number; y: number; w: number; h: number } | null>(null);
onMounted(() => { try { const b = t.value!.getBBox(); plate.value = { x: b.x - 4, y: b.y - 1, w: b.width + 8, h: b.height + 2 }; } catch { /* no layout (print/SSR) */ } });
</script>
<template>
  <g class="dge" :class="`t-${tone}`">
    <path :d="d" class="dg-edge" :class="{ dashed }" :marker-end="head ? `url(#dg-arrow${tone === 'plain' ? '' : '-' + tone})` : undefined" />
    <rect v-if="label && plate" :x="plate.x" :y="plate.y" :width="plate.w" :height="plate.h" rx="3" class="dg-plate" />
    <text v-if="label" ref="t" :x="lx" :y="ly" :text-anchor="anchor" class="dg-label" :class="{ mono }">{{ label }}</text>
  </g>
</template>
