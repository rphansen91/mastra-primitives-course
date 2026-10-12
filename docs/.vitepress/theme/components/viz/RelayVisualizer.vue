<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { fmt, prefersReducedMotion } from '../../progress';

/**
 * Module 8: the always-on coordinator, one step at a time (mirrors labs/m08-multi-agent),
 * plus the ping-pong failure mode with and without a hop guard (Exercise 8.1).
 */
const mode = ref<'relay' | 'pong'>('relay');

type Node = 'ops' | 'coord' | 'worker' | 'dir';
type Stage = { title: string; body: string; code: string; edge?: [Node, Node]; coord: string; worker: string; log: string };
const stages: Stage[] = [
  { title: 'Claim and advertise', body: 'The worker claims its thread (a lease) and advertises itself as a peer with a label. Then it starts a long run that sits in `run_tests`.', code: "await worker.claimThreadOwnership({ resourceId, threadId: 'worker-auth-refactor',\n  peer: { label: 'api (auth refactor)' } });", edge: ['worker', 'dir'], coord: 'idle', worker: 'running · run_tests', log: 'worker claim: true' },
  { title: 'Discover peers', body: 'The coordinator asks the PubSub directory who\'s out there. Live owners answer (request/reply).', code: 'const peers = await coordinator.discoverThreadPeers({ resourceId });', edge: ['coord', 'dir'], coord: 'idle', worker: 'running · run_tests', log: "peers: [{ agentId: 'worker', threadId: 'worker-auth-refactor', label: 'api (auth refactor)' }]" },
  { title: 'A notice wakes the coordinator', body: 'Ops sends "CI is rate limited" as a notification. The coordinator\'s thread is **idle**, so the policy says `wake`: a new run starts with the notice.', code: "coordinator.sendNotificationSignal({ source: 'ops', priority: 'high',\n  text: 'CI is rate limited: max 1 push per 10 min' }, { resourceId, threadId: 'coord' });", edge: ['ops', 'coord'], coord: 'woken · thinking', worker: 'running · run_tests', log: 'coordinator accepted: wake' },
  { title: 'Relay tool → sendSignal', body: 'The coordinator\'s model calls `relay_to_agent`. Its `execute` signals the worker\'s thread. The worker is **running**, so the signal is delivered into the live run.', code: "execute: async ({ threadId, text }) =>\n  ({ routed: (await worker.sendSignal({ type: 'user-message', contents: text },\n    { resourceId, threadId })).accepted })", edge: ['coord', 'worker'], coord: 'tool: relay_to_agent', worker: 'running · signal queued', log: "relay tool result: { routed: 'deliver' }" },
  { title: 'Next safe point', body: 'The worker doesn\'t get interrupted mid-tool. When `run_tests` returns, its **next model request** includes the relayed notice, and it adjusts.', code: '// worker\'s next request: [..., tool-result run_tests, user: "CI is rate limited…"]', coord: 'done', worker: 'adapting', log: 'worker final text: Got it from the coordinator: batching pushes, max 1 per 10 min.' },
];
const i = ref(0);
const s = computed(() => stages[i.value]!);
const on = (a: Node, b: Node) => !!s.value.edge && ((s.value.edge[0] === a && s.value.edge[1] === b) || (s.value.edge[0] === b && s.value.edge[1] === a));
const logs = computed(() => stages.slice(0, i.value + 1).map((x) => x.log));

// ping-pong
const guard = ref(true);
const MAX_HOPS = 3;
const CAP = 12;
const hops = ref<{ from: string; to: string; n: number; text: string }[]>([]);
const ended = ref<string>('');
const running = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(timer));
function resetPong() { clearTimeout(timer); hops.value = []; ended.value = ''; running.value = false; }
function runPong() {
  resetPong(); running.value = true;
  const delay = prefersReducedMotion() ? 0 : 260;
  const step = () => {
    const n = hops.value.length + 1;
    if (guard.value && n > MAX_HOPS) { ended.value = `${n % 2 ? 'alice' : 'bob'} ✋ stops at hop ${MAX_HOPS}: nextHop() returned null`; running.value = false; return; }
    if (!guard.value && n > CAP) { ended.value = `safety cap hit after ${CAP} relays. Without it, they would never stop (and each hop is a paid model call).`; running.value = false; return; }
    const from = n % 2 ? 'alice' : 'bob';
    hops.value.push({ from, to: from === 'alice' ? 'bob' : 'alice', n, text: n === 1 ? 'Heads up: CI is rate limited.' : 'Thanks, noted!' });
    if (delay) timer = setTimeout(step, delay); else step();
  };
  step();
}
const last = computed(() => hops.value[hops.value.length - 1]);
</script>

