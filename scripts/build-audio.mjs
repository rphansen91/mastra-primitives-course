#!/usr/bin/env node
// Offline narration renderer. NOT part of the site build (output is nondeterministic and costs money).
//   ELEVENLABS_API_KEY=... node scripts/build-audio.mjs [--check] [--only id] [--dry]
// Reads docs/audio/*.script.md, hashes (text + voice + model + settings + seed), and renders only
// scripts whose hash has no file in docs/public/audio/. Writes docs/audio/manifest.json and appends
// to docs/audio/usage.json. --check exits 1 if any script is stale (no network, no key needed).
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const AUDIO_SRC = join(root, 'docs/audio');
const OUT = join(root, 'docs/public/audio');
const VOICE = JSON.parse(readFileSync(join(AUDIO_SRC, 'voice.json'), 'utf8'));
const RATE_PER_1K = 0.08; // USD per 1,000 characters, ElevenLabs API list price (v2 multilingual)
const MAX_CHARS = VOICE.max_chunk_chars ?? 1200;
// Audio tags such as [curious] or [emphasis] (eleven_v3) are spoken-delivery cues. They are hashed and sent
// to the TTS, but never shown: the on-page transcript is stored tag-free in the manifest.
const TAG_RE = /\[[a-z][a-z ]*\]\s*/gi;
export const stripTags = (t) => t.replace(TAG_RE, '').replace(/\s+/g, ' ').trim();
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

export function parseScript(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (m) for (const l of m[1].split('\n')) { const k = l.match(/^(\w+):\s*(.*)$/); if (k) meta[k[1]] = k[2].replace(/^"|"$/g, ''); }
  const body = src.slice(m ? m[0].length : 0).trim();
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return { meta, paragraphs };
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const hashOf = (paragraphs, meta = {}) => sha(JSON.stringify([paragraphs, VOICE.voice_id, VOICE.model_id, VOICE.settings, VOICE.seed, meta.seed ?? null, VOICE.output_format, VOICE.pipeline, VOICE.max_chunk_chars])).slice(0, 8);

function chunk(paragraphs) {
  const out = []; let cur = '';
  for (const p of paragraphs) {
    if (cur && (cur + '\n\n' + p).length > MAX_CHARS) { out.push(cur); cur = p; } else cur = cur ? cur + '\n\n' + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

const manifestPath = join(AUDIO_SRC, 'manifest.json');
const usagePath = join(AUDIO_SRC, 'usage.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const usage = existsSync(usagePath) ? JSON.parse(readFileSync(usagePath, 'utf8')) : { rateUsdPer1kChars: RATE_PER_1K, renders: [] };
mkdirSync(OUT, { recursive: true });

const scripts = readdirSync(AUDIO_SRC).filter((f) => f.endsWith('.script.md')).sort();
let stale = 0;
for (const f of scripts) {
  const { meta, paragraphs } = parseScript(readFileSync(join(AUDIO_SRC, f), 'utf8'));
  const id = meta.id;
  if (!id || (only && only !== id)) continue;
  const hash = hashOf(paragraphs, meta);
  const file = `${id}.${hash}.mp3`;
  if (existsSync(join(OUT, file)) && manifest[id]?.hash === hash) { console.log(`ok     ${id} (${hash})`); continue; }
  stale++;
  const chars = paragraphs.join('\n\n').length;
  if (flag('--check')) { console.log(`STALE  ${id}: needs render (hash ${hash}, ${chars} chars)`); continue; }
  if (flag('--dry')) { console.log(`would render ${id}: ${chars} chars, about $${(chars / 1000 * RATE_PER_1K).toFixed(3)}`); continue; }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(2); }
  const parts = chunk(paragraphs); const tmp = []; let billed = 0;
  for (let i = 0; i < parts.length; i++) {
    // eleven_v3 has no previous_text/next_text continuity, so each segment is an independent request.
    // Re-roll an odd segment by setting `seed: N` in the script's frontmatter (it is part of the hash).
    const body = { text: parts[i], model_id: VOICE.model_id, voice_settings: VOICE.settings, seed: meta.seed ? Number(meta.seed) : VOICE.seed };
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE.voice_id}?output_format=${VOICE.output_format}`, {
      method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!r.ok) { console.error(`TTS failed for ${id}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }
    billed += parts[i].length;
    const p = join(tmpdir(), `${id}-${i}.mp3`); writeFileSync(p, Buffer.from(await r.arrayBuffer())); tmp.push(p);
  }
  const outPath = join(OUT, file);
  const list = join(tmpdir(), `${id}.txt`); writeFileSync(list, tmp.map((p) => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k',
    '-metadata', 'comment=AI-generated narration (ElevenLabs stock voice). Not a recording of a real host.', '-metadata', `title=${meta.title ?? id}`, outPath]);
  tmp.forEach((p) => unlinkSync(p));
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath]).toString());
  if (manifest[id]?.file && manifest[id].file !== file && existsSync(join(OUT, manifest[id].file))) unlinkSync(join(OUT, manifest[id].file));
  manifest[id] = { hash, file, seconds: Math.round(dur * 10) / 10, bytes: statSync(outPath).size, chars: billed, voice: VOICE.name, model: VOICE.model_id, title: meta.title ?? id, transcript: paragraphs.map(stripTags), verifiedCore: meta.verifiedCore };
  usage.renders.push({ id, hash, chars: billed, usd: +(billed / 1000 * RATE_PER_1K).toFixed(4), at: new Date().toISOString() });
  console.log(`render ${id}: ${billed} chars, ${manifest[id].seconds}s, ${manifest[id].bytes} bytes`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(usagePath, JSON.stringify(usage, null, 2) + '\n');
}
if (flag('--check')) { if (stale) { console.error(`${stale} stale clip(s). Run: node scripts/build-audio.mjs`); process.exit(1); } console.log('audio is current'); }
