<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { fmt, prefersReducedMotion } from '../../progress';

/**
 * Step through one agent run, phase by phase. Three scenarios:
 *  - "one tool": the exact hook order Lab 2 verifies on @mastra/core 1.75.0 and 1.76.0
 *  - "parallel": two tool calls in one step (toggle toolCallConcurrency)
 *  - "runaway": the model repeats itself (toggle a stopWhen condition)
 */
type NodeId = 'input' | 'prep' | 'model' | 'vet' | 'tools' | 'fold' | 'stop' | 'output';
type Msg = { role: 'system' | 'user' | 'assistant' | 'tool'; text: string };
type Frame = { node: NodeId; text: string; hook?: string; add?: Msg[]; chunks?: string[]; step?: number; warn?: boolean; win?: boolean; seats?: number; lanes?: string[] };

const props = withDefaults(defineProps<{ initial?: 'one' | 'parallel' | 'runaway' }>(), { initial: 'one' });
const scenario = ref<'one' | 'parallel' | 'runaway'>(props.initial);
const serial = ref(false); // toolCallConcurrency: 1
const guard = ref(false); // stopWhen: stopOnRepeat(3)
const i = ref(0);
const playing = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const NODES: Record<NodeId, { x: number; y: number; title: string; sub: string; color: string }> = {
  input: { x: 320, y: 30, title: 'agent.stream()', sub: 'processInput · once', color: 'sky' },
  prep: { x: 320, y: 112, title: 'Prepare request', sub: 'processInputStep', color: 'violet' },
  model: { x: 540, y: 186, title: 'Model call', sub: 'doStream', color: 'amber' },
  vet: { x: 540, y: 316, title: 'Vet the turn', sub: 'processOutputStep', color: 'coral' },
  tools: { x: 320, y: 392, title: 'Run tools', sub: 'foreach(toolCallStep)', color: 'teal' },
  fold: { x: 100, y: 316, title: 'Fold results', sub: 'llmMappingStep', color: 'lime' },
  stop: { x: 100, y: 186, title: 'Stop check', sub: 'dowhile predicate', color: 'violet' },
  output: { x: 100, y: 30, title: 'finish', sub: 'processOutputResult', color: 'sky' },
};
const EDGES: { id: string; d: string; label?: string; dashed?: boolean }[] = [
  { id: 'input-prep', d: 'M320 57 L320 82' },
  { id: 'prep-model', d: 'M398 120 Q500 128 532 156' },
  { id: 'model-vet', d: 'M540 214 L540 286' },
  { id: 'vet-tools', d: 'M520 344 Q470 392 398 394' },
  { id: 'tools-fold', d: 'M242 394 Q170 392 120 344' },
  { id: 'fold-stop', d: 'M100 288 L100 214' },
  { id: 'stop-prep', d: 'M108 158 Q140 120 242 114', label: 'continue' },
  { id: 'vet-stop', d: 'M462 300 Q320 250 178 202', label: 'no tool calls', dashed: true },
  { id: 'stop-output', d: 'M100 158 L100 58', label: 'stop' },
];

