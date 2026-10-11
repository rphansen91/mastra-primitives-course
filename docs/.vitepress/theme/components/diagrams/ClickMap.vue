<script setup lang="ts">
import { ref, computed } from 'vue';
import { fmt } from '../../progress';

/**
 * Generic "illustrated, clickable map": numbered stations on a track.
 * Click (or Tab + Enter) a station to read what it does, with a pinned source link.
 */
type Station = { name: string; short: string; detail: string; href?: string; color?: string; group?: string };
const props = withDefaults(defineProps<{ title: string; stations: Station[]; startLabel?: string; endLabel?: string; loop?: boolean }>(), { loop: false });
const sel = ref(0);
const s = computed(() => props.stations[sel.value]);
const COLORS = ['violet', 'amber', 'teal', 'coral', 'sky', 'lime'];
const color = (k: number) => props.stations[k].color ?? COLORS[k % COLORS.length];
function key(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); sel.value = (sel.value + 1) % props.stations.length; focus(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); sel.value = (sel.value - 1 + props.stations.length) % props.stations.length; focus(); }
}
const root = ref<HTMLElement | null>(null);
function focus() { requestAnimationFrame(() => root.value?.querySelectorAll<HTMLElement>('.st')[sel.value]?.focus()); }
</script>

<template>
  <figure class="cm mpc-card" ref="root">
    <div class="mpc-kicker"><Icon name="map" :size="14" /> {{ title }} <span class="hint">· click a station</span></div>
    <div class="track" role="tablist" :aria-label="title" @keydown="key">
      <span v-if="startLabel" class="end">{{ startLabel }}</span>
      <template v-for="(st, k) in stations" :key="k">
        <span v-if="k > 0 || startLabel" class="conn" aria-hidden="true" />
        <button type="button" role="tab" class="st" :class="[`c-${color(k)}`, { on: sel === k }]" :aria-selected="sel === k" :tabindex="sel === k ? 0 : -1" @click="sel = k">
          <span class="num">{{ k + 1 }}</span>
          <span class="nm">{{ st.name.replace(/([a-z])([A-Z(])/g, '$1\u200b$2') }}</span>
          <span class="sh">{{ st.short }}</span>
        </button>
      </template>
      <span v-if="endLabel" class="conn" aria-hidden="true" />
      <span v-if="endLabel" class="end">{{ endLabel }}</span>
      <span v-if="loop" class="loopback" aria-hidden="true">↺ loops back to 1</span>
    </div>
    <div class="detail" role="tabpanel" :class="`c-${color(sel)}`" aria-live="polite">
      <div class="dh"><span class="num big">{{ sel + 1 }}</span><strong><code>{{ s.name }}</code></strong></div>
      <p v-html="fmt(s.detail)" />
      <a v-if="s.href" :href="s.href" target="_blank" rel="noopener" class="src"><Icon name="book" :size="14" /> Read it in the source (pinned)</a>
    </div>
  </figure>
</template>

<style scoped>
.cm { background: var(--vp-c-bg-soft); }
.hint { font-weight: 600; text-transform: none; letter-spacing: 0; }
.track { display: flex; flex-wrap: wrap; align-items: stretch; gap: 0; margin-top: 14px; row-gap: 12px; position: relative; }
.conn { width: 14px; align-self: center; height: 3px; background: var(--mpc-ink); border-radius: 2px; }
.end { align-self: center; font-size: 12.5px; font-weight: 800; padding: 6px 10px; border-radius: 99px; border: 2px dashed var(--mpc-ink); background: var(--mpc-paper); }
.st { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; width: 128px; min-width: 0; padding: 8px 10px; border: 2px solid var(--mpc-ink); border-radius: 12px; cursor: pointer; color: var(--vp-c-text-1); transition: transform 0.12s, box-shadow 0.12s; }
.st:hover { transform: translateY(-2px); }
.st.on { box-shadow: 4px 4px 0 var(--mpc-shadow); transform: translateY(-3px); outline: 3px solid var(--mpc-violet); outline-offset: 1px; }
.st:focus-visible { outline: 3px solid var(--mpc-sky); outline-offset: 2px; }
.c-violet { background: var(--mpc-violet-soft); }
.c-amber { background: var(--mpc-amber-soft); }
.c-teal { background: var(--mpc-teal-soft); }
.c-coral { background: var(--mpc-coral-soft); }
.c-sky { background: var(--mpc-sky-soft); }
.c-lime { background: var(--mpc-lime-soft); }
.num { width: 22px; height: 22px; border-radius: 50%; background: var(--mpc-ink); color: var(--mpc-paper); font-size: 12px; font-weight: 800; display: grid; place-items: center; }
.num.big { width: 30px; height: 30px; font-size: 15px; }
.nm { font-family: var(--mpc-mono); font-size: 12px; font-weight: 800; overflow-wrap: anywhere; line-height: 1.25; }
.sh { font-size: 12px; color: var(--vp-c-text-2); line-height: 1.3; overflow-wrap: anywhere; max-width: 100%; }
.loopback { align-self: center; margin-left: 10px; font-size: 13px; font-weight: 800; color: var(--mpc-violet); }
.detail { margin-top: 14px; border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 12px 14px; }
.dh { display: flex; gap: 10px; align-items: center; }
.detail p { margin: 8px 0 !important; font-size: 15.5px !important; line-height: 1.6 !important; }
.src { font-size: 13.5px; font-weight: 700; display: inline-flex; gap: 6px; align-items: center; }
@media (max-width: 640px) { .st { width: calc(50% - 14px); } .conn { width: 10px; } }
@media (prefers-reduced-motion: reduce) { .st { transition: none; } }
</style>
