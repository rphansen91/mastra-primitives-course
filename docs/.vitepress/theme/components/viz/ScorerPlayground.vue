<script setup lang="ts">
import { ref, computed } from 'vue';
import { fmt } from '../../progress';

/**
 * Module 9: a scorer is a four-stage pipeline. Run the lab's rule scorer (buggy and fixed),
 * an LLM judge, and a completion scorer that keeps the agent loop going.
 */
const mode = ref<'rule' | 'judge' | 'loop'>('rule');
const STAGES = ['preprocess', 'analyze', 'generateScore', 'generateReason'] as const;

// --- rule scorer over the dataset
const rows = [
  { q: 'Why did CI fail?', a: 'CI failed on PR 42: lint error in auth.ts.' },
  { q: 'Is CI green?', a: 'No. PR 42 is red.' },
  { q: 'What broke the build?', a: 'A lint error in auth.ts broke it.' },
];
const fixed = ref(false);
const row = ref(0);
const extract = (i: number) => (fixed.value ? rows[i]!.a : '');
const score = (i: number) => (/lint error/i.test(extract(i)) ? 1 : 0);
const avg = computed(() => rows.reduce((s, _r, i) => s + score(i), 0) / rows.length);
const ruleStages = computed(() => [
  { s: 'preprocess', out: fixed.value ? `every text part, joined → "${extract(row.value)}"` : 'output[0].content.parts[0].text → "" (part 0 is a tool-invocation!)' },
  { s: 'analyze', out: 'skipped: a pure function needs no analysis step' },
  { s: 'generateScore', out: `/lint error/i.test(text) → ${score(row.value)}` },
  { s: 'generateReason', out: score(row.value) ? '"names the failure reason"' : '"does not name the failure reason"' },
]);

// --- judge
const answers = [
  { a: 'CI failed because the build uses Rust.', grounded: false, unsupported: ['the build uses Rust'] },
  { a: 'CI failed on PR 42: lint error in auth.ts.', grounded: true, unsupported: [] as string[] },
];
const ans = ref(0);
const J = computed(() => answers[ans.value]!);
const judgeStages = computed(() => [
  { s: 'preprocess', out: 'skipped' },
  { s: 'analyze', out: `judge model, prompt:\n  Tool result: {"status":"failed","reason":"lint error in auth.ts"}\n  Answer: ${J.value.a}\n  Which claims are not supported by the tool result?\njudge returns: ${JSON.stringify({ grounded: J.value.grounded, unsupported: J.value.unsupported })}` },
  { s: 'generateScore', out: `results.analyzeStepResult.grounded ? 1 : 0 → ${J.value.grounded ? 1 : 0}` },
  { s: 'generateReason', out: `"unsupported: ${J.value.unsupported.join(', ') || '(none)'}"` },
]);

// --- isTaskComplete loop
const ITERS = [
  { text: 'Draft 1: Mastra is a TypeScript agent framework.', score: 0 },
  { text: 'Draft 2: Mastra is a TypeScript agent framework.', score: 0 },
  { text: ' Mastra is a TypeScript agent framework [1].', score: 1 },
];
const it = ref(0);
const shown = computed(() => ITERS.slice(0, it.value));
const done = computed(() => it.value === ITERS.length);
const acc = computed(() => shown.value.map((x) => x.text).join(''));
</script>