const SYS: Msg = { role: 'system', text: 'You triage CI.' };
const frames = computed<Frame[]>(() => {
  if (scenario.value === 'one') {
    return [
      { node: 'input', text: "You call `agent.stream('Why is PR 42 red?')`. Before anything else, `processInput` runs **once** over the incoming messages.", hook: 'processInput (once)', add: [SYS, { role: 'user', text: 'Why is PR 42 red?' }] },
      { node: 'prep', text: 'Step 0 begins. `processInputStep` runs before **every** model request: the place to inject context, trim history or swap tools.', hook: 'processInputStep · step 0', chunks: ['start', 'step-start'] },
      { node: 'model', text: "The model streams back a turn. It doesn't answer yet. It asks for a tool: `check_ci({ pr: 42 })`.", hook: 'model doStream #1', chunks: ['tool-call'], add: [{ role: 'assistant', text: 'tool-call → check_ci({ pr: 42 })' }] },
      { node: 'vet', text: '`processOutputStep` sees the finished turn (finishReason `tool-calls`) **before any tool runs**. Last chance to veto a side effect.', hook: 'processOutputStep · finish=tool-calls' },
      { node: 'tools', text: "Now the tool runs. `check_ci` returns `{ status: 'failed', reason: 'docker hub 429' }`. If it threw, the error would become data for the model, not a crash.", hook: 'tool.execute check_ci(pr=42)', chunks: ['tool-result'] },
      { node: 'fold', text: 'The result is folded into the message list **in call order**. The next prompt is fully determined by what happened.', add: [{ role: 'tool', text: "check_ci → { status: 'failed', reason: 'docker hub 429' }" }] },
      { node: 'stop', text: 'Stop check. The turn ended with tool calls, so the loop goes round again. `onIterationComplete` and `onStepFinish` fire; the client gets `step-finish`.', hook: 'onIterationComplete · isFinal=false', chunks: ['step-finish'], step: 1 },
      { node: 'prep', text: 'Step 1. `processInputStep` runs again, and this time the prompt contains the tool result.', hook: 'processInputStep · step 1', chunks: ['step-start'] },
      { node: 'model', text: 'The model answers in plain text. No tool calls this time.', hook: 'model doStream #2', chunks: ['text-start', 'text-delta', 'text-end'], add: [{ role: 'assistant', text: 'PR 42 is red because Docker Hub rate-limited the build (429). Re-run it.' }] },
      { node: 'vet', text: '`processOutputStep` again: finishReason `stop`, zero tool calls. Nothing to vet, nothing to run.', hook: 'processOutputStep · finish=stop' },
      { node: 'stop', text: 'No tool calls, so the loop stops. Notice the dashed shortcut: the tools phase was skipped entirely.', hook: 'onIterationComplete · isFinal=true', chunks: ['step-finish'], step: 2 },
      { node: 'output', text: '`processOutputResult` runs **once** over the final messages and the stream ends with `finish`. That is the same 15-event order Lab 2 asserts against the real package.', hook: 'processOutputResult (once)', chunks: ['finish'], win: true },
    ];
  }
  if (scenario.value === 'parallel') {
    const lanesPar = ['#1 read 10 … waiting', '#2 read 10 … waiting'];
    const done: Frame[] = serial.value
      ? [
          { node: 'tools', text: 'With `toolCallConcurrency: 1`, call #1 runs **alone**: reads 10, writes 9.', hook: 'tool.execute reserve_seat #1', chunks: ['tool-result'], seats: 9, lanes: ['#1 read 10 → wrote 9 ✓', '#2 queued'] },
          { node: 'tools', text: 'Then call #2: reads 9, writes 8. Slower, but correct.', hook: 'tool.execute reserve_seat #2', chunks: ['tool-result'], seats: 8, lanes: ['#1 done ✓', '#2 read 9 → wrote 8 ✓'], win: true },
        ]
      : [
          { node: 'tools', text: 'Both calls start **at the same time** (default concurrency is 10). Each one reads `seats_left = 10`, then awaits.', hook: 'tool.execute × 2 (concurrent)', seats: 10, lanes: lanesPar },
          { node: 'tools', text: 'Call #2 finishes first and writes 9. Then call #1 writes… 9. **One booking just vanished.** The test in Break it 2.2 expects 8.', hook: 'tool-result #2, then #1', chunks: ['tool-result', 'tool-result'], seats: 9, warn: true, lanes: ['#1 read 10 → wrote 9', '#2 read 10 → wrote 9 (first)'] },
        ];
    return [
      { node: 'input', text: "Scenario: a booking agent. `agent.stream('Book two seats on MA-101')`. The database says 10 seats left.", hook: 'processInput (once)', add: [{ role: 'system', text: 'You book flights.' }, { role: 'user', text: 'Book two seats on MA-101.' }], seats: 10 },
      { node: 'prep', text: 'Step 0: `processInputStep`.', hook: 'processInputStep · step 0', chunks: ['start', 'step-start'], seats: 10 },
      { node: 'model', text: 'The model emits **two tool calls in one turn**: `reserve_seat(#1)` and `reserve_seat(#2)`.', hook: 'model doStream #1', chunks: ['tool-call', 'tool-call'], add: [{ role: 'assistant', text: 'tool-call → reserve_seat(#1), reserve_seat(#2)' }], seats: 10 },
      { node: 'vet', text: '`processOutputStep` sees both calls before either runs.', hook: 'processOutputStep · toolCalls=2', seats: 10 },
      ...done,
      { node: 'fold', text: 'Results fold back in **call order** (#1, then #2), no matter which finished first. The loop guarantees *order*. It does not guarantee *isolation*.', add: [{ role: 'tool', text: 'reserve_seat #1 → ok' }, { role: 'tool', text: 'reserve_seat #2 → ok' }], seats: serial.value ? 8 : 9, warn: !serial.value },
      { node: 'stop', text: 'Tool calls happened, so: continue.', hook: 'onIterationComplete · isFinal=false', chunks: ['step-finish'], step: 1, seats: serial.value ? 8 : 9 },
      { node: 'prep', text: 'Step 1.', hook: 'processInputStep · step 1', chunks: ['step-start'], seats: serial.value ? 8 : 9 },
      { node: 'model', text: 'The model happily reports success either way. It has no idea a write was lost.', chunks: ['text-delta'], add: [{ role: 'assistant', text: 'Done! Both seats are booked.' }], seats: serial.value ? 8 : 9 },
      { node: 'vet', text: 'finishReason `stop`.', hook: 'processOutputStep · finish=stop', seats: serial.value ? 8 : 9 },
      { node: 'stop', text: 'No tool calls: stop.', chunks: ['step-finish'], step: 2, seats: serial.value ? 8 : 9 },
      { node: 'output', text: serial.value ? 'Seats left: **8**. Correct. Now flip the toggle off and watch it break.' : 'Seats left: **9**. The run "succeeded" and the data is wrong. Flip `toolCallConcurrency: 1` on, or better, make the tool atomic.', chunks: ['finish'], seats: serial.value ? 8 : 9, warn: !serial.value, win: serial.value },
    ];
  }
  // runaway
  const iter = (n: number): Frame[] => [
    { node: 'model', text: `Step ${n - 1}: the model asks for \`search({ q: 'flaky' })\`. Again.`, chunks: ['tool-call'], add: [{ role: 'assistant', text: `tool-call → search({ q: 'flaky' })  #${n}` }] },
    { node: 'tools', text: 'Same call, same result.', chunks: ['tool-result'], add: [{ role: 'tool', text: `search → 0 results  #${n}` }] },
    guard.value && n >= 3
      ? { node: 'stop', text: '`stopOnRepeat(3)` sees the last three tool calls are identical and returns true. `decideContinuation` stops the run. Total damage: 3 calls.', hook: 'stopWhen → true', chunks: ['step-finish'], step: n, win: true }
      : { node: 'stop', text: n >= 3 ? 'Still going. `maxSteps` is a **budget**, not a policy. Nothing here notices the model is stuck.' : 'Tool calls happened, so: continue.', hook: 'onIterationComplete · isFinal=false', chunks: ['step-finish'], step: n, warn: n >= 3 },
  ];
  const head: Frame[] = [
    { node: 'input', text: "`agent.stream('Find the flaky test')`, with `maxSteps: 30`.", hook: 'processInput (once)', add: [{ role: 'system', text: 'You debug CI.' }, { role: 'user', text: 'Find the flaky test.' }] },
    { node: 'prep', text: 'Step 0.', hook: 'processInputStep · step 0', chunks: ['start', 'step-start'] },
    ...iter(1),
    { node: 'prep', text: 'Step 1.', hook: 'processInputStep · step 1', chunks: ['step-start'] },
    ...iter(2),
    { node: 'prep', text: 'Step 2.', hook: 'processInputStep · step 2', chunks: ['step-start'] },
    ...iter(3),
  ];
  if (guard.value) return [...head, { node: 'output', text: 'Run finished early with a clear reason. Turn the guard off to see the alternative.', chunks: ['finish'], win: true }];
  return [
    ...head,
    { node: 'prep', text: 'Steps 3 to 29: the exact same thing, 27 more times. Every one is a billed model call.', hook: 'processInputStep · steps 3…29', chunks: ['step-start', '…', 'step-finish'], step: 30, warn: true },
    { node: 'stop', text: '`maxSteps` reached. 30 identical tool calls. Turn on the `stopWhen` guard and replay.', hook: 'maxSteps → stop', step: 30, warn: true },
    { node: 'output', text: 'The run ends with finish reason from the step budget, not from understanding. Break it 2.1 has you write that guard for real.', chunks: ['finish'], warn: true },
  ];
});

