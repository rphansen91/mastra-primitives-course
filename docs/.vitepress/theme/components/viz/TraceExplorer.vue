<script setup lang="ts">
import { ref, computed } from 'vue';
import { fmt } from '../../progress';

/**
 * Module 9: the trace of one agent run (span tree from labs/m09-evals, timings illustrative),
 * and record/replay with prompt hashes (the lab's tape).
 */
type Span = { id: string; type: string; name: string; depth: number; start: number; end: number; color: string; chunk?: boolean; info: string; attrs?: Record<string, string> };
const SPANS: Span[] = [
  { id: 'run', type: 'agent_run', name: "agent run: 'ci-helper'", depth: 0, start: 0, end: 100, color: 'violet', info: 'The root. One per `generate()` / `stream()` call. Input and final output live here.', attrs: { input: '"Why did CI fail?"', output: '"CI failed on PR 42: lint error in auth.ts."', threadId: 'thread-1' } },
  { id: 'gen', type: 'model_generation', name: "llm: 'mock'", depth: 1, start: 3, end: 97, color: 'sky', info: 'The whole multi-step model conversation: every step of the loop sits under it. Usage totals roll up here.', attrs: { model: 'mock', steps: '2' } },
  { id: 's0', type: 'model_step', name: 'step: 0', depth: 2, start: 5, end: 52, color: 'teal', info: 'One turn of the loop (Module 2). This step ended with a tool call, so the loop went round again.', attrs: { finishReason: 'tool-calls' } },
  { id: 'p0', type: 'processor_run', name: 'llm request processor: provider-history-compat', depth: 3, start: 6, end: 9, color: 'amber', info: 'A built-in request processor (Module 3) that runs before every model request. Your own processors show up the same way: `<phase> processor: <id>`.', attrs: { phase: 'llm request' } },
  { id: 'u0', type: 'processor_run', name: 'llm request processor: unsupported-file-handler', depth: 3, start: 9, end: 10, color: 'amber', info: 'A second built-in request processor. It appears in 1.76.0 traces and not in 1.75.0 ones: a version bump can change your trace shape, which is why the lab asserts names and nesting, never exact span counts across versions.', attrs: { phase: 'llm request', since: '1.76.0' } },
  { id: 'i0', type: 'model_inference', name: 'inference: 0', depth: 3, start: 10, end: 30, color: 'coral', info: 'The actual provider call. In production this is where latency and tokens go.', attrs: { output: 'tool-call check_ci({ pr: 42 })' } },
  { id: 'c0a', type: 'model_chunk', name: 'chunk: tool-call', depth: 4, start: 26, end: 29, color: 'lime', chunk: true, info: 'One streamed chunk. Hidden by default in the lab: there are a lot of them.' },
  { id: 't0', type: 'tool_call', name: "tool: 'check_ci'", depth: 3, start: 32, end: 50, color: 'lime', info: 'The tool `execute`. Arguments and result are on the span: this is how you answer "what did the agent see?" at 3 am.', attrs: { args: '{ pr: 42 }', result: '{ status: "failed", reason: "lint error in auth.ts" }' } },
  { id: 's1', type: 'model_step', name: 'step: 1', depth: 2, start: 54, end: 95, color: 'teal', info: 'The second turn. The tool result is in the prompt; the model answers and the loop stops.', attrs: { finishReason: 'stop' } },
  { id: 'p1', type: 'processor_run', name: 'llm request processor: provider-history-compat', depth: 3, start: 55, end: 58, color: 'amber', info: 'Same processor, again: request processors run before **every** model request, not once per run.', attrs: { phase: 'llm request' } },
  { id: 'u1', type: 'processor_run', name: 'llm request processor: unsupported-file-handler', depth: 3, start: 58, end: 59, color: 'amber', info: 'Again before every request (new in 1.76.0).', attrs: { phase: 'llm request', since: '1.76.0' } },
  { id: 'i1', type: 'model_inference', name: 'inference: 1', depth: 3, start: 59, end: 93, color: 'coral', info: 'The final answer streams from here.', attrs: { output: '"CI failed on PR 42: lint error in auth.ts."' } },
  { id: 'c1a', type: 'model_chunk', name: 'chunk: text-delta', depth: 4, start: 80, end: 84, color: 'lime', chunk: true, info: 'One streamed text chunk.' },
  { id: 'c1b', type: 'model_chunk', name: 'chunk: text-delta', depth: 4, start: 86, end: 90, color: 'lime', chunk: true, info: 'Another one. Real runs have hundreds.' },
];
const tab = ref<'trace' | 'replay'>('trace');
const chunks = ref(false);
const spans = computed(() => SPANS.filter((s) => chunks.value || !s.chunk));
const sel = ref<string>('t0');
const cur = computed(() => SPANS.find((s) => s.id === sel.value)!);
const questions = [
  { q: 'What did the tool return?', span: 't0' },
  { q: 'Which processors touched the prompt?', span: 'p0' },
  { q: 'Why did the loop go round twice?', span: 's0' },
];

