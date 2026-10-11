<script setup lang="ts">
import { ref, computed } from 'vue';
import { fmt } from '../../progress';

/**
 * Module 8: four ways agents work together, compared by what they share.
 * Pick a mechanism; see what crosses between the agents and how each dimension behaves.
 */
type Key = 'sub' | 'net' | 'wf' | 'sig';
type Cell = { v: 'shared' | 'separate' | 'mixed'; text: string };
const mechs: { key: Key; name: string; code: string; across: [string, string]; color: string }[] = [
  { key: 'sub', name: 'Sub-agent as a tool', code: 'agents: { researcher }', across: ['prompt the parent\'s model writes', 'answer, as one tool result'], color: 'sky' },
  { key: 'net', name: 'Agent network', code: 'agent.network(task)', across: ['the router\'s prompt for this turn', 'result; router picks again'], color: 'violet' },
  { key: 'wf', name: 'Workflow with agent steps', code: 'createStepFromAgent(a)', across: ['typed inputData', 'typed output to the next step'], color: 'teal' },
  { key: 'sig', name: 'Signals between threads', code: 'peer.sendSignal(s, { threadId })', across: ['one message (a signal)', 'nothing, unless it signals back'], color: 'coral' },
];
const dims: { key: string; label: string; cells: Record<Key, Cell> }[] = [
  { key: 'transcript', label: 'Transcript', cells: {
    sub: { v: 'separate', text: 'The helper sees the prompt it was given, not the parent\'s conversation.' },
    net: { v: 'mixed', text: 'The routing agent keeps the task and each result; specialists get the router\'s prompt.' },
    wf: { v: 'separate', text: 'None. Data flows between steps through schemas.' },
    sig: { v: 'separate', text: 'Separate threads. Only the message crosses.' } } },
  { key: 'run', label: 'Run', cells: {
    sub: { v: 'shared', text: 'Nested inside the parent\'s tool call. **The parent waits.**' },
    net: { v: 'shared', text: 'One network run: a loop of routing iterations.' },
    wf: { v: 'shared', text: 'One workflow run. Each agent is a step.' },
    sig: { v: 'separate', text: 'Separate runs. **The sender doesn\'t wait.**' } } },
  { key: 'budget', label: 'Step budget', cells: {
    sub: { v: 'separate', text: 'Its own `maxSteps`. Its steps don\'t count in the parent\'s budget, but its latency does.' },
    net: { v: 'shared', text: 'The network\'s iteration limit bounds the whole thing.' },
    wf: { v: 'separate', text: 'Per agent step. The graph itself is fixed.' },
    sig: { v: 'separate', text: 'Each agent has its own. Two agents can still wake each other forever (Exercise 8.1).' } } },
  { key: 'failure', label: 'Failure', cells: {
    sub: { v: 'shared', text: 'Comes back as a tool error. The parent\'s model decides what to do.' },
    net: { v: 'shared', text: 'The router sees the result and can route somewhere else.' },
    wf: { v: 'shared', text: 'Step retries, then the run fails. Visible in the snapshot.' },
    sig: { v: 'separate', text: 'The sender never finds out. Fire-and-forget.' } } },
  { key: 'crash', label: 'Crash', cells: {
    sub: { v: 'shared', text: 'Opaque: the whole delegation re-runs as one in-flight tool call (Module 7).' },
    net: { v: 'shared', text: 'Like the agent loop: the in-flight iteration re-runs.' },
    wf: { v: 'mixed', text: 'Finished agent steps are memoized; the in-flight one re-runs.' },
    sig: { v: 'mixed', text: 'In-memory queues lose undelivered signals; persisted ones live in the thread.' } } },
];
const sel = ref<Key>('sub');
const m = computed(() => mechs.find((x) => x.key === sel.value)!);
const focus = ref<string | null>(null);
const label = { shared: 'shared', separate: 'separate', mixed: 'partly' } as const;
</script>