<template>
  <section class="rv mpc-card mpc-toy" aria-label="Coordinator relay and ping-pong simulator">
    <div class="mpc-kicker"><Icon name="mail" :size="14" /> Interactive: the coordinator relay</div>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="Mode">
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'relay'" @click="mode = 'relay'">Relay, step by step</button>
      <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'pong'" @click="mode = 'pong'">Two polite agents (ping-pong)</button>
    </div>

    <template v-if="mode === 'relay'">
      <svg class="ill map" viewBox="0 0 660 230" role="img" :aria-label="`Step ${i + 1} of ${stages.length}: ${s.title}. Coordinator: ${s.coord}. Worker: ${s.worker}.`">
        <ArrowDefs />
        <g :class="{ hot: on('ops', 'coord') }">
          <rect x="10" y="30" width="150" height="76" rx="14" class="f-amber outline" />
          <text x="85" y="62" text-anchor="middle" font-size="15" class="t-strong">ops source</text>
          <text x="85" y="84" text-anchor="middle" font-size="11.5" class="t-dim">CI, chat, calendar</text>
        </g>
        <path d="M162 68 L242 68" class="stroke edge" :class="{ hot: on('ops', 'coord') }" marker-end="url(#ill-arrow)" />
        <rect x="246" y="20" width="170" height="96" rx="14" class="f-violet outline" />
        <text x="331" y="52" text-anchor="middle" font-size="15" class="t-strong">coordinator</text>
        <text x="331" y="74" text-anchor="middle" font-size="11.5" class="t-dim">thread: coord</text>
        <rect x="254" y="84" width="154" height="22" rx="11" class="f-paper outline" stroke-width="1.5" />
        <text x="331" y="99.5" text-anchor="middle" font-size="10" class="t-mono">{{ s.coord }}</text>
        <path d="M418 68 L494 68" class="stroke edge" :class="{ hot: on('coord', 'worker') }" marker-end="url(#ill-arrow)" />
        <rect x="498" y="20" width="152" height="96" rx="14" class="f-teal outline" />
        <text x="574" y="52" text-anchor="middle" font-size="15" class="t-strong">worker</text>
        <text x="574" y="74" text-anchor="middle" font-size="11" class="t-dim">worker-auth-refactor</text>
        <rect x="503" y="84" width="142" height="22" rx="11" class="f-paper outline" stroke-width="1.5" />
        <text x="574" y="99.5" text-anchor="middle" font-size="9" class="t-mono">{{ s.worker }}</text>
        <ellipse cx="452" cy="178" rx="92" ry="14" class="f-sky outline" />
        <path d="M360 178 L360 206 A92 14 0 0 0 544 206 L544 178" class="f-sky outline" />
        <text x="452" y="204" text-anchor="middle" font-size="12.5" class="t-strong">PubSub peer directory</text>
        <path d="M340 120 L400 166" class="stroke edge" :class="{ hot: on('coord', 'dir') }" stroke-dasharray="5 5" marker-end="url(#ill-arrow)" />
        <path d="M560 120 L510 166" class="stroke edge" :class="{ hot: on('worker', 'dir') }" stroke-dasharray="5 5" marker-end="url(#ill-arrow)" />
        <circle v-if="i === 2" cx="202" cy="68" r="9" class="c-amber outline dot" />
        <circle v-if="i === 3" cx="456" cy="68" r="9" class="c-violet outline dot" />
      </svg>
      <div class="stage" aria-live="polite">
        <div class="num">{{ i + 1 }}/{{ stages.length }}</div>
        <div>
          <strong>{{ s.title }}</strong>
          <p v-html="fmt(s.body)" />
          <pre><code>{{ s.code }}</code></pre>
        </div>
      </div>
      <div class="mpc-btn-row">
        <button type="button" class="mpc-btn" :disabled="i === 0" @click="i--"><Icon name="prev" :size="15" /> Back</button>
        <button type="button" class="mpc-btn primary" :disabled="i === stages.length - 1" @click="i++">Next <Icon name="next" :size="15" /></button>
        <button type="button" class="mpc-btn small" @click="i = 0">Restart</button>
      </div>
      <div class="log"><div class="mpc-kicker">Lab output so far</div><div v-for="(l, k) in logs" :key="k" class="ll">{{ l }}</div></div>
    </template>

    <template v-else>
      <p class="intro">Alice and Bob each have a relay tool and a polite system prompt: "acknowledge every notice you get". What could go wrong?</p>
      <label class="sw"><input v-model="guard" type="checkbox" :disabled="running" /> hop guard in the tool: refuse to relay past <code>MAX_HOPS = {{ MAX_HOPS }}</code></label>
      <div class="pong">
        <div class="agent a" :class="{ act: last && last.from === 'alice' && running }">alice</div>
        <div class="wire">
          <div v-if="last" class="env" :class="last.from === 'alice' ? 'right' : 'left'" :key="last.n">✉ hops={{ last.n }}</div>
        </div>
        <div class="agent b" :class="{ act: last && last.from === 'bob' && running }">bob</div>
      </div>
      <div class="mpc-btn-row">
        <button type="button" class="mpc-btn primary" :disabled="running" @click="runPong"><Icon name="play" :size="15" /> Send the first notice</button>
        <button type="button" class="mpc-btn small" @click="resetPong">Reset</button>
      </div>
      <div class="log">
        <div class="mpc-kicker">Relays sent: {{ hops.length }}</div>
        <div v-for="h in hops" :key="h.n" class="ll">{{ h.from }} → {{ h.to }} (hops={{ h.n }}) "{{ h.text }}"</div>
        <div v-if="ended" class="ll end" :class="guard ? 'ok' : 'bad'">{{ ended }}</div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.rv { display: grid; gap: 12px; }
