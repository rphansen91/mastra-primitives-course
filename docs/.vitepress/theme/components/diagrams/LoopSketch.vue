<script setup lang="ts"></script>
<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 720 360" role="img" aria-label="The agent loop: ask the model, if it wants tools run them, fold the results back into the messages, repeat. If there are no tool calls, return the answer.">
      <ArrowDefs />
      <path d="M210 70 Q360 10 510 70" class="stroke" stroke-width="3" marker-end="url(#ill-arrow)" />
      <path d="M560 150 Q610 200 560 250" class="stroke" stroke-width="3" marker-end="url(#ill-arrow)" />
      <path d="M510 300 Q360 350 210 300" class="stroke" stroke-width="3" marker-end="url(#ill-arrow)" />
      <path d="M160 250 Q110 200 160 150" class="stroke" stroke-width="3" marker-end="url(#ill-arrow)" />
      <IllBox :x="80" :y="70" :w="170" :h="80" color="amber" title="1. Ask the model" sub="messages + tool specs" />
      <IllBox :x="470" :y="70" :w="170" :h="80" color="violet" title="2. Tool calls?" sub="no → return the text" />
      <IllBox :x="470" :y="220" :w="170" :h="80" color="teal" title="3. Run the tools" sub="errors become data" />
      <IllBox :x="80" :y="220" :w="170" :h="80" color="lime" title="4. Fold results back" sub="in call order" />
      <path d="M640 110 L700 110 L700 30" class="stroke s-coral" stroke-width="3" stroke-dasharray="6 6" marker-end="url(#ill-arrow)" />
      <text x="700" y="22" text-anchor="end" font-size="13" class="t-strong" style="fill: var(--mpc-coral)">no tool calls → answer</text>
      <text x="360" y="32" text-anchor="middle" font-size="12.5" class="t-dim">turn</text>
      <text x="360" y="352" text-anchor="middle" font-size="12.5" class="t-dim">step + 1 (until maxSteps or stopWhen)</text>
      <text x="360" y="196" text-anchor="middle" font-size="22" class="t-strong" style="fill: var(--mod-accent)">the loop</text>
    </svg>
    <figcaption>Everything an agent framework does is a hardening of this loop.</figcaption>
  </figure>
</template>
