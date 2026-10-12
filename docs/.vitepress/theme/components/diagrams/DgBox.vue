<script setup lang="ts">
import { computed } from 'vue';
/** A diagram node: hairline box with 1-4 centered lines. Line syntax: "**bold**", "`mono`", "~dim~". */
const props = withDefaults(defineProps<{ x: number; y: number; w: number; h: number; lines: string[]; tone?: 'plain' | 'accent' | 'tip' | 'warn' | 'danger' | 'ghost'; shape?: 'rect' | 'diamond' | 'cylinder' | 'pill'; lh?: number }>(), { tone: 'plain', shape: 'rect', lh: 19 });
const seg = (raw: string) => raw.split(/(\*\*[^*]+\*\*|`[^`]+`|~[^~]+~)/).filter(Boolean).map((t) => {
  if (t.startsWith('**')) return { t: t.slice(2, -2), cls: 'b' };
  if (t.startsWith('`')) return { t: t.slice(1, -1), cls: 'mono' };
  if (t.startsWith('~')) return { t: t.slice(1, -1), cls: 'dim' };
  return { t, cls: '' };
});
const parsed = computed(() => props.lines.map(seg));
const y0 = computed(() => props.y + props.h / 2 - ((props.lines.length - 1) * props.lh) / 2 + 5);
const dia = computed(() => { const { x, y, w, h } = props; return `${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`; });
</script>
<template>
  <g class="dgb" :class="`t-${tone}`" :data-shape="shape">
    <polygon v-if="shape === 'diamond'" :points="dia" class="dg-box" />
    <g v-else-if="shape === 'cylinder'">
      <path :d="`M${x} ${y + 8} a ${w / 2} 8 0 0 1 ${w} 0 v ${h - 16} a ${w / 2} 8 0 0 1 ${-w} 0 z`" class="dg-box" />
      <path :d="`M${x} ${y + 8} a ${w / 2} 8 0 0 0 ${w} 0`" class="dg-box" fill="none" />
    </g>
    <rect v-else :x="x" :y="y" :width="w" :height="h" :rx="shape === 'pill' ? h / 2 : 8" class="dg-box" />
    <text v-for="(l, i) in parsed" :key="i" :x="x + w / 2" :y="y0 + i * lh" text-anchor="middle"><tspan v-for="(g, j) in l" :key="j" :class="g.cls">{{ g.t }}</tspan></text>
  </g>
</template>
