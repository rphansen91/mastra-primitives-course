<script setup lang="ts">
import { computed } from 'vue';
import { fmt } from '../../progress';
/**
 * Sequence diagram as lanes: one thin column per participant with a lifeline, one row per
 * message, arrows drawn in SVG with percentage coordinates so the lanes scale to any width
 * while text stays real size. Labels sit to the right (desktop) or under the arrows (narrow).
 */
type Msg = { from: string; to: string; label: string; reply?: boolean; tone?: 'danger' | 'tip' };
type Note = { note: string; over: string };
type Loop = { loop: string; rows: (Msg | Note)[] };
type Row = Msg | Note | Loop;
const props = withDefaults(defineProps<{ label: string; participants: { id: string; short: string; name: string }[]; rows: Row[]; numbered?: boolean; caption?: string }>(), { numbered: true });
const idx = (id: string) => props.participants.findIndex((p) => p.id === id);
const X = (i: number) => `${((i + 0.5) / props.participants.length) * 100}%`;
type Flat = (Msg & { kind: 'msg'; n: number; inLoop: boolean; first?: string; last?: boolean }) | (Note & { kind: 'note'; inLoop: boolean; first?: string; last?: boolean });
const flat = computed(() => {
  const out: Flat[] = []; let n = 0;
  const push = (r: Msg | Note, inLoop: boolean) => out.push('note' in r ? { ...r, kind: 'note', inLoop } : { ...r, kind: 'msg', n: ++n, inLoop });
  for (const r of props.rows) {
    if ('loop' in r) { const start = out.length; r.rows.forEach((x) => push(x, true)); out[start].first = r.loop; out[out.length - 1].last = true; }
    else push(r, false);
  }
  return out;
});
const pname = (id: string) => props.participants[idx(id)];
</script>
<template>
  <figure class="mpc-diagram seq" role="group" :aria-label="label">
    <div class="seq-legend">
      <span v-for="p in participants" :key="p.id" class="pl"><b>{{ p.short }}</b> {{ p.name }}</span>
    </div>
    <div class="seq-grid" :style="{ '--lanes': participants.length }">
      <div class="seq-row head">
        <div class="lanes"><span v-for="(p, i) in participants" :key="p.id" class="ph" :style="{ left: X(i) }">{{ p.short }}</span></div>
        <div class="lbl" />
      </div>
      <template v-for="(r, k) in flat" :key="k">
        <div v-if="r.first" class="seq-row loophead" ><div class="lanes"><svg class="ll" aria-hidden="true"><line v-for="(p, i) in participants" :key="i" :x1="X(i)" :x2="X(i)" y1="0" y2="100%" /></svg></div><div class="lbl"><span class="loopname">loop · {{ r.first }}</span></div></div>
        <div class="seq-row" :class="{ inloop: r.inLoop, last: r.last, note: r.kind === 'note', [`t-${(r as any).tone || 'plain'}`]: true }">
          <div class="lanes">
            <svg class="ll" aria-hidden="true">
              <line v-for="(p, i) in participants" :key="i" :x1="X(i)" :x2="X(i)" y1="0" y2="100%" />
              <template v-if="r.kind === 'msg'">
                <template v-if="r.from === r.to">
                  <circle :cx="X(idx(r.from))" cy="50%" r="7" class="self" />
                </template>
                <line v-else :x1="X(idx(r.from))" :x2="X(idx(r.to))" y1="50%" y2="50%" class="arrow" :class="{ reply: r.reply }" :marker-end="`url(#seq-head-${r.tone || 'plain'})`" />
                <circle :cx="X(idx(r.from))" cy="50%" r="3" class="dot" />
              </template>
              <template v-else>
                <line :x1="X(idx(r.over))" :x2="X(idx(r.over))" y1="12%" y2="88%" class="notebar" />
              </template>
            </svg>
          </div>
          <div class="lbl">
            <template v-if="r.kind === 'msg'">
              <span v-if="numbered" class="n">{{ r.n }}</span>
              <span class="fromto">{{ pname(r.from).short }}<template v-if="r.from !== r.to"> → {{ pname(r.to).short }}</template></span>
              <span class="txt" v-html="fmt(r.label)" />
            </template>
            <template v-else><span class="notetag">note · {{ pname(r.over).short }}</span><span class="txt" v-html="fmt(r.note)" /></template>
          </div>
        </div>
      </template>
    </div>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <marker v-for="t in ['plain', 'danger', 'tip']" :id="`seq-head-${t}`" :key="t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L10 5 L0 9 z" :class="`dg-head ${t === 'plain' ? '' : t}`" /></marker>
      </defs>
    </svg>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
