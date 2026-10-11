<script setup lang="ts">
withDefaults(defineProps<{ d: string; color?: string; dashed?: boolean; width?: number }>(), { width: 2.5 });
</script>
<template>
  <g>
    <path :d="d" class="stroke" :class="color ? `s-${color}` : ''" :stroke-width="width" :stroke-dasharray="dashed ? '6 6' : undefined" marker-end="url(#ill-arrow)" />
  </g>
</template>