const cur = computed(() => frames.value[Math.min(i.value, frames.value.length - 1)]);
const prevNode = computed(() => (i.value > 0 ? frames.value[i.value - 1].node : null));
const activeEdge = computed(() => (prevNode.value ? `${prevNode.value}-${cur.value.node}` : ''));
const messages = computed(() => {
  const out: (Msg & { fresh: boolean })[] = [];
  frames.value.slice(0, i.value + 1).forEach((f, k) => f.add?.forEach((m) => out.push({ ...m, fresh: k === i.value })));
  return out;
});
const chunks = computed(() => {
  const out: { c: string; fresh: boolean }[] = [];
  frames.value.slice(0, i.value + 1).forEach((f, k) => f.chunks?.forEach((c) => out.push({ c, fresh: k === i.value })));
  return out;
});
const step = computed(() => {
  let s = 0;
  for (const f of frames.value.slice(0, i.value + 1)) if (f.step !== undefined) s = f.step;
  return s;
});
const maxSteps = computed(() => (scenario.value === 'runaway' ? 30 : 5));

function next() { if (i.value < frames.value.length - 1) i.value++; else stop(); }
function prev() { if (i.value > 0) i.value--; }
function reset() { stop(); i.value = 0; }
function stop() { playing.value = false; clearInterval(timer); }
function play() {
  if (playing.value) return stop();
  if (i.value >= frames.value.length - 1) i.value = 0;
  playing.value = true;
  timer = setInterval(next, prefersReducedMotion() ? 2600 : 1700);
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  else if (e.key === 'Home') { e.preventDefault(); reset(); }
}
watch([scenario, serial, guard], () => reset());
onBeforeUnmount(stop);
const tok = computed(() => NODES[cur.value.node]);
</script>

