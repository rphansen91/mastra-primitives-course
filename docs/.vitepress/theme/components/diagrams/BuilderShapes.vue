<script setup lang="ts">
// Module 5: each builder method appends a node shape to a serializable step graph.
const W = 140;
const panels = ['.then(a).then(b)', '.parallel([a, b])', '.branch([[c, a], …])', '.foreach(a, { concurrency })', '.dowhile(a, cond)'];
</script>
<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 210" role="img" aria-label="Five workflow builder shapes. then: a sequence of steps. parallel: fan out to two steps and join. branch: a condition picks one step. foreach: the same step over each array item. dowhile: repeat a step while a condition holds; the agent loop is built this way.">
      <ArrowDefs />
      <g v-for="(p, i) in panels" :key="p" :transform="`translate(${10 + i * (W + 12)} 10)`">
        <rect x="3" y="3" :width="W" height="186" rx="16" class="shadow" />
        <rect x="0" y="0" :width="W" height="186" rx="16" class="f-paper outline" />
        <text :x="W / 2" y="174" text-anchor="middle" font-size="11" class="t-mono t-strong">{{ p }}</text>
      </g>
      <!-- then -->
      <g transform="translate(10 10)">
        <rect x="45" y="22" width="50" height="34" rx="9" class="f-sky outline" /><text x="70" y="44" text-anchor="middle" font-size="13" class="t-strong">a</text>
        <Arrow d="M70 58 L70 86" />
        <rect x="45" y="90" width="50" height="34" rx="9" class="f-sky outline" /><text x="70" y="112" text-anchor="middle" font-size="13" class="t-strong">b</text>
      </g>
      <!-- parallel -->
      <g transform="translate(162 10)">
        <circle cx="70" cy="26" r="7" class="f-ink" />
        <Arrow d="M64 32 L38 58" /><Arrow d="M76 32 L102 58" />
        <rect x="14" y="62" width="46" height="32" rx="9" class="f-teal outline" /><text x="37" y="83" text-anchor="middle" font-size="13" class="t-strong">a</text>
        <rect x="80" y="62" width="46" height="32" rx="9" class="f-teal outline" /><text x="103" y="83" text-anchor="middle" font-size="13" class="t-strong">b</text>
        <Arrow d="M37 96 L64 124" /><Arrow d="M103 96 L76 124" />
        <circle cx="70" cy="132" r="7" class="f-ink" /><text x="70" y="156" text-anchor="middle" font-size="11" class="t-dim">join</text>
      </g>
      <!-- branch -->
      <g transform="translate(314 10)">
        <path d="M70 18 L100 46 L70 74 L40 46 Z" class="f-amber outline" /><text x="70" y="51" text-anchor="middle" font-size="13" class="t-strong">c?</text>
        <Arrow d="M48 62 L32 96" /><Arrow d="M92 62 L108 96" />
        <rect x="8" y="100" width="46" height="32" rx="9" class="f-amber outline" /><text x="31" y="121" text-anchor="middle" font-size="13" class="t-strong">a</text>
        <rect x="86" y="100" width="46" height="32" rx="9" class="f-paper outline" stroke-dasharray="4 4" /><text x="109" y="121" text-anchor="middle" font-size="13" class="t-dim">b</text>
      </g>
      <!-- foreach -->
      <g transform="translate(466 10)">
        <rect x="52" y="20" width="56" height="30" rx="8" class="f-violet outline" transform="translate(8 8)" />
        <rect x="44" y="28" width="56" height="30" rx="8" class="f-violet outline" transform="translate(8 8)" />
        <rect x="36" y="36" width="56" height="30" rx="8" class="f-violet outline" transform="translate(8 8)" />
        <text x="72" y="64" text-anchor="middle" font-size="13" class="t-strong">a(item)</text>
        <text x="70" y="112" text-anchor="middle" font-size="11.5" class="t-dim">one step per</text>
        <text x="70" y="127" text-anchor="middle" font-size="11.5" class="t-dim">array item</text>
      </g>
      <!-- dowhile -->
      <g transform="translate(618 10)">
        <rect x="40" y="40" width="60" height="38" rx="10" class="f-coral outline" /><text x="70" y="64" text-anchor="middle" font-size="13" class="t-strong">a</text>
        <path d="M102 60 C134 60 134 118 70 118 C14 118 10 70 36 62" class="stroke s-coral" stroke-width="3" marker-end="url(#ill-arrow)" />
        <text x="70" y="140" text-anchor="middle" font-size="11.5" class="t-dim">while cond holds</text>
        <text x="70" y="155" text-anchor="middle" font-size="11" class="t-strong" style="fill: var(--mpc-coral)">← the agent loop</text>
      </g>
    </svg>
    <figcaption>Every builder call appends a node to a graph that's plain data: you can serialize it, snapshot it, draw it, and run it on another engine.</figcaption>
  </figure>
</template>
