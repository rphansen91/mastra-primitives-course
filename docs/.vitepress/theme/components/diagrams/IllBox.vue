<script setup lang="ts">
// Sticker-style box used by every illustration: ink outline, pastel fill, offset shadow.
withDefaults(defineProps<{ x: number; y: number; w: number; h: number; color?: string; title?: string; sub?: string; r?: number; size?: number; mono?: boolean }>(), {
  color: 'paper', r: 14, size: 15,
});
</script>
<template>
  <g>
    <rect :x="x + 4" :y="y + 4" :width="w" :height="h" :rx="r" class="shadow" />
    <rect :x="x" :y="y" :width="w" :height="h" :rx="r" :class="`f-${color}`" class="outline" />
    <text v-if="title" :x="x + w / 2" :y="y + h / 2 + (sub ? -3 : size / 3)" text-anchor="middle" :font-size="size" class="t-strong" :class="{ 't-mono': mono }">{{ title }}</text>
    <text v-if="sub" :x="x + w / 2" :y="y + h / 2 + 15" text-anchor="middle" font-size="11.5" class="t-dim">{{ sub }}</text>
  </g>
</template>
