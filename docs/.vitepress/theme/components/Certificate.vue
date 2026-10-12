<script setup lang="ts">
/**
 * Completion certificate, drawn client-side on a <canvas>. Unlocks when every course page is
 * marked done. Your name never leaves the browser.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import { MODULES, TOTAL_MINUTES, VERIFIED, pageLink } from '../modules';
import { data as labs } from '../labs.data';
import { COURSE_PAGES, continueTarget, courseDone, isRead, loadCourse, moduleDone, readKey } from '../course';
import { progress } from '../progress';

const mounted = ref(false);
const name = ref('');
const url = ref('');
const canvas = ref<HTMLCanvasElement>();
const NAME_KEY = 'mpc-cert-name';
onMounted(() => {
  loadCourse();
  try { name.value = localStorage.getItem(NAME_KEY) || ''; } catch {}
  mounted.value = true;
});
const done = computed(() => (mounted.value ? courseDone() : 0));
const complete = computed(() => mounted.value && done.value === COURSE_PAGES.length);
const next = computed(() => (mounted.value && !complete.value ? continueTarget() : null));
const finishedAt = computed(() => {
  const ts = COURSE_PAGES.map((p) => progress.done[readKey(p.link)] || 0);
  return new Date(Math.max(...ts, 0) || Date.now());
});
const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 60);
watch(name, (v) => { url.value = ''; try { localStorage.setItem(NAME_KEY, v); } catch {} });

const W = 1600, H = 1000;
async function draw() {
  if (!complete.value || !clean(name.value)) return;
  await Promise.all([document.fonts.load('600 80px Geist'), document.fonts.load('400 28px Geist'), document.fonts.load('500 22px "Geist Mono"')]).catch(() => {});
  await nextTick();
  const c = canvas.value!;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const ink = '#18181b', dim = '#5f5f66', line = '#e4e4e7', accent = '#5b3df5';
  const F = (w: number, px: number, mono = false) => `${w} ${px}px ${mono ? '"Geist Mono", ui-monospace, monospace' : 'Geist, Arial, sans-serif'}`;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  g.strokeStyle = line; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
  // module color rule along the top of the frame
  const segW = (W - 160) / MODULES.length;
  MODULES.forEach((m, k) => { g.fillStyle = m.color; g.fillRect(80 + k * segW + 3, 40 - 3, segW - 6, 6); });
  // logo: monoline loop + accent dot
  g.save(); g.translate(120, 150); g.strokeStyle = ink; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, 26, Math.PI * 0.35, Math.PI * 1.95); g.stroke();
  g.fillStyle = accent; g.beginPath(); g.arc(26 * Math.cos(Math.PI * 0.2), 26 * Math.sin(Math.PI * 0.2), 7, 0, Math.PI * 2); g.fill(); g.restore();
  g.fillStyle = ink; g.font = F(600, 30); g.textBaseline = 'middle'; g.fillText('Mastra Primitives', 168, 150);
  g.textAlign = 'right'; g.fillStyle = dim; g.font = F(500, 20, true);
  g.fillText(finishedAt.value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W - 120, 150);
  // title block
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = accent; g.font = F(600, 22); (g as any).letterSpacing = '6px';
  g.fillText('CERTIFICATE OF COMPLETION', W / 2, 330); (g as any).letterSpacing = '0px';
  let size = 96; const who = clean(name.value);
  do { g.font = F(600, size); size -= 4; } while (g.measureText(who).width > W - 320 && size > 40);
  g.fillStyle = ink; g.fillText(who, W / 2, 470);
  g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 360, 510); g.lineTo(W / 2 + 360, 510); g.stroke();
  g.fillStyle = dim; g.font = F(400, 30);
  g.fillText('completed Mastra Primitives, a source-level course on the agent loop, processors,', W / 2, 575);
  g.fillText('memory, workflows, signals, durability and multi-agent coordination in Mastra.', W / 2, 620);
  g.fillStyle = ink; g.font = F(500, 22, true);
  g.fillText(`${MODULES.length} modules · ~${Math.round(TOTAL_MINUTES / 30) / 2} h · ${labs.labs} labs, ${labs.tests} tests · @mastra/core@${VERIFIED.core}`, W / 2, 690);
  // module chips
  const cw = 92, gap = 14, total = MODULES.length * cw + (MODULES.length - 1) * gap; let x = (W - total) / 2;
  g.font = F(600, 20, true);
  for (const m of MODULES) {
    g.fillStyle = m.color; g.beginPath(); (g as any).roundRect(x, 740, cw, 44, 10); g.fill();
    g.fillStyle = '#ffffff'; g.fillText(`M${m.n}`, x + cw / 2, 769); x += cw + gap;
  }
  // signature + footer
  g.textAlign = 'left'; g.fillStyle = ink; g.font = F(600, 26); g.fillText('Ryan Hansen', 120, 880);
  g.fillStyle = dim; g.font = F(400, 20); g.fillText('Course author', 120, 910);
  g.textAlign = 'right'; g.font = F(400, 18); g.fillStyle = dim;
  g.fillText('rphansen91.github.io/mastra-primitives-course', W - 120, 880);
  g.fillText('Independent course, not affiliated with or endorsed by Mastra.', W - 120, 910);
  url.value = c.toDataURL('image/png');
}
const fileName = computed(() => `mastra-primitives-certificate-${clean(name.value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'you'}.png`);
</script>

<template>
  <section class="cert" aria-label="Completion certificate">
    <div class="status" :class="{ ok: complete }" aria-live="polite">
      <template v-if="!mounted">Checking your progress…</template>
      <template v-else-if="complete"><Icon name="check" :size="16" /> Every page done. Nice work. Add your name and draw your certificate.</template>
      <template v-else>
        <strong>{{ done }} of {{ COURSE_PAGES.length }} pages done.</strong> The certificate unlocks when every page is done (reach the end of a page to mark it).
        <a v-if="next" :href="withBase(next.link)" class="go">Continue: {{ next.label }} <Icon name="next" :size="13" /></a>
      </template>
    </div>

    <ol class="mods">
      <li v-for="m in MODULES" :key="m.n" :class="[`mod-${m.n}`, { full: mounted && moduleDone(m) === m.pages.length }]">
        <ModuleArt :module="m.n" :size="26" />
        <a :href="withBase(pageLink(m.n, 'lesson'))">{{ Number(m.n) }}. {{ m.short }}</a>
        <span class="n">{{ mounted ? moduleDone(m) : 0 }}/{{ m.pages.length }}</span>
      </li>
    </ol>

    <form class="form" @submit.prevent="draw">
      <label for="cert-name">Name on the certificate</label>
      <div class="row">
        <input id="cert-name" v-model="name" type="text" maxlength="60" autocomplete="name" placeholder="Your name" :disabled="!complete" />
        <button type="submit" class="mpc-btn primary" :disabled="!complete || !clean(name)"><Icon name="pen" :size="15" /> Draw certificate</button>
      </div>
      <p class="hint">Drawn in your browser. Your name is kept only in this browser's storage.</p>
    </form>

    <canvas ref="canvas" class="cv" aria-hidden="true" />
    <figure v-if="url" class="out">
      <img :src="url" :alt="`Certificate of completion for ${clean(name)}, Mastra Primitives`" width="1600" height="1000" />
      <figcaption><a class="mpc-btn primary" :href="url" :download="fileName"><Icon name="download" :size="15" /> Download PNG</a></figcaption>
    </figure>
  </section>
</template>

<style scoped>
.cert { margin: 24px 0; }
.status { padding: 14px 16px; border-radius: var(--r-md); background: var(--mpc-surface-2); border: 1px solid var(--mpc-line); font-size: var(--fs-md); }
.status.ok { background: var(--mpc-tip-bg); border-color: var(--mpc-tip-line); color: var(--mpc-tip-ink); display: flex; gap: 8px; align-items: center; }
.go { display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; font-weight: var(--fw-medium); }
.mods { list-style: none; padding: 0 !important; margin: 18px 0 !important; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
.mods li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin: 0 !important; border: 1px solid var(--mpc-line); border-radius: var(--r-md); font-size: var(--fs-sm); }
.mods li a { flex: 1; color: var(--vp-c-text-1); text-decoration: none; font-weight: var(--fw-medium); }
.mods li .n { font-variant-numeric: tabular-nums; color: var(--vp-c-text-2); font-size: var(--fs-xs); }
.mods li.full { border-color: var(--mod-accent); }
.mods li.full .n { color: var(--mod-accent); font-weight: var(--fw-semibold); }
.form label { display: block; font-weight: var(--fw-semibold); font-size: var(--fs-sm); margin-bottom: 6px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; }
input { flex: 1; min-width: 200px; font: inherit; font-size: var(--fs-body); padding: 8px 12px; border: 1px solid var(--mpc-line-strong); border-radius: var(--r-md); background: var(--vp-c-bg); color: var(--vp-c-text-1); }
input:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 1px; }
input:disabled { background: var(--mpc-surface-2); cursor: not-allowed; }
.hint { font-size: var(--fs-sm); color: var(--vp-c-text-2); margin: 6px 0 0 !important; }
.cv { display: none; }
.out { margin: 22px 0 0; }
.out img { width: 100%; height: auto; border: 1px solid var(--mpc-line); border-radius: var(--r-md); box-shadow: var(--mpc-shadow-2); }
.out figcaption { margin-top: 12px; }
.out a { text-decoration: none; }
</style>
