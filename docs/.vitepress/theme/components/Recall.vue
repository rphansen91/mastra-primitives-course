<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fmt } from '../progress';

/** Spaced recall (Leitner boxes). Ratings are stored per card in localStorage. */
const props = defineProps<{ module: string; cards: { q: string; a: string }[] }>();
const KEY = 'mpc-recall-v1';
const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 21].map((d) => d * DAY);

type Rec = { box: number; due: number };
const store = ref<Record<string, Rec>>({});
const queue = ref<number[]>([]);
const flipped = ref(false);
const mounted = ref(false);
const reviewedThisSession = ref(0);

const keyOf = (i: number) => `${props.module}:${i}`;
function save() { try { localStorage.setItem(KEY, JSON.stringify(store.value)); } catch {} }
function buildQueue(all = false) {
  const now = Date.now();
  queue.value = props.cards.map((_, i) => i).filter((i) => all || (store.value[keyOf(i)]?.due ?? 0) <= now);
  flipped.value = false;
}
onMounted(() => {
  try { store.value = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
  buildQueue();
  mounted.value = true;
});
const current = computed(() => (queue.value.length ? props.cards[queue.value[0]] : null));
const nextDue = computed(() => {
  const dues = props.cards.map((_, i) => store.value[keyOf(i)]?.due ?? 0).filter((d) => d > Date.now());
  if (!dues.length) return '';
  const days = Math.max(1, Math.round((Math.min(...dues) - Date.now()) / DAY));
  return days === 1 ? 'tomorrow' : `in ${days} days`;
});
function rate(gotIt: boolean) {
  const i = queue.value.shift()!;
  const rec = store.value[keyOf(i)] ?? { box: 0, due: 0 };
  rec.box = gotIt ? Math.min(rec.box + 1, INTERVALS.length - 1) : 0;
  rec.due = Date.now() + INTERVALS[rec.box];
  store.value = { ...store.value, [keyOf(i)]: rec };
  if (!gotIt) queue.value.push(i);
  reviewedThisSession.value++;
  flipped.value = false;
  save();
}
const boxOf = (i: number) => store.value[keyOf(i)]?.box ?? 0;
</script>

<template>
  <section class="recall mpc-card" aria-label="Spaced recall">
    <div class="head">
      <div>
        <div class="mpc-kicker"><Icon name="cards" :size="15" /> Spaced recall</div>
        <p class="sub">Answer in your head, flip, then be honest. Cards you know come back later (1, 3, 7, 21 days); cards you miss come back now.</p>
      </div>
      <div class="boxes" aria-hidden="true" v-if="mounted">
        <span v-for="(_, i) in cards" :key="i" class="pip" :class="`b${boxOf(i)}`" />
      </div>
    </div>
    <div v-if="!mounted" class="card"><p class="front">{{ cards[0].q }}</p></div>
    <template v-else-if="current">
      <div class="meta">{{ queue.length }} card{{ queue.length === 1 ? '' : 's' }} to review</div>
      <div class="card" :class="{ flipped }">
        <p class="front" v-html="fmt(current.q)" />
        <div v-if="flipped" class="back" aria-live="polite" v-html="fmt(current.a)" />
      </div>
      <div class="actions">
        <button v-if="!flipped" type="button" class="mpc-btn primary" @click="flipped = true"><Icon name="eye" :size="15" /> Show answer</button>
        <template v-else>
          <button type="button" class="mpc-btn" @click="rate(false)"><Icon name="reset" :size="15" /> Again</button>
          <button type="button" class="mpc-btn primary" @click="rate(true)"><Icon name="check" :size="15" /> Got it</button>
        </template>
      </div>
    </template>
    <div v-else class="done">
      <Mascot mood="cheer" :size="64" />
      <div>
        <strong>All caught up.</strong>
        <span v-if="nextDue"> Next review {{ nextDue }}. Come back then and it'll stick.</span>
        <div><button type="button" class="mpc-btn small" @click="buildQueue(true)">Review all anyway</button></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.recall { background: var(--mpc-lime-soft); }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.sub { font-size: 14px !important; color: var(--vp-c-text-2); margin: 4px 0 10px !important; }
.boxes { display: flex; gap: 4px; flex-wrap: wrap; max-width: 120px; justify-content: flex-end; }
.pip { width: 12px; height: 12px; border-radius: 3px; border: 1.5px solid var(--mpc-ink); background: var(--mpc-paper); }
.pip.b1 { background: var(--mpc-amber-soft); }
.pip.b2 { background: var(--mpc-amber); }
.pip.b3 { background: var(--mpc-teal); }
.pip.b4 { background: var(--mpc-violet); }
.meta { font-size: 13px; font-weight: 700; color: var(--vp-c-text-2); margin-bottom: 6px; }
.card { border: 2px solid var(--mpc-ink); border-radius: 14px; background: var(--mpc-paper); padding: 18px 20px; box-shadow: 3px 3px 0 var(--mpc-shadow); min-height: 90px; }
.front { font-size: 17.5px !important; font-weight: 700; margin: 0 !important; }
.back { margin-top: 12px; padding-top: 12px; border-top: 2px dashed var(--vp-c-divider); font-size: 16px; line-height: 1.6; }
.actions { display: flex; gap: 10px; margin-top: 12px; }
.done { display: flex; gap: 12px; align-items: center; }
.done .mpc-btn { margin-top: 8px; }
</style>
