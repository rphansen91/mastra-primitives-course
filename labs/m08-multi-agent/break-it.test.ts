import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TARGET } from '../shared/target.ts';
import { runPingPong } from './ping-pong.ts';

test(`[${TARGET}] ex8.1: the ping-pong stops on its own`, async () => {
  const r = await runPingPong({ safetyCap: 12 });
  assert.ok(r.stopped, `no guard stopped it:\n${r.relays.join('\n')}`);
  assert.ok(r.sent <= 4, `${r.sent} relays sent`);
});
