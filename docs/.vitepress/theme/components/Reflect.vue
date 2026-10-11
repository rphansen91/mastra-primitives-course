<script setup lang="ts">
import { ref, useId } from 'vue';
// Open-ended "think, then compare" check. The draft stays in the page (never stored or sent).
defineProps<{ question: string }>();
const draft = ref('');
const open = ref(false);
const uid = useId();
import { fmt } from '../progress';
function reveal() {
  open.value = !open.value;
}
</script>
<template>
  <section class="reflect mpc-card" :aria-labelledby="uid + '-q'">
    <div class="mpc-kicker"><Icon name="bulb" :size="14" /> Think it through</div>
    <p :id="uid + '-q'" class="q" v-html="fmt(question)" />
    <label class="mpc-sr" :for="uid + '-a'">Your answer (stays on this page)</label>
    <textarea :id="uid + '-a'" v-model="draft" rows="3" placeholder="Jot your answer first. It stays on this page." />
    <div class="row">
      <button type="button" class="mpc-btn" :class="{ primary: !open }" :aria-expanded="open" :aria-controls="uid + '-m'" @click="reveal">
        <Icon :name="open ? 'up' : 'eye'" :size="15" /> {{ open ? 'Hide' : 'Compare with' }} a model answer
      </button>
      <span v-if="!draft && !open" class="hint">Answering first, even badly, makes it stick.</span>
    </div>
    <div v-show="open" :id="uid + '-m'" class="model"><slot /></div>
  </section>
</template>
<style scoped>
.reflect { background: var(--mpc-violet-soft); }
.q { font-weight: 700; font-size: 17px !important; margin: 6px 0 10px !important; }
textarea { width: 100%; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 8px 10px; font: inherit; font-size: 15px; background: var(--mpc-paper); color: var(--vp-c-text-1); resize: vertical; }
textarea:focus-visible { outline: 3px solid var(--mpc-sky); outline-offset: 2px; }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 8px; }
.hint { font-size: 13px; color: var(--mpc-ink-2); }
.model { margin-top: 12px; padding: 10px 14px; border: 2px solid var(--mpc-ink); border-radius: 12px; background: var(--mpc-paper); }
.model :deep(> :first-child) { margin-top: 0; }
.model :deep(> :last-child) { margin-bottom: 0; }
</style>
