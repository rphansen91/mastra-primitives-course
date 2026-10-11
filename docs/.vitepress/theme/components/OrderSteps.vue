<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fmt, mark, loadProgress, registerCheck } from '../progress';

/**
 * Put the steps in order. Drag with a mouse, or use the arrow buttons
 * (also the keyboard and touch fallback): focus an item, press Space to pick
 * it up, ArrowUp/ArrowDown to move it, Space again to drop.
 */
const props = defineProps<{ module: string; id: string; prompt: string; items: string[]; explain?: string }>();
registerCheck(props.module, props.id);
onMounted(loadProgress);

// Deterministic shuffle (same on server and client, so hydration matches).
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507)), ((h >>> 0) % 10000) / 10000);
}
function shuffled() {
  const rnd = seeded(props.id);
  const idx = props.items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (idx.every((v, i) => v === i)) idx.reverse();
  return idx;
}
const order = ref<number[]>(shuffled());
const checked = ref(false);
const grabbed = ref<number | null>(null);
const dragFrom = ref<number | null>(null);
const live = ref('');
const correctCount = computed(() => order.value.filter((v, i) => v === i).length);
const allRight = computed(() => checked.value && correctCount.value === props.items.length);

function move(from: number, to: number) {
  if (to < 0 || to >= order.value.length || from === to) return;
  const next = [...order.value];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  order.value = next;
  checked.value = false;
  live.value = `Moved to position ${to + 1} of ${next.length}`;
}
function onKey(e: KeyboardEvent, pos: number) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    grabbed.value = grabbed.value === pos ? null : pos;
    live.value = grabbed.value === null ? 'Dropped' : `Picked up item ${pos + 1}. Use arrow keys to move, Space to drop.`;
  } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && grabbed.value === pos) {
    e.preventDefault();
    const to = pos + (e.key === 'ArrowUp' ? -1 : 1);
    if (to < 0 || to >= order.value.length) return;
    move(pos, to);
    grabbed.value = to;
    requestAnimationFrame(() => (document.querySelectorAll<HTMLElement>(`[data-order="${props.id}"] .item`)[to])?.focus());
  }
}
function onDrop(pos: number) {
  if (dragFrom.value !== null) move(dragFrom.value, pos);
  dragFrom.value = null;
}
function check() {
  checked.value = true;
  live.value = `${correctCount.value} of ${props.items.length} in the right place.`;
  if (correctCount.value === props.items.length) mark(`${props.module}:check:${props.id}`);
}
function reveal() {
  order.value = props.items.map((_, i) => i);
  checked.value = true;
}
</script>

<template>
  <section class="ord mpc-card" aria-label="Put the steps in order" :data-order="id">
    <div class="mpc-kicker"><Icon name="grip" :size="15" /> Put it in order</div>
    <p class="q" v-html="fmt(prompt)" />
    <p class="how">Drag the cards, or use the arrows. Keyboard: focus a card, <kbd>Space</kbd> to pick up, <kbd>↑</kbd>/<kbd>↓</kbd> to move.</p>
    <ol class="list">
      <li v-for="(it, pos) in order" :key="it" class="item mpc-focus" tabindex="0" draggable="true"
        :class="{ grabbed: grabbed === pos, right: checked && it === pos, wrong: checked && it !== pos, over: dragFrom !== null }"
        :aria-label="`${pos + 1}. ${items[it].replace(/[`*]/g, '')}${checked ? (it === pos ? ', correct position' : ', wrong position') : ''}`"
        @keydown="onKey($event, pos)" @dragstart="dragFrom = pos" @dragend="dragFrom = null"
        @dragover.prevent @drop.prevent="onDrop(pos)">
        <span class="num" aria-hidden="true">{{ pos + 1 }}</span>
        <span class="grip" aria-hidden="true"><Icon name="grip" :size="16" /></span>
        <span class="txt" v-html="fmt(items[it])" />
        <span class="arrows">
          <button type="button" class="arr" :disabled="pos === 0" :aria-label="`Move up`" @click="move(pos, pos - 1)" tabindex="-1"><Icon name="up" :size="14" /></button>
          <button type="button" class="arr" :disabled="pos === order.length - 1" :aria-label="`Move down`" @click="move(pos, pos + 1)" tabindex="-1"><Icon name="down" :size="14" /></button>
        </span>
      </li>
    </ol>
    <div class="actions">
      <button type="button" class="mpc-btn primary" @click="check"><Icon name="check" :size="15" /> Check order</button>
      <button type="button" class="mpc-btn small" @click="reveal">Show answer</button>
    </div>
    <div aria-live="polite" class="fb">
      <template v-if="checked">
        <div class="fbcard" :class="allRight ? 'ok' : 'no'">
          <Mascot :mood="allRight ? 'cheer' : 'thinking'" :size="54" />
          <div>
            <strong v-if="allRight">Perfect order!</strong>
            <strong v-else>{{ correctCount }} of {{ items.length }} in the right spot.</strong>
            <span v-if="!allRight"> Green cards are placed correctly; keep shuffling the red ones.</span>
            <p v-if="allRight && explain" class="explain" v-html="fmt(explain)" />
          </div>
        </div>
      </template>
    </div>
    <span class="mpc-sr" aria-live="assertive">{{ live }}</span>
  </section>
</template>

<style scoped>
.ord { background: var(--mpc-amber-soft); }
.q { font-size: 17.5px !important; font-weight: 700; margin: 8px 0 4px !important; }
.how { font-size: 13.5px !important; color: var(--vp-c-text-2); margin: 0 0 12px !important; }
kbd { font-family: var(--mpc-mono); font-size: 12px; border: 1px solid var(--vp-c-divider); border-radius: 4px; padding: 0 4px; background: var(--mpc-paper); }
.list { list-style: none; padding: 0 !important; margin: 0 !important; display: grid; gap: 8px; }
.item { margin: 0 !important; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 2px solid var(--mpc-ink); border-radius: 12px; background: var(--mpc-paper); cursor: grab; font-size: 15px; line-height: 1.4; user-select: none; transition: transform 0.12s, box-shadow 0.12s; }
.item.grabbed { transform: scale(1.02); box-shadow: 4px 4px 0 var(--mpc-shadow); border-color: var(--mpc-violet); }
.item.right { background: var(--mpc-teal-soft); border-color: var(--mpc-teal); }
.item.wrong { background: var(--mpc-coral-soft); border-color: var(--mpc-coral); }
.num { width: 26px; height: 26px; border-radius: 50%; background: var(--mpc-ink); color: var(--mpc-paper); font-weight: 800; font-size: 13px; display: grid; place-items: center; flex: none; }
.grip { color: var(--vp-c-text-3); }
.txt { flex: 1; }
.arrows { display: flex; gap: 4px; }
.arr { width: 30px; height: 30px; border: 2px solid var(--mpc-ink); border-radius: 8px; background: var(--mpc-paper); color: var(--mpc-ink); display: grid; place-items: center; cursor: pointer; }
.arr:disabled { opacity: 0.3; cursor: default; }
.actions { display: flex; gap: 10px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
.fbcard { display: flex; gap: 12px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); font-size: 15.5px; line-height: 1.55; }
.fbcard.ok { border-color: var(--mpc-teal); }
.explain { margin: 6px 0 0 !important; font-size: 15px !important; color: var(--vp-c-text-2); }
@media (prefers-reduced-motion: reduce) { .item { transition: none; } }
</style>
