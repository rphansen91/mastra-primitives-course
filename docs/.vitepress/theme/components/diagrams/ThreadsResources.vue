<script setup lang="ts">
// Module 4: resource = the user, thread = one conversation. Working memory can span the resource.
const lanes = [
  { y: 92, name: 'thread: web-chat', msgs: 7, color: 'amber' },
  { y: 152, name: 'thread: mobile', msgs: 4, color: 'amber' },
  { y: 212, name: 'thread: inbox (signals)', msgs: 5, color: 'coral' },
];
</script>
<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 300" role="img" aria-label="One resource, user-1, holds three threads: web chat, mobile, and a signals inbox. Each thread has its own message history and at most one active run. Resource-scoped working memory spans all three threads.">
      <rect x="18" y="18" width="724" height="262" rx="22" class="shadow" transform="translate(5 5)" />
      <rect x="18" y="18" width="724" height="262" rx="22" class="f-paper outline" />
      <text x="40" y="46" font-size="15" class="t-strong t-mono">resource: user-1</text>
      <text x="40" y="66" font-size="12" class="t-dim">usually the user or tenant</text>
      <rect x="440" y="34" width="286" height="40" rx="12" class="f-lime outline" />
      <text x="583" y="59" text-anchor="middle" font-size="13" class="t-strong">working memory (scope: 'resource')</text>
      <path d="M583 76 L583 262" class="stroke s-teal" stroke-width="3" stroke-dasharray="2 6" />
      <g v-for="l in lanes" :key="l.name">
        <rect x="40" :y="l.y" width="680" height="46" rx="12" :class="`f-${l.color}`" class="outline" />
        <text x="56" :y="l.y + 28" font-size="13" class="t-strong t-mono">{{ l.name }}</text>
        <g v-for="k in l.msgs" :key="k">
          <rect :x="240 + k * 26" :y="l.y + 12" width="18" height="22" :rx="k % 2 ? 4 : 10" class="f-paper outline" stroke-width="2" />
        </g>
        <circle cx="583" :cy="l.y + 23" r="7" class="c-teal outline" stroke-width="2" />
        <text x="604" :y="l.y + 28" font-size="12" class="t-dim">≤ 1 active run</text>
      </g>
      <text x="380" y="274" text-anchor="middle" font-size="12.5" class="t-dim">The thread is the unit of history, of concurrency (Module 2) and the address for signals (Module 6).</text>
    </svg>
    <figcaption>Same key, three jobs. That's on purpose.</figcaption>
  </figure>
</template>
