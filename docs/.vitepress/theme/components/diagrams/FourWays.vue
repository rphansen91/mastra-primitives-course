<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 250" role="img" aria-label="Four ways agents work together. Sub-agent as a tool: a helper runs inside the parent's run. Network: a router picks a specialist each iteration. Workflow: agents are steps in a fixed graph. Signals: separate agents on separate threads send each other messages.">
      <ArrowDefs />
      <g v-for="(t, k) in ['Sub-agent as a tool', 'Agent network', 'Workflow steps', 'Signals between threads']" :key="t" :transform="`translate(${8 + k * 188} 8)`">
        <rect x="3" y="3" width="176" height="232" rx="16" class="shadow" />
        <rect x="0" y="0" width="176" height="232" rx="16" class="f-paper outline" />
        <text x="88" y="26" text-anchor="middle" font-size="13.5" class="t-strong">{{ t }}</text>
      </g>
      <!-- sub-agent -->
      <g transform="translate(8 8)">
        <rect x="16" y="42" width="144" height="150" rx="14" class="f-violet outline" />
        <text x="30" y="62" font-size="12" class="t-strong">parent run</text>
        <rect x="34" y="96" width="108" height="56" rx="10" class="f-sky outline" />
        <text x="88" y="120" text-anchor="middle" font-size="12.5" class="t-strong">researcher</text>
        <text x="88" y="138" text-anchor="middle" font-size="10.5" class="t-dim">one tool call</text>
        <text x="88" y="180" text-anchor="middle" font-size="11" class="t-dim">parent waits ⏳</text>
        <text x="88" y="218" text-anchor="middle" font-size="11" class="t-mono">delegation</text>
      </g>
      <!-- network -->
      <g transform="translate(196 8)">
        <circle cx="88" cy="110" r="28" class="f-violet outline" />
        <text x="88" y="114" text-anchor="middle" font-size="12" class="t-strong">router</text>
        <rect x="14" y="48" width="52" height="28" rx="8" class="f-sky outline" /><text x="40" y="66" text-anchor="middle" font-size="11">writer</text>
        <rect x="110" y="48" width="52" height="28" rx="8" class="f-sky outline" /><text x="136" y="66" text-anchor="middle" font-size="11">coder</text>
        <rect x="14" y="146" width="52" height="28" rx="8" class="f-sky outline" /><text x="40" y="164" text-anchor="middle" font-size="11">search</text>
        <rect x="110" y="146" width="52" height="28" rx="8" class="f-lime outline" /><text x="136" y="164" text-anchor="middle" font-size="11">workflow</text>
        <Arrow d="M68 92 L56 80" /><Arrow d="M108 92 L120 80" color="coral" :width="3.5" /><Arrow d="M68 128 L56 142" /><Arrow d="M108 128 L120 142" />
        <text x="88" y="196" text-anchor="middle" font-size="11" class="t-dim">picks one per iteration</text>
        <text x="88" y="218" text-anchor="middle" font-size="11" class="t-mono">routing</text>
      </g>
      <!-- workflow -->
      <g transform="translate(384 8)">
        <rect x="44" y="42" width="88" height="32" rx="9" class="f-teal outline" /><text x="88" y="63" text-anchor="middle" font-size="12">draft agent</text>
        <Arrow d="M88 76 L88 96" />
        <rect x="44" y="100" width="88" height="32" rx="9" class="f-teal outline" /><text x="88" y="121" text-anchor="middle" font-size="12">review agent</text>
        <Arrow d="M88 134 L88 154" />
        <rect x="44" y="158" width="88" height="32" rx="9" class="f-amber outline" /><text x="88" y="179" text-anchor="middle" font-size="12">publish</text>
        <g class="c-amber"><rect x="140" y="62" width="14" height="10" rx="3" class="c-amber outline" stroke-width="1.5" /><rect x="140" y="120" width="14" height="10" rx="3" class="c-amber outline" stroke-width="1.5" /></g>
        <text x="88" y="218" text-anchor="middle" font-size="11" class="t-mono">orchestration</text>
      </g>
      <!-- signals -->
      <g transform="translate(572 8)">
        <rect x="12" y="42" width="152" height="50" rx="12" class="f-sky outline" />
        <text x="24" y="62" font-size="11" class="t-mono t-dim">thread A</text>
        <text x="24" y="80" font-size="12" class="t-strong">coordinator</text>
        <rect x="12" y="132" width="152" height="50" rx="12" class="f-lime outline" />
        <text x="24" y="152" font-size="11" class="t-mono t-dim">thread B</text>
        <text x="24" y="170" font-size="12" class="t-strong">worker (busy)</text>
        <Arrow d="M120 94 L120 128" color="coral" :width="3" />
        <rect x="128" y="102" width="28" height="18" rx="3" class="f-amber outline" stroke-width="1.5" />
        <path d="M128 102 L142 112 L156 102" class="stroke" stroke-width="1.5" />
        <text x="60" y="116" text-anchor="middle" font-size="10.5" class="t-dim">no one waits</text>
        <text x="88" y="218" text-anchor="middle" font-size="11" class="t-mono">coordination</text>
      </g>
    </svg>
    <figcaption>Same word, "multi-agent", four different shapes. The question that separates them: what do the agents share?</figcaption>
  </figure>
</template>
