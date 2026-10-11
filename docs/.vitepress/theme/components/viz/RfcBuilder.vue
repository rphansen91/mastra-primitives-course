<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { fmt } from '../../progress';
import { PRIMITIVES, PLACEMENTS, MISFIT, HOUSE_RULES, FAILURES, type Placement } from '../../primitives';

/**
 * Module 10: build an RFC skeleton. Pick a primitive, place it, check it against the house rules
 * and the failure modes, then copy or download the markdown. Nothing is stored or sent anywhere.
 */
const pid = ref('wait');
const P = computed(() => PRIMITIVES.find((x) => x.id === pid.value)!);
const place = ref<Placement | null>(null);
const rules = reactive<Record<string, boolean>>({});
const fails = reactive<Record<string, boolean>>({});
const notes = reactive<Record<string, string>>({});
watch(pid, () => { place.value = null; for (const k of Object.keys(rules)) delete rules[k]; for (const k of Object.keys(fails)) delete fails[k]; for (const k of Object.keys(notes)) delete notes[k]; });

const fit = computed(() => {
  if (!place.value) return null;
  if (place.value === P.value.best) return { kind: 'good', text: '**Good fit.** ' + P.value.bestWhy };
  if (P.value.ok.includes(place.value)) return { kind: 'ok', text: '**Workable,** but not the smallest surface. The suggested home: ' + PLACEMENTS.find((x) => x.key === P.value.best)!.label + '. ' + P.value.bestWhy };
  return { kind: 'bad', text: '**Hmm.** ' + MISFIT[place.value] };
});
const ruleWarn = (id: string) => place.value === 'core' && (id === 'r1' || id === 'r8');
const doneRules = computed(() => HOUSE_RULES.filter((r) => rules[r.id]).length);
const doneFails = computed(() => FAILURES.filter((f) => fails[f.id]).length);
const score = computed(() => {
  let s = 0;
  if (place.value) s += fit.value!.kind === 'good' ? 2 : fit.value!.kind === 'ok' ? 1 : 0;
  s += doneRules.value * 0.5 + doneFails.value;
  return Math.round((s / (2 + HOUSE_RULES.length * 0.5 + FAILURES.length)) * 100);
});

