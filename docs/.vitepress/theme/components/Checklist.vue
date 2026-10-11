<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fmt } from '../progress';
/** A tickable checklist; state is kept in localStorage under `id` so a reviewer can come back to it. */
const props = defineProps<{ id: string; groups: { title: string; items: { text: string; why?: string }[] }[] }>();
const key = `mpc-checklist-${props.id}`;
const done = ref<Record<string, boolean>>({});
onMounted(() => { try { done.value = JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { done.value = {}; } });
watch(done, v => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, { deep: true });
const total = computed(() => props.groups.reduce((n, g) => n + g.items.length, 0));
const count = computed(() => Object.values(done.value).filter(Boolean).length);
const reset = () => { done.value = {}; };
const whyHtml = (w: string) => ' ' + fmt(w);
</script>
<template>
  <section class="cl mpc-card" :aria-label="`Checklist: ${count} of ${total} done`">
    <div class="top">
      <span class="mpc-kicker"><Icon name="check" :size="14" /> Production checklist</span>
      <span class="ct"><strong>{{ count }}</strong> / {{ total }}</span>
      <div class="bar" aria-hidden="true"><span :style="{ width: (100 * count / total) + '%' }" /></div>
      <button type="button" class="mpc-btn" @click="reset"><Icon name="reset" :size="14" /> Reset</button>
    </div>
    <div v-for="(g, gi) in groups" :key="gi" class="grp">
      <h4>{{ g.title }}</h4>
      <label v-for="(it, ii) in g.items" :key="ii" class="it" :class="{ on: done[`${gi}-${ii}`] }">
        <input type="checkbox" v-model="done[`${gi}-${ii}`]" />
        <span><span v-html="fmt(it.text)" /><span v-if="it.why" class="why" v-html="whyHtml(it.why)" /></span>
      </label>
    </div>
  </section>
</template>
<style scoped>
.cl { padding: 14px 16px; margin: 20px 0; }
.top { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.ct { font-size: 14px; }
.bar { flex: 1; min-width: 120px; height: 10px; border: 2px solid var(--mpc-ink); border-radius: 999px; overflow: hidden; background: var(--mpc-paper); }
.bar span { display: block; height: 100%; background: var(--mpc-lime); transition: width .2s; }
h4 { margin: 14px 0 4px !important; font-size: 15.5px; }
.it { display: grid; grid-template-columns: 22px 1fr; gap: 8px; align-items: start; padding: 6px 4px; border-radius: 8px; cursor: pointer; font-size: 14.5px; line-height: 1.5; }
.it:hover { background: var(--mpc-violet-soft); }
.it.on > span { text-decoration: line-through; text-decoration-thickness: 1.5px; color: var(--vp-c-text-2); }
.it input { width: 17px; height: 17px; margin-top: 3px; accent-color: var(--mpc-violet); }
.why { color: var(--vp-c-text-2); }
</style>
