<script setup lang="ts">
import { ref, computed, watch } from 'vue';

/** Module 3: why a per-chunk regex redactor leaks, and how buffering fixes it. */
const CHUNKS = ['Your key is sk-ab', 'c123, keep', ' it safe.'];
const SECRET = /sk-[a-z0-9]+/g;
const PARTIAL = /(?:^|[^a-z0-9-])(s|sk|sk-[a-z0-9]*)$/;
const mode = ref<'none' | 'naive' | 'buffer'>('naive');
const i = ref(-1);
watch(mode, () => (i.value = -1));

const rows = computed(() => {
  let buf = '';
  return CHUNKS.map((c, n) => {
    if (mode.value === 'none') return { input: c, out: c, held: '' };
    if (mode.value === 'naive') return { input: c, out: c.replace(SECRET, '[REDACTED]'), held: '' };
    const all = buf + c;
    const m = n < CHUNKS.length - 1 ? all.match(PARTIAL) : null;
    const cut = m ? all.length - m[1].length : all.length;
    buf = all.slice(cut);
    return { input: c, out: all.slice(0, cut).replace(SECRET, '[REDACTED]'), held: buf };
  });
});
const client = computed(() => rows.value.slice(0, i.value + 1).map((r) => r.out).join(''));
const leaked = computed(() => /c123|sk-a/.test(client.value));
const finished = computed(() => i.value === CHUNKS.length - 1);
</script>

<template>
  <section class="sc mpc-card mpc-toy" aria-label="Stream redaction demo">
    <div class="mpc-kicker"><Icon name="eye" :size="14" /> Interactive: redact a secret from a stream</div>
    <p class="intro">The model is about to stream a secret, <code>sk-abc123</code>. The processor's regex is <code>/sk-[a-z0-9]+/g</code>. The provider splits it across chunks wherever it likes. Your <code>processOutputStream</code> sees one chunk at a time.</p>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="Processor">
      <span class="label">Processor</span>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'none'" @click="mode = 'none'">none</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'naive'" @click="mode = 'naive'">per-chunk regex</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'buffer'" @click="mode = 'buffer'">buffer in <code>state</code></button>
    </div>
    <ol class="rows">
      <li v-for="(r, n) in rows" :key="n" :class="{ shown: n <= i, cur: n === i }">
        <span class="lbl">chunk {{ n + 1 }}</span>
        <code class="in">"{{ r.input }}"</code>
        <span class="arrow" aria-hidden="true">→</span>
        <code class="out" v-if="n <= i">"{{ r.out }}"</code><code class="out pending" v-else>?</code>
        <span class="held" v-if="n <= i && r.held">holding back <code>"{{ r.held }}"</code></span>
      </li>
    </ol>
    <div class="client" :class="{ bad: leaked && finished, good: !leaked && finished }" aria-live="polite">
      <span class="mpc-kicker">What the user's screen shows</span>
      <div class="screen">{{ client || '…' }}<span class="caret" v-if="!finished" /></div>
      <div v-if="finished" class="verdict">{{ leaked ? (mode === 'naive' ? 'Leaked the tail: the regex only ever saw half the secret.' : 'Leaked. Nobody was checking.') : 'Redacted, at the cost of holding a few characters back.' }}</div>
    </div>
    <div class="ctrl">
      <button type="button" class="mpc-btn primary" :disabled="finished" @click="i++"><Icon name="next" :size="15" /> Next chunk</button>
      <button type="button" class="mpc-btn small" @click="i = -1"><Icon name="reset" :size="14" /> Restart</button>
    </div>
  </section>
</template>

<style scoped>
.sc { background: var(--vp-c-bg-soft); }
.intro { margin: 6px 0 10px !important; }
.rows { list-style: none; padding: 0 !important; margin: 14px 0 !important; display: grid; gap: 8px; }
.rows li { margin: 0 !important; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 8px 10px; border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); background: var(--mpc-paper); opacity: 0.55; }
.rows li.shown { opacity: 1; }
.rows li.cur { box-shadow: none; border-color: var(--mpc-violet); }
.lbl { font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; min-width: 62px; }
.in { background: var(--mpc-violet-soft) !important; }
.out { background: var(--mpc-teal-soft) !important; }
.out.pending { background: transparent !important; }
.held { font-size: var(--fs-xs); color: var(--mpc-amber); font-weight: var(--fw-semibold); }
.client { border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); padding: 10px 12px; background: var(--mpc-paper); }
.client.bad { background: var(--mpc-coral-soft); }
.client.good { background: var(--mpc-teal-soft); }
.screen { font-family: var(--mpc-mono); font-size: var(--fs-md); margin-top: 4px; min-height: 24px; }
.caret { display: inline-block; width: 8px; height: 16px; background: var(--mpc-ink); vertical-align: -2px; margin-left: 2px; }
@media (prefers-reduced-motion: no-preference) { .caret { animation: blink 1s steps(1) infinite; } }
@keyframes blink { 50% { opacity: 0; } }
.verdict { margin-top: 6px; font-weight: var(--fw-semibold); }
.ctrl { display: flex; gap: 8px; margin-top: 12px; }
</style>