<template>
  <section class="sc mpc-card" aria-label="What each multi-agent mechanism shares">
    <div class="mpc-kicker"><Icon name="cards" :size="14" /> Interactive: what's shared?</div>
    <div class="mpc-toggle-group" role="radiogroup" aria-label="Mechanism">
      <button v-for="x in mechs" :key="x.key" type="button" role="radio" class="mpc-toggle" :aria-checked="sel === x.key" @click="sel = x.key">{{ x.name }}</button>
    </div>

    <svg class="ill scene" viewBox="0 0 640 150" role="img" :aria-label="`${m.name}: ${m.across[0]} goes to the helper; ${m.across[1]} comes back.`">
      <ArrowDefs />
      <rect x="23" y="23" width="170" height="104" rx="16" class="shadow" />
      <rect x="20" y="20" width="170" height="104" rx="16" class="f-paper outline" />
      <text x="105" y="62" text-anchor="middle" font-size="16" class="t-strong">{{ sel === 'sig' ? 'agent A' : sel === 'wf' ? 'step 1' : 'parent' }}</text>
      <text x="105" y="86" text-anchor="middle" font-size="12" class="t-dim">{{ sel === 'sig' ? 'its own thread + run' : sel === 'wf' ? 'workflow run' : 'one run' }}</text>
      <rect x="453" y="23" width="170" height="104" rx="16" class="shadow" />
      <rect x="450" y="20" width="170" height="104" rx="16" :class="`f-${m.color} outline`" />
      <text x="535" y="62" text-anchor="middle" font-size="16" class="t-strong">{{ sel === 'sig' ? 'agent B' : sel === 'wf' ? 'agent step' : 'helper' }}</text>
      <text x="535" y="86" text-anchor="middle" font-size="12" class="t-dim">{{ sel === 'sig' ? 'its own thread + run' : sel === 'wf' ? 'snapshot after it' : 'inside the parent\'s run' }}</text>
      <rect v-if="sel === 'sub' || sel === 'net'" x="8" y="8" width="624" height="134" rx="22" fill="none" class="stroke" stroke-dasharray="7 6" />
      <text v-if="sel === 'sub' || sel === 'net'" x="320" y="136" text-anchor="middle" font-size="11.5" class="t-dim">one run, the parent waits</text>
      <Arrow d="M196 54 L444 54" :color="m.color === 'sky' ? undefined : m.color" />
      <text x="320" y="44" text-anchor="middle" font-size="12.5" class="t-strong">{{ m.across[0] }}</text>
      <Arrow v-if="sel !== 'sig'" d="M444 94 L196 94" />
      <path v-else d="M444 94 L196 94" class="stroke" stroke-dasharray="3 7" opacity="0.5" />
      <text x="320" y="114" text-anchor="middle" font-size="12.5" class="t-dim">{{ m.across[1] }}</text>
    </svg>
    <p class="code"><code>{{ m.code }}</code></p>

    <div class="grid">
      <button v-for="d in dims" :key="d.key" type="button" class="dim" :class="[d.cells[sel].v, { on: focus === d.key }]" :aria-pressed="focus === d.key" @click="focus = focus === d.key ? null : d.key">
        <span class="dl">{{ d.label }}</span>
        <span class="badge">{{ label[d.cells[sel].v] }}</span>
        <span class="dt" v-html="fmt(d.cells[sel].text)" />
      </button>
    </div>
    <div v-if="focus" class="row" aria-live="polite">
      <div class="mpc-kicker">{{ dims.find((d) => d.key === focus)!.label }}, across all four</div>
      <ul>
        <li v-for="x in mechs" :key="x.key" :class="{ me: x.key === sel }"><b>{{ x.name }}</b> <span class="badge" :class="dims.find((d) => d.key === focus)!.cells[x.key].v">{{ label[dims.find((d) => d.key === focus)!.cells[x.key].v] }}</span> <span v-html="fmt(dims.find((d) => d.key === focus)!.cells[x.key].text)" /></li>
      </ul>
    </div>
    <p v-else class="hint">Tap a card to compare that row across all four mechanisms.</p>
  </section>
</template>

<style scoped>
.sc { display: grid; gap: 12px; }
.scene { width: 100%; height: auto; max-width: 640px; margin: 4px auto 0; display: block; }
.code { margin: -6px 0 0; text-align: center; font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 10px; }
.dim { text-align: left; display: grid; gap: 6px; align-content: start; border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px; background: var(--mpc-paper); color: var(--mpc-ink); font: inherit; font-size: 13.5px; line-height: 1.45; cursor: pointer; box-shadow: 2px 2px 0 var(--mpc-shadow); }
.dim.on { outline: 3px solid var(--mpc-violet); outline-offset: 1px; }
.dim:focus-visible { outline: 3px solid var(--mpc-sky); }
.dl { font-weight: 800; font-size: 14px; }
.badge { justify-self: start; display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 2px solid var(--mpc-ink); border-radius: 999px; padding: 0 8px; }
.shared .badge, .badge.shared { background: var(--mpc-violet-soft); }
.separate .badge, .badge.separate { background: var(--mpc-teal-soft); }
.mixed .badge, .badge.mixed { background: var(--mpc-amber-soft); }
.row { border: 2px solid var(--mpc-ink); border-radius: 12px; padding: 10px 12px; background: var(--vp-c-bg-soft); }
.row ul { margin: 6px 0 0; padding-left: 18px; font-size: 13.5px; }
.row li { margin: 4px 0; }
.row li.me { font-weight: 600; }
.hint { margin: 0; font-size: 13px; color: var(--mpc-ink-2); }
</style>
