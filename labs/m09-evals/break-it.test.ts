import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TARGET } from '../shared/target.ts';
import { ruleScorer } from './observe.ts';

test(`[${TARGET}] ex9.1: the scorer reads answers that come after a tool call`, async () => {
  const s = await ruleScorer();
  const scores = s.perItem.map((l) => Number(/→ (\d)/.exec(l)![1]));
  assert.deepEqual(scores, [1, 0, 1], s.perItem.join('\n'));
});
