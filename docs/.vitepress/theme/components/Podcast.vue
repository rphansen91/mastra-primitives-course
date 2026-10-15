<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, useId } from 'vue';
// One "Listen" section per lesson. With `narration` set (an id from docs/audio/manifest.json) it offers two
// clearly labeled tabs: the AI narration player and the "as a conversation" read-along (browser voice).
// The header's Listen link (LessonHero) fires `mpc-listen`; this section then selects the right tab, scrolls
// here and starts playback. Nothing plays or loads on its own.
const props = withDefaults(defineProps<{ title?: string; minutes?: number; narration?: string }>(), { title: 'Explain it like a podcast', minutes: 3 });
const hasNarr = computed(() => !!props.narration);
const tab = ref<'ai' | 'talk'>(props.narration ? 'ai' : 'talk');
const open = ref(false);
const supported = ref(false);
const speaking = ref(false);
const paused = ref(false);
const body = ref<HTMLElement | null>(null);
const sec = ref<HTMLElement | null>(null);
const nar = ref<any>(null);
const id = useId();

function onListen() {
  if (hasNarr.value) { tab.value = 'ai'; }
  nextTick(async () => {
    sec.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    sec.value?.focus({ preventScroll: true });
    if (hasNarr.value) { try { await nar.value?.play(); } catch { /* the browser blocked play; the visible player is right here */ } }
    else if (supported.value && !speaking.value) listen();
  });
}
onMounted(() => {
  supported.value = typeof window !== 'undefined' && 'speechSynthesis' in window;
  window.addEventListener('mpc-listen', onListen);
});
onBeforeUnmount(() => {
  window.removeEventListener('mpc-listen', onListen);
  if (supported.value) window.speechSynthesis.cancel();
});

function pick(t: 'ai' | 'talk') {
  if (t === tab.value) return;
  if (t === 'talk') nar.value?.pause?.(); else stop();
  tab.value = t;
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  const t = e.key === 'ArrowLeft' || e.key === 'Home' ? 'ai' : 'talk';
  pick(t);
  nextTick(() => (sec.value?.querySelector(`#${CSS.escape(id)}-tab-${t}`) as HTMLElement | null)?.focus());
}
function listen() {
  const synth = window.speechSynthesis;
  if (speaking.value) {
    if (paused.value) { synth.resume(); paused.value = false; } else { synth.pause(); paused.value = true; }
    return;
  }
  open.value = true;
  const text = (body.value?.innerText ?? '').replace(/\s+/g, ' ');
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  u.onend = u.onerror = () => { speaking.value = false; paused.value = false; };
  synth.cancel();
  synth.speak(u);
  speaking.value = true;
}
function stop() { if (supported.value) window.speechSynthesis.cancel(); speaking.value = false; paused.value = false; }
</script>

<template>
  <section id="listen" ref="sec" tabindex="-1" class="pod mpc-card" aria-label="Listen to this lesson" data-listen>
    <div class="head">
      <div class="art" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56" class="ill">
          <rect x="4" y="4" width="56" height="56" rx="14" class="f-violet outline" />
          <rect x="26" y="14" width="12" height="22" rx="6" class="c-violet outline" stroke-width="2" />
          <path d="M20 30a12 12 0 0 0 24 0M32 42v8M24 50h16" class="stroke" />
        </svg>
      </div>
      <div class="meta">
        <div class="mpc-kicker"><Icon name="headphones" :size="15" /> Listen</div>
        <strong>{{ title }}</strong>
        <p class="sub">{{ hasNarr ? 'Choose how to listen: an AI narration of the wrap-up, or the lesson as a conversation read by your browser.' : 'The whole lesson as a conversation. Read it, or press play to have your browser read it aloud.' }}</p>
      </div>
    </div>

    <div v-if="hasNarr" class="tabs" role="tablist" aria-label="How to listen" @keydown="onKey">
      <button :id="id + '-tab-ai'" type="button" role="tab" class="mpc-toggle" :aria-selected="tab === 'ai'" :aria-controls="id + '-p-ai'" :tabindex="tab === 'ai' ? 0 : -1" @click="pick('ai')">AI narration</button>
      <button :id="id + '-tab-talk'" type="button" role="tab" class="mpc-toggle" :aria-selected="tab === 'talk'" :aria-controls="id + '-p-talk'" :tabindex="tab === 'talk' ? 0 : -1" @click="pick('talk')">As a conversation</button>
    </div>

    <div v-if="hasNarr" v-show="tab === 'ai'" :id="id + '-p-ai'" role="tabpanel" :aria-labelledby="id + '-tab-ai'" class="panel">
      <Narration ref="nar" :id="narration!" bare />
    </div>

    <div v-show="!hasNarr || tab === 'talk'" :id="id + '-p-talk'" :role="hasNarr ? 'tabpanel' : undefined" :aria-labelledby="hasNarr ? id + '-tab-talk' : undefined" class="panel">
      <p v-if="hasNarr" class="disc">Read by your browser's built-in voice, not the AI narrator. The text is the same lesson as a Host and Loopy conversation.</p>
      <div class="actions">
        <button v-if="supported" type="button" class="mpc-btn primary" @click="listen">
          <Icon :name="speaking && !paused ? 'pause' : 'play'" :size="15" /> {{ speaking ? (paused ? 'Resume' : 'Pause') : 'Read aloud' }}
        </button>
        <button v-if="speaking" type="button" class="mpc-btn" @click="stop">Stop</button>
        <button type="button" class="mpc-btn" :aria-expanded="open" :aria-controls="id" @click="open = !open">
          <Icon name="book" :size="15" /> {{ open ? 'Hide' : 'Read' }} transcript
        </button>
      </div>
      <div :id="id" ref="body" class="transcript" v-show="open"><slot /></div>
    </div>
  </section>
</template>

<style scoped>
.pod { background: var(--mpc-surface-2); scroll-margin-top: 80px; }
.pod:focus { outline: none; }
.pod:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.head { display: flex; gap: 14px; align-items: center; }
.meta strong { font-size: var(--fs-body); }
.sub { font-size: var(--fs-sm); color: var(--vp-c-text-2); margin: 2px 0 0 !important; }
.tabs .mpc-toggle[aria-selected='true'] { background: var(--vp-c-text-1); color: var(--vp-c-bg); }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }
.panel { margin-top: 12px; }
.disc { font-size: var(--fs-sm); color: var(--vp-c-text-2); margin: 0 0 8px !important; }
.actions { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
.transcript { margin-top: 14px; padding: 14px 18px; border-radius: var(--r-md); border: 1px solid var(--mpc-line); background: var(--mpc-paper); }
.transcript :deep(p) { margin: 10px 0; font-size: var(--fs-md); }
.transcript :deep(strong) { color: var(--mpc-violet); }
</style>
