<script setup lang="ts">
import { fmt } from '../../progress';
/** Narrow-screen version of a flow: boxes top to bottom, each edge label on the connector. */
export type StackItem = { title: string; sub?: string[]; tone?: string; edge?: string; dashed?: boolean; branch?: StackItem[][]; group?: string };
defineProps<{ items: StackItem[] }>();
</script>
<template>
  <ol class="dgs">
    <li v-for="(it, i) in items" :key="i" :class="[`t-${it.tone || 'plain'}`, { dashed: it.dashed, grp: it.group }]">
      <div v-if="i > 0 && it.edge !== undefined" class="conn" :class="{ dashed: it.dashed }"><span v-if="it.edge" v-html="fmt(it.edge)" /></div>
      <div v-else-if="i > 0" class="conn" />
      <div v-if="it.group" class="gl">{{ it.group }}</div>
      <div class="node"><strong v-html="fmt(it.title)" /><span v-for="(s, j) in it.sub || []" :key="j" class="sub" v-html="fmt(s)" /></div>
      <div v-if="it.branch" class="branches">
        <DgStack v-for="(b, k) in it.branch" :key="k" :items="b" />
      </div>
    </li>
  </ol>
</template>
