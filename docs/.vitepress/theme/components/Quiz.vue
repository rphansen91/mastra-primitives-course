<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fmt, mark, loadProgress, progress, registerCheck } from '../progress';

type Opt = { text: string; correct?: boolean; why?: string };
const props = withDefaults(
  defineProps<{ module: string; id: string; question: string; options: Opt[]; kind?: 'mc' | 'predict'; explain?: string }>(),
  { kind: 'mc' },
);
registerCheck(props.module, props.id);
onMounted(loadProgress);

const tried = ref<number[]>([]);
const solved = ref(false);
const last = ref<number | null>(null);
const passedBefore = computed(() => !!progress.done[`${props.module}:check:${props.id}`]);

function pick(i: number) {
  if (solved.value) return;
  last.value = i;
  if (!tried.value.includes(i)) tried.value.push(i);
  if (props.options[i].correct) {
    solved.value = true;
    mark(`${props.module}:check:${props.id}`);
  }
}
function reset() {
  tried.value = [];
  solved.value = false;
  last.value = null;
}
const state = (i: number) => (!tried.value.includes(i) ? '' : props.options[i].correct ? 'right' : 'wrong');
const lastOpt = computed(() => (last.value === null ? null : props.options[last.value]));
</script>

<template>
  <section class="quiz mpc-card" :class="kind" :aria-label="kind === 'predict' ? 'Predict the output' : 'Knowledge check'">
    <div class="head">
      <span class="mpc-kicker"><Icon :name="kind === 'predict' ? 'eye' : 'bulb'" :size="15" /> {{ kind === 'predict' ? 'Predict the output' : 'Quick check' }}</span>
      <span v-if="passedBefore && !solved" class="mpc-chip prev">passed before</span>
    </div>
    <p class="q" v-html="fmt(question)" />
    <div v-if="$slots.default" class="code"><slot /></div>
    <ul class="opts" role="list">
      <li v-for="(o, i) in options" :key="i">
        <button type="button" class="opt mpc-focus" :class="state(i)" :disabled="solved && !o.correct"
          :aria-pressed="tried.includes(i)" @click="pick(i)">
          <span class="letter" aria-hidden="true">{{ 'ABCDEFG'[i] }}</span>
          <span class="txt" v-html="fmt(o.text)" />
          <span class="mark" v-if="state(i)" aria-hidden="true"><Icon :name="state(i) === 'right' ? 'check' : 'x'" :size="16" /></span>
          <span class="mpc-sr" v-if="state(i)">{{ state(i) === 'right' ? '(correct)' : '(incorrect)' }}</span>
        </button>
      </li>
    </ul>
    <div class="fb" aria-live="polite">
      <div v-if="lastOpt" class="fbcard" :class="lastOpt.correct ? 'right' : 'wrong'">
        <Mascot :mood="lastOpt.correct ? 'cheer' : 'thinking'" :size="54" />
        <div>
          <strong>{{ lastOpt.correct ? (tried.length === 1 ? 'Nailed it.' : 'Got there!') : 'Not quite.' }}</strong>
          <span v-if="lastOpt.why" v-html="' ' + fmt(lastOpt.why)" />
          <span v-if="!lastOpt.correct"> Try another option.</span>
          <p v-if="lastOpt.correct && explain" class="explain" v-html="fmt(explain)" />
        </div>
      </div>
    </div>
    <button v-if="tried.length" type="button" class="mpc-btn small again" @click="reset"><Icon name="reset" :size="14" /> Reset</button>
  </section>
</template>

<style scoped>
.quiz { background: var(--mpc-violet-soft); }
.quiz.predict { background: var(--mpc-sky-soft); }
.head { display: flex; justify-content: space-between; align-items: center; }
.prev { color: var(--mpc-teal); }
.q { font-size: 17.5px !important; font-weight: 700; margin: 8px 0 12px !important; line-height: 1.5 !important; }
.code :deep(div[class*='language-']) { margin: 8px 0 14px !important; }
.opts { list-style: none; padding: 0 !important; margin: 0 !important; display: grid; gap: 8px; }
.opts li { margin: 0 !important; }
.opt { width: 100%; text-align: left; display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 12px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); color: var(--vp-c-text-1); font-size: 15.5px; line-height: 1.45; cursor: pointer; transition: transform 0.1s; }
.opt:hover:not(:disabled) { transform: translateX(3px); }
.opt:disabled { opacity: 0.55; cursor: default; }
.opt.right { background: var(--mpc-teal-soft); border-color: var(--mpc-teal); box-shadow: 0 0 0 2px var(--mpc-teal); }
.opt.wrong { background: var(--mpc-coral-soft); border-color: var(--mpc-coral); }
.letter { width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--mpc-ink); display: grid; place-items: center; font-weight: 800; font-size: 13px; flex: none; }
.right .letter { background: var(--mpc-teal); color: #fff; }
.wrong .letter { background: var(--mpc-coral); color: #fff; }
.txt { flex: 1; }
.mark { flex: none; }
.right .mark { color: var(--mpc-teal); }
.wrong .mark { color: var(--mpc-coral); }
.fbcard { display: flex; gap: 12px; align-items: flex-start; margin-top: 14px; padding: 12px 14px; border-radius: 12px; border: 2px solid var(--mpc-ink); background: var(--mpc-paper); font-size: 15.5px; line-height: 1.55; }
.fbcard.right { border-color: var(--mpc-teal); }
.fbcard.wrong { border-color: var(--mpc-coral); }
.explain { margin: 6px 0 0 !important; font-size: 15px !important; color: var(--vp-c-text-2); }
.again { margin-top: 12px; }
@media (prefers-reduced-motion: reduce) { .opt { transition: none; } }
</style>
