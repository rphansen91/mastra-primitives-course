#!/usr/bin/env node
// Verifies every quote on the site.
//  1. Each QUOTES entry in docs/.vitepress/theme/reading.ts has a source (chapter+page for books, href+date for founders).
//  2. Every rendered [data-quote-id] element in docs/.vitepress/dist matches its QUOTES text exactly.
//  3. No markdown page attributes a quote to a founder or a book outside the quote components.
//  4. Optional: --source <file> checks each QUOTES text appears verbatim (after quote/whitespace
//     normalization) on a line of that file that also carries a source (URL, chapter or page).
// Usage: node scripts/check-quotes.mjs [--source path] [--no-dist]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const docs = join(root, 'docs');
const args = process.argv.slice(2);
const srcIdx = args.indexOf('--source');
const sourceFile = srcIdx >= 0 ? args[srcIdx + 1] : null;
const errors = [];
const fail = (m) => errors.push(m);

// --- 1. parse QUOTES
const ts = readFileSync(join(docs, '.vitepress/theme/reading.ts'), 'utf8');
const block = ts.slice(ts.indexOf('export const QUOTES'), ts.indexOf('\n};', ts.indexOf('export const QUOTES')));
const QUOTES = {};
const strLit = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')`;
const entryRe = new RegExp(String.raw`'([a-z0-9-]+)':\s*\{(.*?)\},?\s*$`, 'gm');
const field = (body, k) => { if (k === 'book') { const b = body.match(/\bbook:\s*P\b/); if (b) return 'principles'; } return field0(body, k); };
const field0 = (body, k) => { const m = body.match(new RegExp(String.raw`\b${k}:\s*` + strLit)); return m ? Function(`return ${m[1]}`)() : undefined; };
for (const m of block.matchAll(entryRe)) {
  const [, id, body] = m;
  const q = { kind: field(body, 'kind'), text: field(body, 'text'), chapter: field(body, 'chapter'), page: field(body, 'page'), href: field(body, 'href'), date: field(body, 'date'), who: field(body, 'who'), book: field(body, 'book') };
  QUOTES[id] = q;
  if (!q.text) fail(`${id}: no text`);
  if (q.kind === 'book') {
    if (!q.book || !q.chapter) fail(`${id}: book quote without book/chapter`);
    if (q.book === 'principles' && !q.page) fail(`${id}: Principles quote without page`);
  } else if (q.kind === 'founder') {
    if (!q.who || !q.href || !/^https:\/\//.test(q.href) || !q.date) fail(`${id}: founder quote without who/href/date`);
  } else fail(`${id}: unknown kind`);
  if (q.text && q.text.split(/\s+/).length > 40) fail(`${id}: quote longer than 40 words`);
}
const ids = Object.keys(QUOTES);
if (ids.length < 10) fail(`parsed only ${ids.length} quotes; parser broken?`);

// --- 2. rendered HTML
const walk = (d, ext, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!/node_modules|\.vitepress[\/]cache/.test(p)) walk(p, ext, out); } else if (p.endsWith(ext)) out.push(p); } return out; };
const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const dist = join(docs, '.vitepress/dist');
let rendered = 0; const usedOn = {};
if (!args.includes('--no-dist')) {
  if (!existsSync(dist)) fail('docs/.vitepress/dist missing; build first (or pass --no-dist)');
  else for (const f of walk(dist, '.html')) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<(q|p)\b[^>]*data-quote-id="([^"]+)"[^>]*>(.*?)<\/\1>/gs)) {
      rendered++;
      const [, , id, inner] = m; const q = QUOTES[id];
      if (!q) { fail(`${relative(dist, f)}: unknown quote id ${id}`); continue; }
      if (decode(inner) !== q.text.replace(/\s+/g, ' ').trim()) fail(`${relative(dist, f)}: ${id} rendered text differs:\n   got  ${decode(inner)}\n   want ${q.text}`);
      (usedOn[id] ||= new Set()).add(relative(dist, f));
    }
  }
  if (rendered === 0 && existsSync(dist)) fail('no rendered quotes found');
}

// --- 3. stray attributed quotes in markdown
const people = /\b(Bhagwat|Shane Thomas|Abhi Aiyer|Sam says|Shane says|Abhi says|the book says|Principles says)\b/i;
for (const f of walk(docs, '.md')) {
  if (f.includes('.vitepress')) continue;
  const md = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const para of md.split(/\n\s*\n/)) {
    if (!people.test(para)) continue;
    const stray = [...para.matchAll(/[“"]([^"”\n]{30,})[”"]/g)].map((m) => m[1]).filter((t) => !/[<>=]/.test(t) && t.split(/\s+/).length >= 6);
    for (const t of stray) fail(`${relative(docs, f)}: quoted text near an attribution not using <Cite>/<FounderQuote>: "${t.slice(0, 80)}"`);
  }
  for (const m of md.matchAll(/(?:<Cite|<FounderQuote)[^>]*\bid="([^"]+)"/g)) if (!QUOTES[m[1]]) fail(`${relative(docs, f)}: unknown quote id ${m[1]}`);
}

// --- 4. verbatim in source doc
let sourced = 0;
if (sourceFile) {
  const norm = (s) => s.replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\ufb00/g, 'ff').replace(/\ufb01/g, 'fi').replace(/\ufb02/g, 'fl').replace(/\s+/g, ' ').toLowerCase();
  const lines = readFileSync(sourceFile, 'utf8').split('\n').map(norm);
  for (const id of ids) {
    const t = norm(QUOTES[id].text);
    const at = lines.findIndex((l) => l.includes(t));
    const hasSrc = (l) => /https?:\/\/|\bp\.\s*[0-9ivx]|\bch\.|chapter|foreword|\b20\d\d\b/i.test(l);
    // A line "(same post)" or a bullet in a list inherits the source of the list's header or previous item.
    let ok = at >= 0 && hasSrc(lines[at]);
    for (let i = at - 1; at >= 0 && !ok && i >= 0 && at - i <= 20; i--) { if (hasSrc(lines[i])) { ok = true; break; } if (lines[i].trim() === '') break; }
    if (at < 0) fail(`${id}: not found verbatim in ${sourceFile}`);
    else if (!ok) fail(`${id}: found in source doc but no source on its line or its list header`);
    else sourced++;
  }
}

console.log(`quotes defined: ${ids.length}; rendered quote elements: ${rendered}; distinct rendered ids: ${Object.keys(usedOn).length}` + (sourceFile ? `; verbatim+sourced in source doc: ${sourced}/${ids.length}` : ''));
const unused = ids.filter((id) => rendered && !usedOn[id]);
if (unused.length) console.log(`defined but not rendered: ${unused.join(', ')}`);
if (errors.length) { console.error(`\n${errors.length} problem(s):\n- ` + errors.join('\n- ')); process.exit(1); }
console.log('check-quotes: OK');
