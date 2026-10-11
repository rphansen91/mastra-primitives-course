// Lab 8.2 — the ping-pong. Two worker agents on separate threads each have a relay tool that sends
// a notice to the other's thread. Each one politely acknowledges every notice it receives...
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { MockMemory } from '@mastra/core/memory';
import { createTool } from '@mastra/core/tools';
import { scriptedModel, banner, sleep } from '../shared/mock-model.ts';
import { load } from '../shared/target.ts';

export async function runPingPong({ safetyCap = 12 } = {}) {
  const { nextHop } = await load(import.meta.dirname, 'ex1-hop-guard.ts');
  const storage = new InMemoryStore();
  const relays: string[] = [];
  const thread = (id: string) => ({ resourceId: 'team', threadId: `${id}-thread` });
  let mastra!: Mastra;

  const make = (id: string, peer: string) => {
    const relay = createTool({
      id: 'relay_to_peer', description: 'Send a notice to the peer agent',
      inputSchema: z.object({ message: z.string(), hops: z.number() }),
      execute: async ({ message, hops }) => {
        const next = nextHop({ hops });
        if (!next) { relays.push(`${id} ✋ stops at hop ${hops}`); return { sent: false, reason: 'hop budget spent' }; }
        if (relays.length >= safetyCap) { relays.push('… safety cap hit, test harness pulls the plug'); return { sent: false, reason: 'cap' }; }
        relays.push(`${id} → ${peer} (hops=${next.hops}) "${message}"`);
        // Fire and forget, a moment later (like a message bus would): the peer is idle by then, so it wakes.
        setTimeout(() => {
          mastra.getAgentById(peer).sendSignal(
            { type: 'notification', contents: message, attributes: { source: 'peer', from: id, hops: String(next.hops) } } as any,
            thread(peer) as any,
          );
        }, 50);
        return { sent: true };
      },
    });
    return new Agent({
      id, name: id, instructions: 'Acknowledge every notice from your peer.', memory: new MockMemory({ storage }) as any, tools: { relay_to_peer: relay },
      model: scriptedModel((_i, prompt) => {
        const last = JSON.stringify(prompt.at(-1));
        if (last.includes('tool-result')) return { text: 'ok' };
        const hops = Number(/hops=\\?"(\d+)/.exec(last)?.[1] ?? 0);
        const isNotice = last.includes('notification');
        return { toolCalls: [{ name: 'relay_to_peer', args: { message: isNotice ? 'Thanks, noted!' : 'Heads up: CI is rate limited.', hops } }] };
      }).model as any,
    });
  };
  const alice = make('alice', 'bob');
  const bob = make('bob', 'alice');
  mastra = new Mastra({ agents: { alice, bob }, storage, logger: false });
  await alice.generate('Tell bob that CI is rate limited.', { memory: { thread: 'alice-thread', resource: 'team' } } as any);
  // Let the wakes play out.
  let before = -1;
  while (before !== relays.length) { before = relays.length; await sleep(300); }
  return { relays, sent: relays.filter((r) => r.includes(' → ')).length, stopped: relays.some((r) => r.includes('✋')) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runPingPong();
  banner('Two polite agents, one relay tool each');
  r.relays.forEach((l) => console.log('  ' + l));
  console.log('  relays sent:', r.sent, '| stopped by the guard:', r.stopped);
  process.exit(0);
}
