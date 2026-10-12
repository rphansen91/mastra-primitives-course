<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useId } from 'vue';
withDefaults(defineProps<{ title?: string; minutes?: number }>(), { title: 'Explain it like a podcast', minutes: 3 });
const open = ref(false);
const supported = ref(false);
const speaking = ref(false);
const paused = ref(false);
const body = ref<HTMLElement | null>(null);
const id = useId();
onMounted(() => (supported.value = typeof window !== 'undefined' && 'speechSynthesis' in window));
onBeforeUnmount(() => supported.value && window.speechSynthesis.cancel());

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
function stop() { window.speechSynthesis.cancel(); speaking.value = false; paused.value = false; }
</script>

<template>
  <section class="pod mpc-card" aria-label="Podcast-style transcript">
    <div class="head">
      <div class="art" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56" class="ill">
          <rect x="4" y="4" width="56" height="56" rx="14" class="f-violet outline" />
          <rect x="26" y="14" width="12" height="22" rx="6" class="c-violet outline" stroke-width="2" />
          <path d="M20 30a12 12 0 0 0 24 0M32 42v8M24 50h16" class="stroke" />
        </svg>
      </div>
      <div class="meta">
        <div class="mpc-kicker"><Icon name="headphones" :size="15" /> {{ minutes }}-minute listen</div>
        <strong>{{ title }}</strong>
        <p class="sub">The whole lesson as a conversation. Read it, or press play to have your browser read it aloud.</p>
      </div>
    </div>
    <div class="actions">
      <button v-if="supported" type="button" class="mpc-btn primary" @click="listen">
        <Icon :name="speaking && !paused ? 'pause' : 'play'" :size="15" /> {{ speaking ? (paused ? 'Resume' : 'Pause') : 'Listen' }}
      </button>
      <button v-if="speaking" type="button" class="mpc-btn" @click="stop">Stop</button>
      <button type="button" class="mpc-btn" :aria-expanded="open" :aria-controls="id" @click="open = !open">
        <Icon name="book" :size="15" /> {{ open ? 'Hide' : 'Read' }} transcript
      </button>
    </div>
    <div :id="id" ref="body" class="transcript" v-show="open"><slot /></div>
  </section>
</template>

<style scoped>
.pod { background: linear-gradient(135deg, var(--mpc-violet-soft), var(--mpc-sky-soft)); }
.head { display: flex; gap: 14px; align-items: center; }
.meta strong { font-size: var(--fs-body); }
.sub { font-size: var(--fs-sm); color: var(--vp-c-text-2); margin: 2px 0 0 !important; }
.actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.transcript { margin-top: 14px; padding: 14px 18px; border-radius: var(--r-md); border: 1px solid var(--mpc-line); background: var(--mpc-paper); }
.transcript :deep(p) { margin: 10px 0; font-size: var(--fs-md); }
.transcript :deep(strong) { color: var(--mpc-violet); }
</style>