.map { width: 100%; height: auto; display: block; }
.edge { opacity: 0.35; transition: opacity 0.2s; }
.edge.hot { opacity: 1; stroke: var(--mpc-coral); stroke-width: 4; }
.dot { animation: pulse 1s ease-in-out infinite alternate; }
@keyframes pulse { from { opacity: 0.4; } to { opacity: 1; } }
.stage { display: flex; gap: 12px; border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); padding: 10px 12px; background: var(--mpc-paper); min-width: 0; }
.stage > div:last-child { min-width: 0; }
.stage p { margin: 4px 0 6px; font-size: var(--fs-sm); }
.num { flex: none; width: 40px; height: 40px; border: 1.5px solid var(--mpc-line-strong); border-radius: 50%; display: grid; place-items: center; font-weight: var(--fw-semibold); font-size: var(--fs-sm); background: var(--mpc-violet-soft); }
.stage pre { margin: 0 !important; padding: 8px !important; border-radius: var(--r-md); background: var(--vp-c-bg-soft) !important; white-space: pre-wrap; word-break: break-word; }
.stage pre code { font-size: var(--fs-xs); background: none !important; padding: 0 !important; white-space: pre-wrap !important; }
.log { border: 2px dashed var(--mpc-ink-2); border-radius: var(--r-md); padding: 8px 12px; font-family: var(--mpc-mono); font-size: var(--fs-xs); min-width: 0; }
.ll { margin: 3px 0; overflow-wrap: break-word; }
.ll.end { font-weight: var(--fw-semibold); font-family: var(--vp-font-family-base); font-size: var(--fs-sm); }
.ll.ok { color: var(--mpc-teal); } .ll.bad { color: var(--mpc-coral); }
.intro { margin: 0; font-size: var(--fs-sm); }
.sw { font-size: var(--fs-sm); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pong { display: grid; grid-template-columns: 90px 1fr 90px; align-items: center; gap: 8px; }
.agent { border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-lg); padding: 16px 0; text-align: center; font-weight: var(--fw-semibold); box-shadow: none; }
.agent.a { background: var(--mpc-sky-soft); } .agent.b { background: var(--mpc-lime-soft); }
.agent.act { outline: 3px solid var(--mpc-coral); }
.wire { position: relative; height: 40px; border-bottom: 3px dashed var(--mpc-ink-2); overflow: hidden; }
.env { position: absolute; top: 4px; font-size: var(--fs-xs); font-weight: var(--fw-semibold); background: var(--mpc-amber-soft); border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); padding: 1px 6px; white-space: nowrap; }
.env.right { animation: toRight 0.25s ease-out forwards; }
.env.left { animation: toLeft 0.25s ease-out forwards; }
@keyframes toRight { from { left: 0; } to { left: calc(100% - 90px); } }
@keyframes toLeft { from { left: calc(100% - 90px); } to { left: 0; } }
@media (prefers-reduced-motion: reduce) { .dot, .env { animation: none !important; } .env.right { left: calc(100% - 90px); } .env.left { left: 0; } }
</style>
