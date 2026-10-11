import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historyWindow, toolPairs, wokenRun, workingMemory } from './memory-under-pressure.ts';

test('4.1 lastMessages: 5 sends exactly 5 history messages plus the new one', async () => {
  const h = await historyWindow();
  assert.equal(h.stored, 16);
  assert.equal(h.prompt.length, 1 + 5 + 1, 'system + 5 history + new user message');
  assert.match(h.prompt[1]!, /^assistant/, 'the window can start mid-exchange');
  assert.equal(h.stillKnowsDiet, false, 'recency is not relevance');
});

test('4.2 a tool call and its result are never split by the window', async () => {
  const t = await toolPairs();
  const call = t.prompt.findIndex((l) => l.includes('[tool-call find_menu]'));
  assert.ok(call > 0);
  assert.match(t.prompt[call + 1]!, /tool-result find_menu/);
});

test('4.3 a woken run only knows what memory stored', async () => {
  const without = await wokenRun(false);
  const withMem = await wokenRun(true);
  assert.equal(without.action, 'wake');
  assert.equal(without.prompt.length, 2, '[system, signal] and nothing else');
  assert.equal(without.knowsDiet, false);
  assert.equal(withMem.knowsDiet, true);
});

test('4.4 resource-scoped working memory reaches a different thread', async () => {
  const wm = await workingMemory();
  assert.deepEqual(wm.toolsOffered, ['updateWorkingMemory']);
  assert.equal(wm.fridaySeesDiet, true);
  assert.deepEqual(wm.fridayHistory, ['user      Plan Friday dinner.'], 'no message history crossed over, only working memory');
});