// replay
const changed = ref(false);
const replayed = ref(false);
const tape = [
  { hash: 'dc3ae83bd1', out: 'tool check_ci' },
  { hash: 'd95ce05e46', out: 'text' },
];
const calls = computed(() => (changed.value
  ? [{ hash: 'fcdcb0443f', hit: false }, { hash: '0c8b68d71b', hit: false }]
  : [{ hash: 'dc3ae83bd1', hit: true }, { hash: 'd95ce05e46', hit: true }]));
</script>

<template>
  <section class="te mpc-card" aria-label="Trace explorer and record/replay">
    <div class="mpc-kicker"><Icon name="eye" :size="14" /> Interactive: read the trace</div>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="View">
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="tab === 'trace'" @click="tab = 'trace'">Trace of one run</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="tab === 'replay'" @click="tab = 'replay'">Record &amp; replay</button>
    </div>

    <template v-if="tab === 'trace'">
      <div class="qs">
        <span class="ql">3 am questions:</span>
        <button v-for="q in questions" :key="q.q" type="button" class="mpc-btn small" @click="sel = q.span">{{ q.q }}</button>
      </div>
      <label class="sw"><input v-model="chunks" type="checkbox" /> show <code>model_chunk</code> spans</label>
      <div class="gantt" role="list">
        <button v-for="s in spans" :key="s.id" type="button" role="listitem" class="srow" :class="{ on: sel === s.id }" :aria-pressed="sel === s.id" @click="sel = s.id">
          <span class="lbl" :style="{ paddingLeft: s.depth * 12 + 'px' }"><span class="ty">{{ s.type }}</span> {{ s.name }}</span>
          <span class="track"><span class="bar" :class="`b-${s.color}`" :style="{ left: s.start + '%', width: Math.max(2, s.end - s.start) + '%' }" /></span>
        </button>
      </div>
      <p class="note">Span tree as printed by the lab (<code>TestExporter</code>). Bar widths are illustrative; the lab asserts names and nesting, never timing.</p>
      <div class="detail" aria-live="polite">
        <div><span class="ty big">{{ cur.type }}</span> <strong>{{ cur.name }}</strong></div>
        <p v-html="fmt(cur.info)" />
        <dl v-if="cur.attrs">
          <template v-for="(v, k) in cur.attrs" :key="k"><dt>{{ k }}</dt><dd><code>{{ v }}</code></dd></template>
        </dl>
      </div>
    </template>

    <template v-else>
      <p class="intro">Record the model's answers once, keyed by a hash of the <strong>prompt</strong>. Replay them in CI: no keys, no flakiness. And if your code changes the prompt, the tape tells you.</p>
      <div class="tapes">
        <div class="tape">
          <div class="mpc-kicker">The tape (recorded once)</div>
          <div v-for="t in tape" :key="t.hash" class="entry"><code>{{ t.hash }}</code> → {{ t.out }}</div>
        </div>
        <div class="tape">
          <div class="mpc-kicker">Replay</div>
          <label class="sw"><input v-model="changed" type="checkbox" @change="replayed = false" /> change the agent's <code>instructions</code></label>
          <div class="mpc-btn-row"><button type="button" class="mpc-btn primary" @click="replayed = true"><Icon name="play" :size="15" /> Replay the run</button></div>
          <template v-if="replayed">
            <div v-for="(c, k) in calls" :key="k" class="entry" :class="c.hit ? 'hit' : 'miss'">call {{ k + 1 }}: prompt <code>{{ c.hash }}</code> {{ c.hit ? '✓ on tape' : '✗ not on tape' }}</div>
            <p class="verdict" :class="changed ? 'bad' : 'good'" v-html="fmt(changed ? 'Both calls **miss**: the system prompt is part of every request, so every hash changed. The replay reports every miss, so your test fails instead of quietly passing on stale answers. Re-record, and review the diff.' : 'Same code, same prompts, same hashes: **0 misses**. The answer is byte-for-byte the recorded one: `CI failed on PR 42: lint error in auth.ts.`')" />
          </template>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.te { display: grid; gap: 12px; }