<template>
  <section class="lv mpc-card mpc-anim" aria-label="Agent loop visualizer" aria-roledescription="step-through animation">
    <div class="topbar">
      <div class="mpc-kicker"><Icon name="play" :size="14" /> Interactive: one agent run, step by step</div>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Scenario">
        <span class="label">Scenario</span>
        <button v-for="s in [['one', 'One tool call'], ['parallel', 'Two tools at once'], ['runaway', 'Runaway loop']]" :key="s[0]"
          type="button" role="radio" class="mpc-toggle" :aria-checked="scenario === s[0]" @click="scenario = s[0] as any">{{ s[1] }}</button>
      </div>
    </div>
    <div class="opts" v-if="scenario !== 'one'">
      <label v-if="scenario === 'parallel'" class="sw"><input type="checkbox" v-model="serial" /> <code>toolCallConcurrency: 1</code></label>
      <label v-if="scenario === 'runaway'" class="sw"><input type="checkbox" v-model="guard" /> <code>stopWhen: stopOnRepeat(3)</code></label>
    </div>

    <div class="stage" tabindex="0" @keydown="onKey" aria-label="Loop diagram. Use left and right arrow keys to step.">
      <svg class="ill diagram" viewBox="0 0 640 430" role="img" :aria-label="`Loop diagram, current phase: ${NODES[cur.node].title}`">
        <defs>
          <marker id="lv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" class="f-ink" />
          </marker>
          <marker id="lv-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" class="c-violet" />
          </marker>
        </defs>
        <g v-for="e in EDGES" :key="e.id">
          <path :d="e.d" class="stroke edge" :class="{ hot: activeEdge === e.id }" :stroke-dasharray="e.dashed ? '7 7' : undefined"
            :marker-end="activeEdge === e.id ? 'url(#lv-arrow-hot)' : 'url(#lv-arrow)'" />
        </g>
        <text x="436" y="276" font-size="12" class="t-dim" text-anchor="middle" transform="rotate(-19 436 276)">no tool calls</text>
        <text x="160" y="128" font-size="12" class="t-dim">continue</text>
        <text x="110" y="112" font-size="12" class="t-dim">stop</text>
        <!-- center -->
        <g transform="translate(266 196)">
          <circle cx="54" cy="54" r="60" class="f-paper outline" stroke-dasharray="4 6" />
        </g>
        <foreignObject x="276" y="200" width="88" height="96"><div class="ctr"><Mascot :mood="cur.warn ? 'alarmed' : cur.win ? 'cheer' : 'thinking'" :size="60" /></div></foreignObject>
        <text x="320" y="300" text-anchor="middle" font-size="12.5" class="t-strong">step {{ step }} / maxSteps {{ maxSteps }}</text>
        <!-- nodes -->
        <g v-for="(n, id) in NODES" :key="id" class="node" :class="{ active: cur.node === id }">
          <rect :x="n.x - 74 + 4" :y="n.y - 26 + 4" width="148" height="52" rx="14" class="shadow" />
          <rect :x="n.x - 74" :y="n.y - 26" width="148" height="52" rx="14" :class="`f-${n.color}`" class="outline box" />
          <text :x="n.x" :y="n.y - 3" text-anchor="middle" font-size="15" class="t-strong">{{ n.title }}</text>
          <text :x="n.x" :y="n.y + 15" text-anchor="middle" font-size="11" class="t-mono t-dim">{{ n.sub }}</text>
        </g>
        <!-- token -->
        <g class="token" :style="{ transform: `translate(${tok.x + 66}px, ${tok.y - 24}px)` }">
          <circle r="11" class="c-violet outline" stroke-width="2.5" />
          <circle r="4" class="f-paper" />
        </g>
      </svg>

      <div class="panels">
        <div class="panel">
          <div class="ph">Message list <span class="dim">(the next prompt)</span></div>
          <ul class="msgs">
            <li v-for="(m, k) in messages" :key="k" :class="[m.role, { fresh: m.fresh }]">
              <span class="role">{{ m.role }}</span><span class="mt">{{ m.text }}</span>
            </li>
          </ul>
        </div>
        <div class="panel">
          <div class="ph">Stream to the client <span class="dim">(fullStream chunks)</span></div>
          <div class="chunks">
            <span v-for="(c, k) in chunks" :key="k" class="ck" :class="{ fresh: c.fresh }">{{ c.c }}</span>
            <span v-if="!chunks.length" class="dim">nothing yet</span>
          </div>
        </div>
        <div class="panel" v-if="cur.seats !== undefined">
          <div class="ph">Database: <code>seats_left</code></div>
          <div class="seats" :class="{ bad: cur.warn }">
            <strong>{{ cur.seats }}</strong>
            <span class="lanes"><span v-for="(l, k) in cur.lanes ?? []" :key="k" class="lane">{{ l }}</span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="narr" :class="{ warn: cur.warn, win: cur.win }" aria-live="polite">
      <div class="nh">
        <span class="mpc-chip">{{ i + 1 }} / {{ frames.length }}</span>
        <span class="hook" v-if="cur.hook"><Icon name="bolt" :size="13" /> <code>{{ cur.hook }}</code></span>
      </div>
      <p v-html="fmt(cur.text)" />
    </div>

    <div class="controls">
      <button type="button" class="mpc-btn" @click="prev" :disabled="i === 0" aria-label="Previous step"><Icon name="prev" :size="15" /> Back</button>
      <button type="button" class="mpc-btn primary" @click="next" :disabled="i === frames.length - 1" aria-label="Next step">Next <Icon name="next" :size="15" /></button>
      <button type="button" class="mpc-btn" @click="play" :aria-pressed="playing"><Icon :name="playing ? 'pause' : 'play'" :size="15" /> {{ playing ? 'Pause' : 'Auto-play' }}</button>
      <button type="button" class="mpc-btn small" @click="reset"><Icon name="reset" :size="14" /> Restart</button>
      <div class="dots" aria-hidden="true"><span v-for="(_, k) in frames" :key="k" :class="{ on: k <= i }" /></div>
    </div>
  </section>
