<script setup lang="ts">
import { ref, computed } from 'vue';

/**
 * Module 4: what actually reaches the model. A long conversation, a fixed context window, and
 * three memory features. The fact that matters ("I'm vegetarian") was said in message 1.
 */
const WINDOW = 4000;
const SYS = 260;
const WM = 110;
const NEW = 90;
const turns = ref(16); // number of exchanges so far (user + assistant = 2 messages each)
const last = ref<5 | 10 | 20 | 'tokens'>(10);
const MAXTOK = 2000;
const wm = ref(false);
const recall = ref(false);
const mode = ref<'ask' | 'wake' | 'none'>('ask');

const USER = ['I\'m vegetarian, by the way.', 'Dinner for two on Friday?', 'Somewhere near the river.', 'What about 7pm?', 'Can we do outdoor seating?', 'My partner hates loud places.', 'Any wine bars nearby?', 'Book a cab for 6:30.', 'Actually make it 6:45.', 'Do they take cards?', 'What\'s the dress code?', 'Is parking easy?', 'Add a reminder.', 'Thanks! Also Saturday brunch?', 'Same area is fine.', 'Something with pancakes.', 'Kids menu?', 'Ok book it.', 'What time is sunset?', 'Perfect.'];
const tok = (i: number) => 150 + ((i * 37) % 90); // deterministic "lengths"
const msgs = computed(() => {
  const out: { n: number; role: 'user' | 'assistant'; text: string; tokens: number; fact?: boolean; tool?: boolean }[] = [];
  for (let t = 0; t < turns.value; t++) {
    out.push({ n: out.length + 1, role: 'user', text: USER[t % USER.length]!, tokens: tok(2 * t), fact: t === 0 });
    out.push({ n: out.length + 1, role: 'assistant', text: t === 2 ? '[find_menu → 6 vegetarian places] Here are three…' : t === 0 ? 'Noted! I\'ll keep that in mind.' : 'Sure, here\'s what I found…', tokens: tok(2 * t + 1) + (t === 2 ? 140 : 0), tool: t === 2 });
  }
  return out;
});
const memoryOn = computed(() => mode.value !== 'none');
const windowMsgs = computed(() => {
  if (!memoryOn.value) return [];
  if (last.value !== 'tokens') return msgs.value.slice(-last.value);
  const out: typeof msgs.value = [];
  let sum = 0;
  for (let i = msgs.value.length - 1; i >= 0; i--) { sum += msgs.value[i]!.tokens; if (sum > MAXTOK) break; out.unshift(msgs.value[i]!); }
  return out;
});
const inWindow = (n: number) => windowMsgs.value.some((m) => m.n === n);
const recalled = computed(() => (memoryOn.value && recall.value && !inWindow(1) ? msgs.value.slice(0, 2) : []));
const wmOn = computed(() => memoryOn.value && wm.value);

const segs = computed(() => {
  const s = [{ k: 'system', label: 'system prompt', tokens: SYS, color: 'violet' }];
  if (wmOn.value) s.push({ k: 'wm', label: 'working memory', tokens: WM, color: 'lime' });
  if (recalled.value.length) s.push({ k: 'recall', label: 'semantic recall', tokens: recalled.value.reduce((a, m) => a + m.tokens, 0), color: 'sky' });
  if (windowMsgs.value.length) s.push({ k: 'history', label: `last ${windowMsgs.value.length} messages`, tokens: windowMsgs.value.reduce((a, m) => a + m.tokens, 0), color: 'amber' });
  s.push({ k: 'new', label: mode.value === 'ask' ? 'new message' : 'the signal', tokens: NEW, color: 'coral' });
  return s;
});
const total = computed(() => segs.value.reduce((a, s) => a + s.tokens, 0));
const over = computed(() => total.value > WINDOW);
const scale = computed(() => Math.max(WINDOW, total.value));
const knows = computed(() => inWindow(1) || recalled.value.length > 0 || wmOn.value);
const how = computed(() => {
  if (mode.value === 'none') return 'No memory configured. A run woken by a signal starts with **[system, signal]** and nothing else. It has no idea who you are.';
  if (inWindow(1)) return 'Message 1 is still inside the history window. Enjoy it while it lasts: add a few more turns.';
  if (wmOn.value && recalled.value.length) return 'Working memory carries the fact as a structured note, and semantic recall pulls message 1 back by meaning. Belt and braces.';
  if (wmOn.value) return 'The model saved `diet: vegetarian` to working memory back in message 2, and working memory rides along on every request.';
  if (recalled.value.length) return 'Semantic recall embedded the new message, found message 1 by similarity, and brought it back with a neighbor for context.';
  const w = last.value === 'tokens' ? `messageHistory: { maxTokens: ${MAXTOK} }` : `lastMessages: ${last.value}`;
  return `Message 1 fell out of the \`${w}\` window. **Recency is not relevance.** The model will happily suggest a steakhouse.`;
});
const ASK = 'Any ideas for Saturday dinner?';
const SIGNAL = '<notification source="booking-api">Table for two at Verde, 7pm</notification>';
const fmt = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
</script>

