import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { InMemoryStore } from '@mastra/core/storage';
import { TARGET } from '../shared/target.ts';
import { LOG, events, makeMastra } from './refund-flow.ts';

test(`[${TARGET}] ex5.1: the manager is asked exactly once`, async () => {
  rmSync(LOG(), { force: true });
  const mastra = await makeMastra(new InMemoryStore());
  const wf = mastra.getWorkflow('refund');
  const run = await wf.createRun();
  const first: any = await run.start({ inputData: { orderId: 'order-1' } });
  assert.equal(first.status, 'suspended');
  const done: any = await (await wf.createRun({ runId: run.runId })).resume({ step: 'approve', resumeData: { approved: false } });
  assert.equal(done.status, 'success');
  assert.deepEqual(done.result, { message: 'Refund declined' });
  const emails = events().filter((e) => e.event.startsWith('EMAIL manager'));
  assert.equal(emails.length, 1, `manager emailed ${emails.length}x`);
  assert.ok(!events().some((e) => e.event.startsWith('apply refund')), 'a declined refund is never applied');
});
