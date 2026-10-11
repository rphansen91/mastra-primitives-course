#!/usr/bin/env node
// Course freshness check. Each module page records the Mastra commit it was verified against
// (frontmatter `verified.sha`). This script collects every mastra-ai/mastra file the module cites
// (blob links on lesson, lab and quiz pages, plus the stability entries its Production readiness panel uses)
// and asks the GitHub API whether any of those files changed on `main` since that commit.
// Output: a Markdown report (stdout and $GITHUB_STEP_SUMMARY). Exit 0 always unless --strict.
import { readFileSync, readdirSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DOCS = join(ROOT, 'docs');
const REPO = 'mastra-ai/mastra';
const BRANCH = process.env.MASTRA_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const strict = process.argv.includes('--strict');
const LINK = /github\.com\/mastra-ai\/mastra\/blob\/([0-9a-f]{40})\/([^\s)#"'`?]+)/g;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

function frontmatterVerified(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const sha = fm.match(/^\s+sha:\s*['"]?([0-9a-f]{40})/m)?.[1];
  const date = fm.match(/^\s+date:\s*['"]?([0-9-]+)/m)?.[1];
  return sha ? { sha, date } : null;
}

// Stability entries cited by each module's Production readiness panel.
const stab = readFileSync(join(DOCS, '.vitepress/theme/stability.ts'), 'utf8');
const prod = readFileSync(join(DOCS, '.vitepress/theme/production.ts'), 'utf8');
const SHA_CONST = stab.match(/SHA\s*=\s*'([0-9a-f]{40})'/)?.[1];
const base = { DOCS: 'docs/src/content/en/docs/', CORE: 'packages/core/src/' };
function stabilityFiles(id) {
  const line = stab.split('\n').find((l) => l.trimStart().startsWith(`'${id}':`) || l.trimStart().startsWith(`${id}:`));
  const href = line?.match(/href:\s*([^,]+?),\s*source:/)?.[1] ?? '';
  const files = [];
  for (const m of href.matchAll(/(DOCS|CORE)\s*\+\s*'([^'#]+)/g)) files.push(base[m[1]] + m[2]);
  for (const m of href.matchAll(LINK)) files.push(m[2]);
  return files;
}
function prodIds(mod) {
  const block = prod.split(/\n\s*'(\d\d)':\s*\{/);
  const i = block.indexOf(mod);
  return i < 0 ? [] : [...(block[i + 1].match(/ids:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const modules = readdirSync(DOCS).filter((d) => /^m\d\d$/.test(d)).sort();
const report = [];
const cache = new Map();
for (const mod of modules) {
  const dir = join(DOCS, mod);
  const index = join(dir, 'index.md');
  if (!existsSync(index)) continue;
  const verified = frontmatterVerified(readFileSync(index, 'utf8'));
  if (!verified) { report.push({ mod, error: 'no `verified` frontmatter' }); continue; }
  const files = new Set();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(LINK)) files.add(m[2].replace(/\/$/, ''));
  }
  for (const id of prodIds(mod.slice(1))) stabilityFiles(id).forEach((f) => files.add(f));
  for (const f of [...files]) if (!/\.[a-z0-9]+$/i.test(f)) files.delete(f); // directory links are too noisy
  const changed = [];
  // Only commits newer than the verified commit itself (its committer date + 1 s).
  if (!cache.has(verified.sha)) cache.set(verified.sha, (await gh(`/repos/${REPO}/commits/${verified.sha}`)).commit.committer.date);
  const since = new Date(new Date(cache.get(verified.sha)).getTime() + 1000).toISOString();
  for (const file of files) {
    const key = `${verified.sha}:${file}`;
    if (!cache.has(key)) {
      try {
        // Commits on BRANCH touching this path, newer than the verified commit.
        const commits = await gh(`/repos/${REPO}/commits?sha=${BRANCH}&path=${encodeURIComponent(file)}&per_page=20&since=${since}`);
        const idx = commits.findIndex((c) => c.sha === verified.sha);
        const newer = idx >= 0 ? commits.slice(0, idx) : commits.filter((c) => c.sha !== verified.sha);
        cache.set(key, { count: newer.length, latest: newer[0]?.sha });
      } catch (e) {
        cache.set(key, { error: String(e.message) });
      }
    }
    const r = cache.get(key);
    if (r.error || r.count) changed.push({ file, ...r });
  }
  report.push({ mod, verified, total: files.size, changed });
}

const lines = [`# Course freshness vs \`${REPO}@${BRANCH}\``, '', `Stability table pinned at \`${SHA_CONST?.slice(0, 7)}\`.`, '', '| Module | Verified at | Cited files | Changed since |', '|---|---|---|---|'];
for (const r of report) {
  if (r.error) { lines.push(`| ${r.mod} | ⚠️ ${r.error} | | |`); continue; }
  const flag = r.changed.length ? `⚠️ ${r.changed.length}` : '✅ 0';
  lines.push(`| ${r.mod} | \`${r.verified.sha.slice(0, 7)}\` (${r.verified.date}) | ${r.total} | ${flag} |`);
}
const stale = report.filter((r) => r.changed?.length);
for (const r of stale) {
  lines.push('', `## ${r.mod}: re-verify these cited files`, '');
  for (const c of r.changed) {
    lines.push(c.error ? `- \`${c.file}\`: lookup failed (${c.error}). Moved or deleted?` : `- [\`${c.file}\`](https://github.com/${REPO}/compare/${r.verified.sha}...${BRANCH}): ${c.count}${c.count === 20 ? '+' : ''} newer commit(s), latest \`${c.latest.slice(0, 7)}\``);
  }
}
if (stale.length) lines.push('', 'After re-verifying a module, bump its frontmatter `verified.sha` and `verified.date`.');
const out = lines.join('\n') + '\n';
process.stdout.write(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out);
if (strict && stale.length) process.exit(1);