</template>

<style scoped>
.lv { background: var(--vp-c-bg-soft); padding: 16px; container-type: inline-size; }
.topbar { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: center; }
.opts { margin-top: 10px; }
.sw { display: inline-flex; gap: 8px; align-items: center; font-size: 14px; font-weight: 600; padding: 4px 10px; border: 2px dashed var(--mpc-ink); border-radius: 10px; background: var(--mpc-paper); cursor: pointer; }
.sw input { width: 16px; height: 16px; accent-color: var(--mpc-violet); }
.stage { display: grid; grid-template-columns: 1.25fr 1fr; gap: 14px; margin-top: 12px; border-radius: 12px; }
.stage:focus-visible { outline: 3px solid var(--mpc-sky); outline-offset: 4px; }
.diagram { width: 100%; height: auto; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 14px; }
.edge { stroke-width: 2.2; opacity: 0.55; transition: stroke 0.3s, opacity 0.3s; }
.edge.hot { stroke: var(--mpc-violet); stroke-width: 4; opacity: 1; }
.node .box { transition: stroke-width 0.2s; }
.node.active .box { stroke: var(--mpc-violet); stroke-width: 4.5; }
.node.active text.t-strong { fill: var(--mpc-violet); }
.token { transition: transform 0.55s cubic-bezier(0.5, 0, 0.2, 1); }
.ctr { display: flex; justify-content: center; }
.panels { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.panel { background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 8px 10px; }
.ph :deep(code), .ph code { text-transform: none; }
.ph { font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.dim { font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--vp-c-text-3); font-size: 12px; }
.msgs { list-style: none; padding: 0 !important; margin: 0 !important; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.msgs li { margin: 0 !important; display: flex; gap: 8px; font-size: 13px !important; line-height: 1.4 !important; padding: 4px 6px; border-radius: 8px; transition: background 0.4s; }
.msgs li.fresh { background: var(--mpc-amber-soft); box-shadow: inset 3px 0 0 var(--mpc-amber); }
.role { flex: none; width: 74px; white-space: nowrap; font-family: var(--mpc-mono); font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 6px; text-align: center; height: fit-content; }
.system .role { background: var(--mpc-sky-soft); }
.user .role { background: var(--mpc-violet-soft); }
.assistant .role { background: var(--mpc-amber-soft); }
.tool .role { background: var(--mpc-teal-soft); }
.mt { font-family: var(--mpc-mono); font-size: 12px; word-break: break-word; }
.chunks { display: flex; flex-wrap: wrap; gap: 4px; }
.ck { font-family: var(--mpc-mono); font-size: 11.5px; padding: 2px 7px; border-radius: 99px; border: 1.5px solid var(--vp-c-divider); }
.ck.fresh { border-color: var(--mpc-violet); background: var(--mpc-violet-soft); font-weight: 700; }
.seats { display: flex; align-items: center; gap: 12px; }
.seats strong { font-size: 34px; line-height: 1; padding: 4px 12px; border-radius: 10px; background: var(--mpc-teal-soft); border: 2px solid var(--mpc-ink); }
.seats.bad strong { background: var(--mpc-coral-soft); }
.lanes { display: flex; flex-direction: column; gap: 3px; }
.lane { font-family: var(--mpc-mono); font-size: 12px; }
.narr { margin-top: 12px; background: var(--mpc-paper); border: 2px solid var(--mpc-ink); border-left-width: 8px; border-left-color: var(--mpc-violet); border-radius: 12px; padding: 10px 14px; min-height: 92px; }
.narr.warn { border-left-color: var(--mpc-coral); background: var(--mpc-coral-soft); }
.narr.win { border-left-color: var(--mpc-teal); background: var(--mpc-teal-soft); }
.nh { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.hook { font-size: 13px; display: inline-flex; gap: 4px; align-items: center; }
.narr p { margin: 6px 0 0 !important; font-size: 16px !important; line-height: 1.6 !important; }
.controls { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
.dots { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; }
.dots span { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--mpc-ink); }
.dots span.on { background: var(--mpc-violet); }
@container (max-width: 820px) {
  .stage { grid-template-columns: 1fr; }
  .panels { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
}
@container (max-width: 540px) {
  .panels { grid-template-columns: 1fr; }
  .dots { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .token, .edge, .msgs li { transition: none; }
}
</style>