.qs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ql { font-size: 13px; font-weight: 800; }
.sw { font-size: 14px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.gantt { display: grid; gap: 3px; border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 8px; background: var(--mpc-paper); }
.srow { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 8px; align-items: center; border: 0; background: none; color: var(--mpc-ink); font: inherit; text-align: left; padding: 3px 4px; border-radius: 6px; cursor: pointer; }
.srow:hover { background: var(--vp-c-bg-soft); }
.srow.on { background: var(--mpc-violet-soft); outline: 2px solid var(--mpc-ink); }
.lbl { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ty { font-family: var(--mpc-mono); font-size: 10.5px; font-weight: 700; color: var(--mpc-ink-2); }
.ty.big { font-size: 12px; }
.track { position: relative; height: 14px; background: var(--vp-c-bg-soft); border-radius: 4px; }
.bar { position: absolute; top: 1px; bottom: 1px; border: 1.5px solid var(--mpc-ink); border-radius: 4px; }
.b-violet { background: var(--mpc-violet-soft); } .b-sky { background: var(--mpc-sky-soft); } .b-teal { background: var(--mpc-teal-soft); }
.b-amber { background: var(--mpc-amber-soft); } .b-coral { background: var(--mpc-coral-soft); } .b-lime { background: var(--mpc-lime-soft); }
.note { margin: -4px 0 0; font-size: 12.5px; color: var(--mpc-ink-2); }
.detail { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; background: var(--vp-c-bg-soft); min-width: 0; }
.detail p { margin: 6px 0; font-size: 14px; }
.detail dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin: 0; font-size: 13px; }
.detail dt { font-weight: 800; }
.detail dd { margin: 0; overflow-wrap: break-word; min-width: 0; }
.intro { margin: 0; font-size: 14.5px; }
.tapes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.tape { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px; background: var(--mpc-paper); display: grid; gap: 8px; align-content: start; min-width: 0; }
.entry { font-size: 13px; border: 2px solid var(--mpc-ink); border-radius: 8px; padding: 4px 8px; background: var(--vp-c-bg-soft); }
.entry.hit { background: var(--mpc-teal-soft); } .entry.miss { background: var(--mpc-coral-soft); }
.verdict { margin: 0; font-size: 13.5px; border-radius: 8px; padding: 6px 8px; border: 2px solid var(--mpc-ink); }
.verdict.good { background: var(--mpc-teal-soft); } .verdict.bad { background: var(--mpc-amber-soft); }
@media (max-width: 520px) { .srow { grid-template-columns: 1fr; gap: 2px; } }
</style>
