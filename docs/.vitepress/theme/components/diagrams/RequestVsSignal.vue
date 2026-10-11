<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 270" role="img" aria-label="Left: a request is a phone call, the caller waits for one answer. Right: a signal is a letter in a mailbox, the sender leaves and the receiver reads it at a safe point.">
      <ArrowDefs />
      <IllBox :x="10" :y="10" :w="360" :h="250" color="sky" :r="20" />
      <IllBox :x="390" :y="10" :w="360" :h="250" color="amber" :r="20" />
      <text x="190" y="44" text-anchor="middle" font-size="18" class="t-strong">Request = a phone call</text>
      <text x="570" y="44" text-anchor="middle" font-size="18" class="t-strong">Signal = a letter in a mailbox</text>
      <!-- phone side -->
      <IllBox :x="34" :y="80" :w="110" :h="64" color="paper" title="Caller" sub="waits…" />
      <IllBox :x="236" :y="80" :w="110" :h="64" color="paper" title="Agent" sub="answers now" />
      <path d="M148 100 L230 100" class="stroke" marker-end="url(#ill-arrow)" />
      <path d="M232 126 L152 126" class="stroke" marker-end="url(#ill-arrow)" />
      <text x="190" y="94" text-anchor="middle" font-size="11.5" class="t-mono">generate()</text>
      <text x="190" y="142" text-anchor="middle" font-size="11.5" class="t-mono">reply</text>
      <text x="190" y="186" text-anchor="middle" font-size="13.5">One answer per request.</text>
      <text x="190" y="208" text-anchor="middle" font-size="13.5">Busy? Queue a new run or say no.</text>
      <text x="190" y="230" text-anchor="middle" font-size="13.5">Failure? The caller retries.</text>
      <!-- mailbox side -->
      <IllBox :x="414" :y="80" :w="100" :h="64" color="paper" title="CI" sub="drops & leaves" />
      <g transform="translate(560 72)">
        <rect x="0" y="16" width="62" height="44" rx="12" class="c-coral outline" />
        <rect x="26" y="60" width="10" height="26" class="f-ink" />
        <rect x="8" y="24" width="30" height="18" rx="3" class="f-paper outline" stroke-width="2" />
        <path d="M8 25 L23 35 L38 25" class="stroke" stroke-width="2" />
        <path d="M62 30 L74 30 L74 10" class="stroke" stroke-width="2.5" />
        <rect x="70" y="4" width="16" height="10" class="c-amber outline" stroke-width="2" />
      </g>
      <IllBox :x="660" :y="80" :w="74" :h="64" color="paper" title="Agent" sub="reads later" :size="13" />
      <path d="M518 104 L556 104" class="stroke" marker-end="url(#ill-arrow)" />
      <path d="M642 104 L656 104" class="stroke" stroke-dasharray="4 4" marker-end="url(#ill-arrow)" />
      <text x="570" y="186" text-anchor="middle" font-size="13.5">Nobody waits. Read at the next safe point.</text>
      <text x="570" y="208" text-anchor="middle" font-size="13.5">Busy? Deliver into the running loop.</text>
      <text x="570" y="230" text-anchor="middle" font-size="13.5">Idle? Wake it, or just keep the letter.</text>
    </svg>
  </figure>
</template>
