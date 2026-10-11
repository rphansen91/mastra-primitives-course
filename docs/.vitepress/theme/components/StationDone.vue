<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { progress, loadProgress, mark, STATIONS } from '../progress';
const props = defineProps<{ module: string; station: number; next?: string; nextLabel?: string }>();
onMounted(loadProgress);
const done = computed(() => !!progress.done[`${props.module}:station:${props.station}`]);
const nextStation = computed(() => STATIONS[props.station]);
function go() {
  mark(`${props.module}:station:${props.station}`);
  if (props.next) { window.location.href = props.next; return; }
  const key = nextStation.value?.key;
  const el = key ? document.getElementById(key) : null;
  if (el) {
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + key);
  }
}
</script>
<template>
  <div class="sd">
    <button type="button" class="mpc-btn" :class="done ? '' : 'primary'" @click="go">
      <Icon :name="done ? 'check' : 'next'" />
      <template v-if="done">Station {{ station }} complete{{ nextStation || next ? ', continue' : '' }}</template>
      <template v-else>I've got this. {{ next ? (nextLabel ?? 'Next') : nextStation ? `On to ${nextStation.title.toLowerCase()}` : 'Mark module complete' }}</template>
    </button>
  </div>
</template>
<style scoped>
.sd { margin: 32px 0 8px; display: flex; justify-content: flex-end; }
</style>