const md = computed(() => {
  const p = P.value;
  const pl = place.value ? PLACEMENTS.find((x) => x.key === place.value)!.label : 'TODO: choose';
  const L: string[] = [];
  L.push(`# RFC NNNN: ${p.name}`, '', '- Author:', '- Status: draft', '- Pinned Mastra commit: ebe143c4916cf20b671a84f942d65d5df469f6cd (@mastra/core 1.75.0)', `- Implementation: labs/m10-${p.id}/`, '');
  L.push('## 1. Summary', '', `TODO: one paragraph. What is ${p.name.toLowerCase()}, and what does a user write?`, '', '```ts', p.api, '```', '');
  L.push('## 2. Problem', '', `- Gap (Module ${p.module}): ${p.gap}`, `- Proof: ${p.proof}`, '- Break-it test: TODO (link it, paste its failing output)', '- Cost: TODO (duplicate charges? lost messages? stuck runs?)', '');
  L.push('## 3. Prior art', '', '| System | API | Guarantee | Borrow / reject |', '|---|---|---|---|');
  for (const r of p.prior) L.push(`| ${r[0]} | \`${r[1]}\` | ${r[2]} | TODO |`);
  L.push('', '## 4. Design', '', `- Where it lives: **${pl}**`, '- User-facing API: (see Summary)', '- Why not core: TODO', '');
  L.push('## 5. House rules', '', '| Rule | Addressed? | How |', '|---|---|---|');
  for (const r of HOUSE_RULES) L.push(`| ${r.rule} | ${rules[r.id] ? 'yes' : 'TODO'} | ${(notes[r.id] || r.ask).replace(/\|/g, '/')} |`);
  L.push('', '## 6. Failure modes', '');
  for (const f of FAILURES) L.push(`- [${fails[f.id] ? 'x' : ' '}] **${f.label}:** ${notes[f.id] || f.ask}`);
  for (const h of p.hard) L.push(`- [ ] ${h}`);
  L.push('', '## 7. Tests', '', '- Break-it test fails on stock Mastra, passes with the primitive', '- Deterministic, mock model, no API keys', '- Runs under @mastra/core 1.75.0 and the next release', '');
  L.push('## 8. Alternatives considered', '', 'TODO', '');
  return L.join('\n');
});
const copied = ref(false);
async function copy() {
  try { await navigator.clipboard.writeText(md.value); copied.value = true; setTimeout(() => (copied.value = false), 1500); } catch { copied.value = false; }
}
function download() {
  const url = URL.createObjectURL(new Blob([md.value], { type: 'text/markdown' }));
  const a = document.createElement('a'); a.href = url; a.download = `rfc-${P.value.id}.md`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const showMd = ref(false);
</script>

<template>
  <section class="rb mpc-card" aria-label="RFC builder">
    <div class="mpc-kicker"><Icon name="wrench" :size="14" /> Interactive: the RFC builder</div>
    <div class="meter" role="progressbar" :aria-valuenow="score" aria-valuemin="0" aria-valuemax="100" aria-label="RFC readiness"><span :style="{ width: score + '%' }" /><b>{{ score }}% ready</b></div>

    <div class="step">
      <div class="sn">1</div>
      <div class="sb">
        <strong>Pick the primitive</strong>
        <div class="mpc-toggle-group" role="radiogroup" aria-label="Primitive">
          <button v-for="x in PRIMITIVES" :key="x.id" type="button" role="radio" class="mpc-toggle" :aria-checked="pid === x.id" @click="pid = x.id">{{ x.name }}</button>
        </div>
        <p class="gap" v-html="fmt(P.gap)" />
      </div>
    </div>

    <div class="step">
      <div class="sn">2</div>
      <div class="sb">
        <strong>Where does it live?</strong>
        <div class="places">
          <button v-for="x in PLACEMENTS" :key="x.key" type="button" class="place" :aria-pressed="place === x.key" :class="{ on: place === x.key }" @click="place = x.key">
            <b>{{ x.label }}</b><span>{{ x.hint }}</span>
          </button>
        </div>
        <p v-if="fit" class="fit" :class="fit.kind" aria-live="polite" v-html="fmt(fit.text)" />
      </div>
    </div>

    <div class="step">
      <div class="sn">3</div>
      <div class="sb">
        <strong>House rules ({{ doneRules }}/{{ HOUSE_RULES.length }})</strong>
        <div class="checks">
          <label v-for="r in HOUSE_RULES" :key="r.id" class="chk" :class="{ warn: ruleWarn(r.id) }">
            <input v-model="rules[r.id]" type="checkbox" />
            <span><b>{{ r.rule }}</b> <em>{{ r.ask }}</em><span v-if="ruleWarn(r.id)" class="w"> ⚠ you chose a core change: justify it here</span></span>
          </label>
        </div>
      </div>
    </div>

    <div class="step">
      <div class="sn">4</div>
      <div class="sb">
        <strong>Failure modes ({{ doneFails }}/{{ FAILURES.length }})</strong>
        <div class="checks">
          <label v-for="f in FAILURES" :key="f.id" class="chk">
            <input v-model="fails[f.id]" type="checkbox" />
            <span><b>{{ f.label }}</b> <em>{{ f.ask }}</em></span>
          </label>
        </div>
        <label class="note"><span>Your answer for <b>crash windows</b> (goes into the RFC):</span>
          <textarea v-model="notes.crash" rows="2" :placeholder="P.hard[0]" />
        </label>
      </div>
    </div>

    <div class="step">
      <div class="sn">5</div>
      <div class="sb">
        <strong>Your RFC skeleton</strong>
        <div class="mpc-btn-row">
          <button type="button" class="mpc-btn primary" @click="showMd = !showMd"><Icon name="eye" :size="15" /> {{ showMd ? 'Hide' : 'Preview' }} markdown</button>
          <button type="button" class="mpc-btn" @click="copy"><Icon name="copy" :size="15" /> {{ copied ? 'Copied!' : 'Copy' }}</button>
          <button type="button" class="mpc-btn" @click="download"><Icon name="download" :size="15" /> Download .md</button>
        </div>
        <pre v-if="showMd" class="md"><code>{{ md }}</code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rb { display: grid; gap: 12px; }
.meter { position: relative; height: 26px; border: 2px solid var(--mpc-ink); border-radius: 999px; background: var(--vp-c-bg-soft); overflow: hidden; }
.meter span { position: absolute; inset: 0 auto 0 0; background: var(--mpc-lime-soft); border-right: 2px solid var(--mpc-ink); transition: width 0.3s; }
.meter b { position: relative; display: block; text-align: center; font-size: 13px; line-height: 22px; }
.step { display: flex; gap: 10px; min-width: 0; }
.sn { flex: none; width: 30px; height: 30px; border: 2px solid var(--mpc-ink); border-radius: 50%; display: grid; place-items: center; font-weight: 800; background: var(--mpc-violet-soft); }
.sb { flex: 1; min-width: 0; display: grid; gap: 8px; }
.gap { margin: 0; font-size: 13.5px; color: var(--mpc-ink-2); }
.places { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px; }
.place { display: grid; gap: 2px; text-align: left; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 6px 9px; background: var(--mpc-paper); color: var(--mpc-ink); font: inherit; cursor: pointer; }
.place span { font-size: 12px; color: var(--mpc-ink-2); }
.place.on { background: var(--mpc-ink); color: var(--mpc-paper); }
.place.on span { color: var(--mpc-paper); opacity: 0.8; }
.fit { margin: 0; border: 2px solid var(--mpc-ink); border-radius: 10px; padding: 8px 10px; font-size: 13.5px; }
.fit.good { background: var(--mpc-teal-soft); } .fit.ok { background: var(--mpc-amber-soft); } .fit.bad { background: var(--mpc-coral-soft); }
.checks { display: grid; gap: 4px; }
.chk { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; padding: 3px 6px; border-radius: 8px; }
.chk input { margin-top: 4px; accent-color: var(--mpc-violet); }
.chk em { color: var(--mpc-ink-2); font-style: normal; }
.chk.warn { background: var(--mpc-amber-soft); }
.w { color: var(--mpc-coral); font-weight: 700; }
.note { display: grid; gap: 4px; font-size: 13px; }
.note textarea { width: 100%; box-sizing: border-box; border: 2px solid var(--mpc-ink); border-radius: 8px; padding: 6px 8px; font: inherit; font-size: 13.5px; background: var(--mpc-paper); color: var(--mpc-ink); }
.md { max-height: 360px; overflow: auto; margin: 0 !important; padding: 10px !important; border: 2px solid var(--mpc-ink); border-radius: 10px; background: var(--vp-c-bg-soft) !important; white-space: pre-wrap; }
.md code { font-size: 12px !important; background: none !important; padding: 0 !important; white-space: pre-wrap !important; overflow-wrap: anywhere; }
</style>