<template>
  <section class="sp mpc-card" aria-label="Scorer playground">
    <div class="mpc-kicker"><Icon name="flask" :size="14" /> Interactive: score it</div>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="Scorer">
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'rule'" @click="mode = 'rule'">Rule scorer × dataset</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'judge'" @click="mode = 'judge'">LLM judge</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'loop'" @click="mode = 'loop'">Scorer drives the loop</button>
    </div>

    <template v-if="mode === 'rule'">
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Scorer version">
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="!fixed" @click="fixed = false">reads the first part (Exercise 9.1 starter)</button>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="fixed" @click="fixed = true">reads every text part (fixed)</button>
      </div>
      <div class="data">
        <button v-for="(r, i) in rows" :key="r.q" type="button" class="drow" :class="{ on: row === i }" :aria-pressed="row === i" @click="row = i">
          <span class="dq">{{ r.q }}</span>
          <span class="parts"><span class="part tool">tool-invocation</span><span class="part">step-start</span><span class="part text">text: {{ r.a }}</span></span>
          <span class="sc" :class="score(i) ? 's1' : 's0'">{{ score(i) }}</span>
        </button>
        <div class="avg">average: <strong>{{ avg.toFixed(2) }}</strong> <span v-if="!fixed" class="warn">every answer scores 0, even the right ones</span></div>
      </div>
      <ol class="pipe">
        <li v-for="st in ruleStages" :key="st.s" :class="{ skip: st.out.startsWith('skipped') }"><code class="sn">{{ st.s }}</code><pre>{{ st.out }}</pre></li>
      </ol>
    </template>

    <template v-else-if="mode === 'judge'">
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Answer to grade">
        <button v-for="(x, i) in answers" :key="i" type="button" role="radio" class="mpc-toggle" :aria-checked="ans === i" @click="ans = i">{{ i === 0 ? 'answer with an invented claim' : 'grounded answer' }}</button>
      </div>
      <ol class="pipe">
        <li v-for="st in judgeStages" :key="st.s" :class="{ skip: st.out === 'skipped', llm: st.s === 'analyze' }"><code class="sn">{{ st.s }}</code><pre>{{ st.out }}</pre></li>
      </ol>
      <p class="note" v-html="fmt('In the lab the judge is a scripted mock too, so the test can assert the **prompt the judge received**. Judges are models: they drift and cost money. Use a rule wherever the property is checkable.')" />
    </template>

    <template v-else>
      <p class="intro" v-html="fmt('`agent.generate(prompt, { isTaskComplete: { scorers: [citations], strategy: \'all\' } })`. The `citations` scorer returns 1 only if the answer has a `[1]`.')" />
      <div class="iters">
        <div v-for="(x, k) in shown" :key="k" class="iter">
          <div class="it-h">model call {{ k + 1 }}</div>
          <div class="it-t">“{{ x.text }}”</div>
          <div class="sc" :class="x.score ? 's1' : 's0'">citations: {{ x.score }}</div>
          <div v-if="!x.score" class="fb">feedback added: <code>#### Completion Check Results Overall: ❌ NOT COMPLETE</code> → loop continues</div>
          <div v-else class="fb ok"><Icon name="check" :size="13" /> complete → loop stops</div>
        </div>
      </div>
      <div class="mpc-btn-row">
        <button type="button" class="mpc-btn primary" :disabled="done" @click="it++"><Icon name="next" :size="15" /> {{ it === 0 ? 'Run the first model call' : 'Next model call' }}</button>
        <button type="button" class="mpc-btn small" @click="it = 0">Reset</button>
      </div>
      <div v-if="done" class="res" aria-live="polite">
        <div><strong>model calls: 3</strong></div>
        <div><code>result.text</code>: “{{ acc }}”</div>
        <p v-html="fmt('Surprise: `result.text` **accumulates** every iteration\'s text. If you want only the final draft, read the last step, or make each attempt a complete answer.')" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.sp { display: grid; gap: 12px; }
.data { display: grid; gap: 6px; }
.drow { display: grid; grid-template-columns: minmax(110px, 160px) minmax(0, 1fr) 34px; gap: 8px; align-items: center; text-align: left; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 6px 8px; background: var(--mpc-paper); color: var(--mpc-ink); font: inherit; cursor: pointer; }
.drow.on { outline: 3px solid var(--mpc-violet); }
.dq { font-weight: 800; font-size: 13.5px; }
.parts { display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
.part { font-family: var(--mpc-mono); font-size: 11px; border: 1.5px solid var(--mpc-ink); border-radius: 6px; padding: 0 5px; background: var(--vp-c-bg-soft); overflow-wrap: break-word; }
.part.tool { background: var(--mpc-amber-soft); } .part.text { background: var(--mpc-sky-soft); }
.sc { justify-self: center; font-weight: 800; border: 2px solid var(--mpc-ink); border-radius: 999px; padding: 0 9px; font-size: 13px; }
.s1 { background: var(--mpc-teal-soft); } .s0 { background: var(--mpc-coral-soft); }
.avg { font-size: 14px; }
.warn { color: var(--mpc-coral); font-weight: 700; margin-left: 6px; }
.pipe { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; counter-reset: st; }
.pipe li { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 8px; align-items: start; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 6px 8px; background: var(--mpc-paper); }
.pipe li.skip { opacity: 0.5; border-style: dashed; }
.pipe li.llm { background: var(--mpc-violet-soft); }
.sn { font-weight: 800; background: none !important; padding: 0 !important; }
.pipe pre { margin: 0 !important; padding: 0 !important; background: none !important; font-family: var(--mpc-mono); font-size: 12px; white-space: pre-wrap; overflow-wrap: break-word; }
.note, .intro { margin: 0; font-size: 13.5px; }
.iters { display: grid; gap: 8px; }
.iter { display: grid; gap: 4px; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 8px 10px; background: var(--mpc-paper); }
.it-h { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mpc-ink-2); }
.it-t { font-size: 14px; }
.iter .sc { justify-self: start; }
.fb { font-size: 12.5px; overflow-wrap: break-word; }
.fb.ok { color: var(--mpc-teal); font-weight: 700; }
.res { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; background: var(--mpc-amber-soft); font-size: 14px; overflow-wrap: break-word; }
.res p { margin: 6px 0 0; }
@media (max-width: 560px) { .drow { grid-template-columns: minmax(0, 1fr) 34px; } .parts { grid-column: 1 / -1; grid-row: 2; } .pipe li { grid-template-columns: 1fr; } }
</style>
