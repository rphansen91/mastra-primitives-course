// Build-time facts for the landing page stats strip, read from the actual labs/ folder so
// the numbers can't drift from the repo.
import fs from 'node:fs';
import path from 'node:path';

export interface LabStats { labs: number; tests: number; testFiles: number }
declare const data: LabStats;
export { data };

const LABS = path.resolve(__dirname, '../../../labs');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

export default {
  watch: ['../../../labs/m0*/**/*.test.ts'],
  load(): LabStats {
    const labDirs = fs.readdirSync(LABS).filter((d) => /^m\d\d-/.test(d) && fs.statSync(path.join(LABS, d)).isDirectory());
    const files = labDirs.flatMap((d) => walk(path.join(LABS, d)));
    const tests = files.reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/\b(?:test|it)\(\s*['"`]/g)?.length ?? 0), 0);
    return { labs: labDirs.length, tests, testFiles: files.length };
  },
};
