// Build-time Open Graph images: hand-composed SVG rendered to PNG with resvg (no browser needed).
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FONTS = ['Geist-Regular.ttf', 'Geist-Medium.ttf', 'Geist-SemiBold.ttf', 'GeistMono-Regular.ttf', 'GeistMono-Medium.ttf'].map((f) => join(here, '../../scripts/og-fonts', f));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy wrap using an average advance width (em fraction) for the font. */
export function wrap(text: string, size: number, maxW: number, em = 0.55, maxLines = 3): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length * size * em > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].replace(/\s*\S*$/, '') + '…'; return keep; }
  return lines;
}

export type OgItem = { slug: string; title: string; kicker: string; desc: string; color: string };

export function ogSvg(it: OgItem, verified: string): string {
  const titleSize = it.title.length > 34 ? 60 : 68;
  const tl = wrap(it.title, titleSize, 820, 0.56, 2);
  const dl = wrap(it.desc, 30, 800, 0.5, 3);
  const ty = 200 + titleSize; const dy = ty + tl.length * (titleSize * 1.12) + 26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fbfbfd"/>
  <rect x="0" y="0" width="14" height="630" fill="${it.color}"/>
  <g transform="translate(1035 330) scale(0.8)" opacity="0.9">
    <circle r="150" fill="none" stroke="${it.color}" stroke-opacity="0.12" stroke-width="56"/>
    <path d="M106 -106 A150 150 0 1 0 106 106" fill="none" stroke="${it.color}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="150" cy="0" r="22" fill="${it.color}"/>
  </g>
  <g transform="translate(80 70)">
    <rect width="56" height="56" rx="14" fill="#16141f"/>
    <path d="M38.7 19 A14 14 0 1 0 38.7 37" fill="none" stroke="#f4f2ff" stroke-width="4.8" stroke-linecap="round" transform="translate(0 0)"/>
    <circle cx="42" cy="28" r="4.6" fill="#9b82ff"/>
    <text x="76" y="38" font-family="Geist" font-weight="600" font-size="28" fill="#16141f">Mastra Primitives</text>
  </g>
  <text x="80" y="186" font-family="Geist Mono" font-weight="500" font-size="24" letter-spacing="1" fill="${it.color}">${esc(it.kicker.toUpperCase())}</text>
  ${tl.map((l, i) => `<text x="80" y="${ty + i * titleSize * 1.12}" font-family="Geist" font-weight="600" font-size="${titleSize}" letter-spacing="-1.5" fill="#16141f">${esc(l)}</text>`).join('\n  ')}
  ${dl.map((l, i) => `<text x="80" y="${dy + i * 42}" font-family="Geist" font-size="30" fill="#55546a">${esc(l)}</text>`).join('\n  ')}
  <text x="80" y="580" font-family="Geist" font-weight="500" font-size="22" fill="#55546a">Independent course · labs need no API keys · verified against @mastra/core ${esc(verified)}</text>
</svg>`;
}

export function renderPng(svg: string, width: number): Buffer {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Geist' } });
  return r.render().asPng();
}

export function writeOgImages(items: OgItem[], outDir: string, verified: string) {
  mkdirSync(join(outDir, 'og'), { recursive: true });
  for (const it of items) writeFileSync(join(outDir, 'og', `${it.slug}.png`), renderPng(ogSvg(it, verified), 1200));
}

/** apple-touch-icon from the favicon mark. */
export function writeTouchIcon(outDir: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#16141f"/><path d="M22.13 10.86A8 8 0 1 0 22.13 21.14" fill="none" stroke="#f4f2ff" stroke-width="2.8" stroke-linecap="round"/><circle cx="24" cy="16" r="2.6" fill="#9b82ff"/></svg>`;
  writeFileSync(join(outDir, 'apple-touch-icon.png'), renderPng(svg, 180));
}