<template>
  <section class="cb mpc-card mpc-toy" aria-label="Context window budget">
    <div class="mpc-kicker"><Icon name="book" :size="14" /> Interactive: what reaches the model?</div>
    <p class="intro">A dinner-planning thread. In message 1 you said you're vegetarian. Grow the conversation, then decide what memory gets to bring along. The context window holds <strong>{{ WINDOW.toLocaleString() }}</strong> tokens.</p>

    <div class="controls">
      <label class="slider">
        <span class="label">Conversation so far: <strong>{{ turns * 2 }} messages</strong></span>
        <input type="range" min="1" max="20" v-model.number="turns" aria-label="Number of exchanges" />
      </label>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="Who starts this request">
        <span class="label">This request is</span>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'ask'" @click="mode = 'ask'">you, asking again</button>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'wake'" @click="mode = 'wake'">a signal waking the thread</button>
        <button type="button" role="radio" class="mpc-toggle" :aria-checked="mode === 'none'" @click="mode = 'none'">a wake, with no memory at all</button>
      </div>
      <div class="mpc-toggle-group" role="radiogroup" aria-label="lastMessages" :class="{ off: !memoryOn }">
        <span class="label">History</span>
        <button v-for="n in [5, 10, 20]" :key="n" type="button" role="radio" class="mpc-toggle" :disabled="!memoryOn" :aria-checked="last === n" @click="last = n as any"><code>lastMessages: {{ n }}</code></button>
        <button type="button" role="radio" class="mpc-toggle" :disabled="!memoryOn" :aria-checked="last === 'tokens'" @click="last = 'tokens'"><code>maxTokens: {{ MAXTOK }}</code></button>
        <label class="sw"><input type="checkbox" v-model="wm" :disabled="!memoryOn" /> working memory</label>
        <label class="sw"><input type="checkbox" v-model="recall" :disabled="!memoryOn" /> semantic recall</label>
      </div>
    </div>

    <div class="strip" role="img" :aria-label="`Stored messages: ${msgs.length}. In the window: ${windowMsgs.length}.`">
      <span v-for="m in msgs" :key="m.n" class="cell" :class="[m.role, { in: inWindow(m.n), rec: recalled.some((r) => r.n === m.n), fact: m.fact, tool: m.tool }]" :title="`#${m.n} ${m.role}: ${m.text}`">
        <span v-if="m.fact" class="star" aria-hidden="true">★</span>
      </span>
    </div>
    <div class="legend"><span><i class="cell user in" /> in the window</span><span><i class="cell user" /> stored, not sent</span><span><i class="cell user rec" /> recalled by meaning</span><span><i class="cell assistant tool in" /> tool call + result (one stored message)</span><span>★ "I'm vegetarian"</span></div>

    <div class="bar" role="img" :aria-label="`Prompt uses ${total} of ${WINDOW} tokens${over ? ', over budget' : ''}`">
      <div v-for="s in segs" :key="s.k" class="seg" :class="`b-${s.color}`" :style="{ width: (s.tokens / scale) * 100 + '%' }"><span>{{ s.label }}</span></div>
      <div class="limit" :style="{ left: (WINDOW / scale) * 100 + '%' }"><span>window</span></div>
    </div>
    <div class="nums"><strong :class="{ bad: over }">{{ total.toLocaleString() }}</strong> / {{ WINDOW.toLocaleString() }} tokens<span v-if="over" class="bad"> · over budget: <code>lastMessages</code> counts messages, not tokens. Try <code>maxTokens</code>.</span></div>

    <div class="out" aria-live="polite">
      <div class="verdict" :class="knows ? 'v-good' : 'v-bad'">
        <Mascot :mood="knows ? 'cheer' : 'alarmed'" :size="54" />
        <div>
          <strong>{{ knows ? 'The model knows you\'re vegetarian.' : 'The model has forgotten you\'re vegetarian.' }}</strong>
          <p v-html="fmt(how)" />
        </div>
      </div>
      <div class="prompt">
        <div class="mpc-kicker">The prompt, top to bottom</div>
        <ol>
          <li class="p-violet"><b>system</b> You are a dinner planner.</li>
          <li v-if="wmOn" class="p-lime"><b>system</b> working memory: <code>- diet: vegetarian</code></li>
          <li v-for="m in recalled" :key="'r' + m.n" class="p-sky"><b>{{ m.role }}</b> {{ m.text }} <em>(recalled #{{ m.n }})</em></li>
          <li v-if="memoryOn && windowMsgs.length && windowMsgs[0]!.n > 1" class="gap">… {{ windowMsgs[0]!.n - 1 }} older messages not sent …</li>
          <li v-for="m in windowMsgs" :key="m.n" class="p-amber" :class="{ star: m.fact }"><b>{{ m.role }}</b> {{ m.text }}</li>
          <li class="p-coral"><b>user</b> {{ mode === 'ask' ? ASK : SIGNAL }}</li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cb { background: var(--vp-c-bg-soft); }
.intro { margin: 6px 0 12px !important; }
.controls { display: grid; gap: 10px; }
.slider { display: grid; gap: 4px; }
.slider .label { font-size: var(--fs-sm); }
.slider input { width: 100%; accent-color: var(--mpc-violet); }
.sw { font-size: var(--fs-sm); font-weight: var(--fw-semibold); display: inline-flex; gap: 5px; align-items: center; margin-left: 6px; }
.off { opacity: 0.5; }
.strip { display: flex; flex-wrap: wrap; gap: 4px; margin: 16px 0 6px; }
.cell { position: relative; display: inline-block; width: 18px; height: 22px; border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-sm); background: var(--mpc-paper); opacity: 0.4; }
.cell.assistant { border-radius: var(--r-md); }
.cell.in { opacity: 1; background: var(--mpc-amber-soft); }
.cell.rec { opacity: 1; background: var(--mpc-sky-soft); border-color: var(--mpc-sky); }
.cell.tool { border-style: double; border-width: 4px; }
.star { position: absolute; top: -4px; left: 1px; font-size: var(--fs-sm); color: var(--mpc-coral); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: var(--fs-xs); color: var(--mpc-ink-2); }
.legend .cell { width: 12px; height: 14px; vertical-align: -2px; margin-right: 3px; }
.bar { position: relative; display: flex; height: 40px; margin-top: 18px; border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); background: repeating-linear-gradient(45deg, var(--mpc-paper), var(--mpc-paper) 6px, var(--vp-c-bg-soft) 6px, var(--vp-c-bg-soft) 12px); overflow: visible; }
.seg { height: 100%; border-right: 1.5px solid var(--mpc-line-strong); overflow: hidden; display: flex; align-items: center; transition: width 0.25s; }
.seg span { font-size: var(--fs-xs); font-weight: var(--fw-semibold); padding: 0 4px; white-space: nowrap; }
.b-violet { background: var(--mpc-violet-soft); } .b-lime { background: var(--mpc-lime-soft); } .b-sky { background: var(--mpc-sky-soft); }
.b-amber { background: var(--mpc-amber-soft); } .b-coral { background: var(--mpc-coral-soft); }
.limit { position: absolute; top: -8px; bottom: -8px; width: 3px; margin-left: -1.5px; background: var(--mpc-coral); }
.limit span { position: absolute; top: -18px; right: 4px; font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--mpc-coral); }
.nums { font-size: var(--fs-sm); margin-top: 6px; }
.bad { color: var(--mpc-coral); }
.out { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 12px; margin-top: 14px; align-items: start; }
@media (max-width: 700px) { .out { grid-template-columns: minmax(0, 1fr); } }
.verdict { display: flex; gap: 10px; align-items: flex-start; border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); padding: 10px; background: var(--mpc-paper); }
.verdict.v-good { background: var(--mpc-teal-soft); } .verdict.v-bad { background: var(--mpc-coral-soft); }
.verdict p { margin: 4px 0 0 !important; font-size: var(--fs-sm); }
.prompt { border: 1.5px solid var(--mpc-line-strong); border-radius: var(--r-md); padding: 10px; background: var(--mpc-paper); min-width: 0; }
.prompt ol { list-style: none; padding: 0 !important; margin: 6px 0 0 !important; display: grid; gap: 4px; }
.prompt li { margin: 0 !important; font-size: var(--fs-sm); line-height: 1.4; padding: 3px 7px; border-radius: var(--r-sm); overflow-wrap: break-word; }
.prompt li b { font-family: var(--mpc-mono); font-size: var(--fs-xs); margin-right: 4px; }
.prompt li em { color: var(--mpc-ink-2); }
.p-violet { background: var(--mpc-violet-soft); } .p-lime { background: var(--mpc-lime-soft); } .p-sky { background: var(--mpc-sky-soft); }
.p-amber { background: var(--mpc-amber-soft); } .p-coral { background: var(--mpc-coral-soft); }
.prompt li.star { outline: 2px solid var(--mpc-coral); }
.gap { font-style: italic; color: var(--mpc-ink-2); text-align: center; }
</style>
