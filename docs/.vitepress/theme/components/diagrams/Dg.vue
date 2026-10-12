<script setup lang="ts">
/**
 * Static diagram frame. Desktop gets the SVG drawing (slot "wide"), narrow screens get a
 * stacked HTML version (slot "stack") with real-size text instead of a scaled-down SVG.
 * Both are server-rendered: no diagram library ships to the browser.
 */
defineProps<{ label: string; caption?: string; minWide?: number }>();
</script>
<template>
  <figure class="mpc-diagram" role="group" :aria-label="label">
    <div class="dg-wide"><slot name="wide" /></div>
    <div class="dg-stack" v-if="$slots.stack"><slot name="stack" /></div>
    <figcaption v-if="caption || $slots.caption"><slot name="caption">{{ caption }}</slot></figcaption>
  </figure>
</template>
