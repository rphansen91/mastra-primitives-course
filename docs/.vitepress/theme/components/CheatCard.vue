<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * A one-page visual summary drawn as a self-contained SVG (fixed colors, no
 * external CSS) so it can be downloaded as a PNG or printed on its own.
 */
type Cell = { title: string; color?: 'violet' | 'teal' | 'amber' | 'coral' | 'sky' | 'lime'; lines: string[] };
const props = defineProps<{ module: string; title: string; subtitle?: string; cells: Cell[] }>();

const C = {
  ink: '#221d45', paper: '#ffffff', dim: '#5b5680',
  violet: '#ece7ff', teal: '#d6f5f0', amber: '#fff0d1', coral: '#ffe0e6', sky: '#ddeeff', lime: '#e3f6da',
  violetS: '#6d4aff', tealS: '#0e9f92',
};
const W = 1000, PAD = 24, GAP = 18, COLW = (W - PAD * 2 - GAP) / 2, LH = 23, FS = 15.5;
const clean = (s: string) => s.replace(/\*\*|`/g, '');
function wrap(s: string, max: number) {
  const out: string[] = [];
  let line = '';
  for (const w of clean(s).split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
const layout = computed(() => {
  const maxChars = Math.floor((COLW - 46) / (FS * 0.54));
  const cells = props.cells.map((c) => ({ ...c, wrapped: c.lines.map((l) => wrap(l, maxChars)) }));
  const heights = cells.map((c) => 58 + c.wrapped.reduce((n, w) => n + w.length * LH + 6, 0) + 8);
  const rows: { y: number; h: number }[] = [];
  let y = 136;
  for (let i = 0; i < cells.length; i += 2) {
    const h = Math.max(heights[i], heights[i + 1] ?? 0);
    rows.push({ y, h });
    y += h + GAP;
  }
  const placed = cells.map((c, i) => {
    const r = rows[Math.floor(i / 2)];
    const x = PAD + (i % 2) * (COLW + GAP);
    let ly = r.y + 66;
    const lines = c.wrapped.map((w) => { const start = ly; ly += w.length * LH + 6; return { start, w }; });
    return { ...c, x, y: r.y, h: r.h, lines };
  });
  return { cells: placed, height: y + 34 };
});

const svgEl = ref<SVGSVGElement | null>(null);
const root = ref<HTMLElement | null>(null);
const busy = ref(false);
async function download() {
  if (!svgEl.value) return;
  busy.value = true;
  const xml = new XMLSerializer().serializeToString(svgEl.value);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = layout.value.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `mastra-primitives-module-${props.module}-cheat-card.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      busy.value = false;
    }, 'image/png');
  };
  img.src = url;
}
function print() {
  const html = document.documentElement;
  root.value?.classList.add('mpc-print-target');
  html.classList.add('mpc-printing');
  const done = () => { html.classList.remove('mpc-printing'); root.value?.classList.remove('mpc-print-target'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1000);
}
</script>

<template>
  <figure ref="root" class="cheat" :aria-label="`Cheat card: ${title}`">
    <div class="tools mpc-no-print">
      <span class="mpc-kicker"><Icon name="star" :size="15" /> Your cheat card</span>
      <span class="sp" />
      <button type="button" class="mpc-btn small" :disabled="busy" @click="download"><Icon name="download" :size="15" /> Download PNG</button>
      <button type="button" class="mpc-btn small" @click="print"><Icon name="print" :size="15" /> Print</button>
    </div>
    <!-- Phones: the SVG is scaled to about a third of its size (text about 5px), so show the same content as real HTML text instead.
         The SVG stays in the DOM (hidden) because Download PNG serializes it. -->
    <div class="card-html" :aria-label="title">
      <div class="ch-head"><div class="ch-kick">Mastra Primitives · Module {{ Number(module) }} · Cheat card</div><div class="ch-title">{{ title }}</div><div v-if="subtitle" class="ch-sub">{{ subtitle }}</div></div>
      <div v-for="(c, i) in cells" :key="i" class="ch-cell" :style="{ background: C[c.color ?? 'sky'] }">
        <div class="ch-ct"><span class="ch-n">{{ i + 1 }}</span>{{ c.title }}</div>
        <ul><li v-for="(l, j) in c.lines" :key="j">{{ clean(l) }}</li></ul>
      </div>
    </div>
    <svg ref="svgEl" class="card-svg" xmlns="http://www.w3.org/2000/svg" :viewBox="`0 0 ${W} ${layout.height}`" :width="W" :height="layout.height"
      role="img" :aria-label="`${title}. ${cells.map((c) => c.title + ': ' + c.lines.map(clean).join('; ')).join('. ')}`"
      font-family="Inter, 'Segoe UI', system-ui, -apple-system, sans-serif">
      <rect x="0" y="0" :width="W" :height="layout.height" rx="22" :fill="C.paper" />
      <rect x="6" y="6" :width="W - 12" :height="layout.height - 12" rx="18" fill="none" :stroke="C.ink" stroke-width="3" />
      <rect x="6" y="6" :width="W - 12" height="110" rx="18" :fill="C.violet" :stroke="C.ink" stroke-width="3" />
      <!-- Loopy -->
      <g transform="translate(866 14) scale(0.78)">
        <path d="M66 10 A7 7 0 1 1 60 4" fill="none" :stroke="C.violetS" stroke-width="3.5" stroke-linecap="round" />
        <line x1="60" y1="30" x2="60" y2="19" :stroke="C.ink" stroke-width="3" />
        <ellipse cx="63" cy="74" rx="40" ry="38" :fill="C.ink" />
        <ellipse cx="60" cy="71" rx="40" ry="38" :fill="C.teal" :stroke="C.ink" stroke-width="3" />
        <rect x="31" y="50" width="58" height="38" rx="16" :fill="C.paper" :stroke="C.ink" stroke-width="3" />
        <path d="M44 67 Q48 61 52 67 M68 67 Q72 61 76 67 M52 76 Q60 83 68 76" fill="none" :stroke="C.ink" stroke-width="3.2" stroke-linecap="round" />
      </g>
      <text x="32" y="44" font-size="15" font-weight="600" letter-spacing="1.5" :fill="C.dim">MASTRA PRIMITIVES · MODULE {{ Number(module) }} · CHEAT CARD</text>
      <text x="32" y="82" font-size="32" font-weight="600" :fill="C.ink">{{ title }}</text>
      <text v-if="subtitle" x="32" y="106" font-size="15" :fill="C.dim">{{ subtitle }}</text>
      <g v-for="(c, i) in layout.cells" :key="i">
        <rect :x="c.x + 4" :y="c.y + 4" :width="COLW" :height="c.h" rx="14" :fill="C.ink" />
        <rect :x="c.x" :y="c.y" :width="COLW" :height="c.h" rx="14" :fill="C[c.color ?? 'sky']" :stroke="C.ink" stroke-width="2.5" />
        <circle :cx="c.x + 30" :cy="c.y + 32" r="15" :fill="C.paper" :stroke="C.ink" stroke-width="2.5" />
        <text :x="c.x + 30" :y="c.y + 38" font-size="15" font-weight="600" text-anchor="middle" :fill="C.ink">{{ i + 1 }}</text>
        <text :x="c.x + 56" :y="c.y + 39" font-size="19" font-weight="600" :fill="C.ink">{{ c.title }}</text>
        <g v-for="(l, j) in c.lines" :key="j">
          <circle :cx="c.x + 24" :cy="l.start - 5" r="3.5" :fill="C.ink" />
          <text v-for="(w, k) in l.w" :key="k" :x="c.x + 36" :y="l.start + k * LH" :font-size="FS" :fill="C.ink">{{ w }}</text>
        </g>
      </g>
      <text :x="W / 2" :y="layout.height - 18" font-size="13" text-anchor="middle" :fill="C.dim">rphansen91.github.io/mastra-primitives-course · MIT · source links pinned to mastra-ai/mastra@f88217d</text>
    </svg>
  </figure>
</template>

<style scoped>
.cheat { margin: 32px 0; overflow: hidden; padding: 0 6px 6px 0; max-width: 100%; }
.tools { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.sp { flex: 1; }
/* Target the card by class: a bare `svg` selector in scoped CSS also matches the root <svg> of child
   components (Vue stamps the parent's scope id on a child's root), which blew <Icon> up to 100% width. */
.card-svg { width: 100%; height: auto; display: block; }
/* No CSS filter on the SVG: filter + large viewBox SVGs can paint blank in WebKit. The shadow is a box-shadow on the figure's card instead. */
.card-svg, .card-html { box-shadow: 4px 4px 0 var(--mpc-shadow); border-radius: 22px; }
.card-html { display: none; background: #fff; color: #221d45; border: 3px solid #221d45; padding: 14px; }
.ch-head { background: #ece7ff; border: 2px solid #221d45; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; }
.ch-kick { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #5b5680; }
.ch-title { font-size: 22px; font-weight: 600; line-height: 1.2; margin-top: 4px; }
.ch-sub { font-size: 14px; color: #5b5680; margin-top: 2px; }
.ch-cell { border: 2px solid #221d45; border-radius: 14px; padding: 12px 14px; margin-top: 10px; }
.ch-ct { font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 10px; }
.ch-n { width: 26px; height: 26px; border-radius: 50%; background: #fff; border: 2px solid #221d45; display: inline-grid; place-items: center; font-size: 14px; flex: none; }
.ch-cell ul { margin: 8px 0 0 !important; padding-left: 20px !important; }
.ch-cell li { font-size: 15px; line-height: 1.5; margin: 4px 0 !important; color: #221d45; }
@media (max-width: 640px) { .card-html { display: block; } .card-svg { display: none; } }
.tools .mpc-kicker { display: inline-flex; align-items: center; gap: 6px; }
.tools .mpc-btn { white-space: nowrap; }
@media (max-width: 520px) { .tools .mpc-kicker { flex-basis: 100%; } .sp { display: none; } }
</style>
