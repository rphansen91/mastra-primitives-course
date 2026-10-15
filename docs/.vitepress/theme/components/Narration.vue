<script setup lang="ts">
import { ref, computed, onMounted, useId } from 'vue';
import { withBase } from 'vitepress';
import manifest from '../../../audio/manifest.json';

// Narrated audio for a lesson. The transcript comes from the manifest, which build-audio.mjs writes from the
// same script file (audio tags like [curious] stripped), so spoken and written text cannot drift. Audio is never loaded or played until the
// reader asks (preload="none", no autoplay).
const props = defineProps<{ id: string; label?: string }>();
const clip = computed(() => (manifest as Record<string, any>)[props.id]);
const src = computed(() => (clip.value ? withBase(`/audio/${clip.value.file}`) : ''));
const mins = computed(() => (clip.value ? Math.max(1, Math.round(clip.value.seconds / 60)) : 0));
const audio = ref<HTMLAudioElement | null>(null);
const rate = ref('1');
const uid = useId();
const KEY = `mpc-audio-pos:${props.id}`;

onMounted(() => {
  try {
    const t = parseFloat(localStorage.getItem(KEY) || '0');
    if (t > 1 && audio.value) audio.value.addEventListener('loadedmetadata', () => { if (audio.value && t < audio.value.duration - 2) audio.value.currentTime = t; }, { once: true });
  } catch { /* storage unavailable */ }
});
function save() { try { if (audio.value) localStorage.setItem(KEY, String(audio.value.ended ? 0 : audio.value.currentTime)); } catch { /* ignore */ } }
function setRate() { if (audio.value) audio.value.playbackRate = parseFloat(rate.value); }
function back() { if (audio.value) audio.value.currentTime = Math.max(0, audio.value.currentTime - 15); }
</script>

<template>
  <section v-if="clip" class="nar mpc-card" :aria-labelledby="uid + '-t'" data-narration>
    <div class="mpc-kicker"><Icon name="headphones" :size="15" /> {{ label ?? 'Listen' }} · about {{ mins }} min</div>
    <strong :id="uid + '-t'">{{ clip.title }}</strong>
    <audio ref="audio" :src="src" controls preload="none" :aria-label="clip.title" @timeupdate="save" @pause="save" @ratechange="() => {}" data-narration-audio></audio>
    <div class="row">
      <label class="rate">Speed
        <select v-model="rate" @change="setRate">
          <option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option>
        </select>
      </label>
      <button type="button" class="mpc-btn small" @click="back">Back 15 seconds</button>
    </div>
    <p class="disc">Narrated by a synthetic AI voice (an ElevenLabs stock voice). It is not a recording of a real person. The script follows the course text. This is an independent course and is not endorsed by Mastra or its founders.</p>
    <details class="tx">
      <summary>Read the transcript</summary>
      <div class="body"><p v-for="(para, k) in clip.transcript" :key="k">{{ para }}</p></div>
    </details>
  </section>
</template>

<style scoped>
.nar { background: var(--mpc-surface-2); margin: 18px 0; }
.nar strong { display: block; font-size: var(--fs-body); margin: 2px 0 10px; }
audio { width: 100%; height: 44px; display: block; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
.rate { font-size: var(--fs-sm); display: inline-flex; gap: 8px; align-items: center; }
.rate select { font: inherit; padding: 6px 8px; border-radius: var(--r-md); border: 1px solid var(--mpc-line); background: var(--mpc-paper); color: inherit; min-height: 36px; }
.disc { font-size: var(--fs-sm); color: var(--vp-c-text-2); margin: 10px 0 0 !important; }
.tx { margin-top: 10px; }
.tx summary { cursor: pointer; font-weight: 600; min-height: 32px; }
.tx .body { margin-top: 8px; padding: 12px 16px; border-radius: var(--r-md); border: 1px solid var(--mpc-line); background: var(--mpc-paper); }
.tx .body :deep(p) { margin: 8px 0; font-size: var(--fs-md); }
</style>
