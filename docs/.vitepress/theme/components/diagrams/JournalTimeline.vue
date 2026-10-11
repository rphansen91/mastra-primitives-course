<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 250" role="img" aria-label="Inside ctx.run: check the journal, run the effect, then write the journal. A crash between the effect and the journal write means the effect runs again on replay: the at-least-once window.">
      <ArrowDefs />
      <rect x="40" y="96" width="680" height="10" rx="5" class="f-violet outline" stroke-width="2" />
      <rect x="350" y="70" width="210" height="62" rx="10" class="c-coral" opacity="0.18" />
      <rect x="350" y="70" width="210" height="62" rx="10" fill="none" class="stroke s-coral" stroke-dasharray="6 5" />
      <text x="455" y="60" text-anchor="middle" font-size="13" class="t-strong" style="fill: var(--mpc-coral)">at-least-once window</text>
      <g v-for="(p, i) in [
        { x: 90, t: 'journal.has(key)?', s: 'yes → return saved result', c: 'sky' },
        { x: 350, t: 'fn() runs', s: 'card charged, email sent', c: 'amber' },
        { x: 560, t: 'journal.set(key)', s: 'now it is exactly-once', c: 'teal' },
      ]" :key="i">
        <circle :cx="p.x" cy="101" r="14" :class="`f-${p.c}`" class="outline" />
        <text :x="p.x" y="106" text-anchor="middle" font-size="13" class="t-strong">{{ i + 1 }}</text>
        <IllBox :x="p.x - 90" :y="150" :w="180" :h="62" :color="p.c" :title="p.t" :sub="p.s" :size="14" />
        <path :d="`M${p.x} 118 L${p.x} 146`" class="stroke" stroke-width="2" />
      </g>
      <g transform="translate(455 28)">
        <path d="M0 -14 L5 -4 L15 -8 L9 2 L17 10 L5 9 L0 18 L-5 9 L-17 10 L-9 2 L-15 -8 L-5 -4 Z" class="c-coral outline" stroke-width="2" />
      </g>
      <text x="40" y="40" font-size="14" class="t-strong">await ctx.run('charge', () =&gt; payments.charge(500))</text>
      <text x="720" y="236" text-anchor="end" font-size="12" class="t-dim">Only the receiver (an idempotency key) can close the red window.</text>
    </svg>
  </figure>
</template>
