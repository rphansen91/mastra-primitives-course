<script setup lang="ts">
import { ref, computed } from 'vue';
import { fmt } from '../../progress';
import { PRIMITIVES, PLACEMENTS } from '../../primitives';

/** Module 10: every "where it falls down" from the course, mapped to a candidate primitive and its prior art. */
const MODULES = [
  { n: '03', t: 'Processors' }, { n: '05', t: 'Workflows' }, { n: '06', t: 'Signals' }, { n: '07', t: 'Durability' }, { n: '09', t: 'Evals' },
];
const mod = ref<string | null>(null);
const list = computed(() => PRIMITIVES.filter((p) => !mod.value || p.module.includes(mod.value)));
const sel = ref('journal');
const p = computed(() => PRIMITIVES.find((x) => x.id === sel.value)!);
const placeLabel = (k: string) => PLACEMENTS.find((x) => x.key === k)!.label;
function pick(id: string) { sel.value = id; }
function filter(n: string | null) {
  mod.value = n;
  if (!list.value.some((x) => x.id === sel.value)) sel.value = list.value[0]!.id;
}
const sizeText = { S: 'small: a weekend', M: 'medium: a week', L: 'large: a few weeks' } as const;
</script>

<template>
  <section class="ge mpc-card" aria-label="Gap explorer">
    <div class="mpc-kicker"><Icon name="map" :size="14" /> Interactive: the gap explorer</div>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="Filter by module">
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mod === null" @click="filter(null)">All gaps</button>
      <button v-for="m in MODULES" :key="m.n" type="button" role="radio" class="mpc-toggle" :aria-checked="mod === m.n" @click="filter(m.n)">M{{ m.n }} {{ m.t }}</button>
    </div>
    <div class="cols">
      <ul class="gaps" role="list">
        <li v-for="x in list" :key="x.id">
          <button type="button" class="gap" :class="[`g-${x.color}`, { on: sel === x.id }]" :aria-pressed="sel === x.id" @click="pick(x.id)">
            <span class="gm">M{{ x.module }}</span>
            <span class="gt">{{ x.name }}</span>
          </button>
        </li>
      </ul>
      <article class="card" :class="`g-${p.color}`" aria-live="polite">
        <h4>{{ p.name }}</h4>
        <div class="flow">
          <div class="fbox"><div class="fk">The gap</div><div v-html="fmt(p.gap)" /></div>
          <div class="arr" aria-hidden="true">→</div>
          <div class="fbox"><div class="fk">Proof it's real</div><div v-html="fmt(p.proof)" /></div>
        </div>
        <div class="fk">What a user might write</div>
        <pre><code>{{ p.api }}</code></pre>
        <div class="fk">Prior art</div>
        <table class="prior">
          <thead><tr><th>System</th><th>API</th><th>Guarantee</th></tr></thead>
          <tbody><tr v-for="r in p.prior" :key="r[0]"><td>{{ r[0] }}</td><td><code>{{ r[1] }}</code></td><td>{{ r[2] }}</td></tr></tbody>
        </table>
        <div class="meta">
          <span class="chip">best fit: <b>{{ placeLabel(p.best) }}</b></span>
          <span class="chip">size: {{ sizeText[p.size] }}</span>
        </div>
        <div class="fk">Hard parts</div>
        <ul class="hard"><li v-for="h in p.hard" :key="h">{{ h }}</li></ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.ge { display: grid; gap: 12px; }
.cols { display: grid; grid-template-columns: minmax(180px, 230px) minmax(0, 1fr); gap: 12px; align-items: start; }
.gaps { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.gaps li { margin: 0; }
.gap { width: 100%; display: grid; gap: 2px; text-align: left; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 6px 10px; color: var(--mpc-ink); font: inherit; cursor: pointer; box-shadow: 2px 2px 0 var(--mpc-shadow); }
.gap.on { outline: 3px solid var(--mpc-ink); outline-offset: 1px; transform: translate(-1px, -1px); }
.gm { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: var(--mpc-ink-2); }
.gt { font-weight: 800; font-size: 14px; line-height: 1.3; }
.g-coral { background: var(--mpc-coral-soft); } .g-amber { background: var(--mpc-amber-soft); } .g-sky { background: var(--mpc-sky-soft); }
.g-violet { background: var(--mpc-violet-soft); } .g-teal { background: var(--mpc-teal-soft); } .g-lime { background: var(--mpc-lime-soft); }
.card { border: 2px solid var(--mpc-ink); border-radius: 14px; padding: 12px 14px; min-width: 0; display: grid; gap: 8px; box-shadow: 3px 3px 0 var(--mpc-shadow); }
.card h4 { margin: 0 !important; font-size: 18px; }
.flow { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 8px; align-items: stretch; }
.fbox { background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 8px 10px; font-size: 13.5px; }
.arr { align-self: center; font-weight: 800; font-size: 20px; }
.fk { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mpc-ink-2); margin-bottom: 2px; }
.card pre { margin: 0 !important; padding: 8px 10px !important; border-radius: 10px; background: var(--mpc-paper) !important; border: 2px solid var(--mpc-ink); white-space: pre-wrap; overflow-wrap: anywhere; }
.card pre code { font-size: 12px !important; background: none !important; padding: 0 !important; white-space: pre-wrap !important; }
.prior { display: table; width: 100%; margin: 0 !important; font-size: 12.5px; border-collapse: collapse; background: var(--mpc-paper); }
.prior th, .prior td { padding: 4px 6px !important; border: 1.5px solid var(--mpc-ink) !important; }
.prior code { font-size: 11.5px; overflow-wrap: anywhere; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: 12.5px; border: 2px solid var(--mpc-ink); border-radius: 999px; padding: 1px 10px; background: var(--mpc-paper); }
.hard { margin: 0; padding-left: 18px; font-size: 13.5px; }
@media (max-width: 640px) {
  .cols { grid-template-columns: 1fr; }
  .gaps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .flow { grid-template-columns: 1fr; } .arr { transform: rotate(90deg); justify-self: center; }
}
</style>
