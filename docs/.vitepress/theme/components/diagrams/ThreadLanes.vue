<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 300" role="img" aria-label="Same thread: two stream calls wait in one lane; the second starts after the first finishes and sees its history. Different threads: two lanes run at the same time.">
      <ArrowDefs />
      <text x="20" y="34" font-size="17" class="t-strong">Same thread → one lane</text>
      <text x="400" y="34" font-size="17" class="t-strong">Different threads → two lanes</text>
      <!-- left lane -->
      <rect x="20" y="56" width="340" height="96" rx="16" class="f-violet outline" />
      <text x="34" y="78" font-size="12" class="t-mono t-dim">thread "support-42"</text>
      <IllBox :x="34" :y="88" :w="150" :h="48" color="amber" title="run 1: “first”" sub="0 → 300 ms" :size="13.5" />
      <IllBox :x="196" :y="88" :w="150" :h="48" color="teal" title="run 2: “second”" sub="300 → 600 ms" :size="13.5" />
      <path d="M110 172 L110 150" class="stroke" marker-end="url(#ill-arrow)" />
      <path d="M272 192 L272 150" class="stroke" stroke-dasharray="5 5" marker-end="url(#ill-arrow)" />
      <text x="110" y="190" text-anchor="middle" font-size="12.5" class="t-mono">stream() t=0</text>
      <text x="272" y="210" text-anchor="middle" font-size="12.5" class="t-mono">stream() t=10ms</text>
      <text x="272" y="228" text-anchor="middle" font-size="12" class="t-dim">waits, then sees answer 1</text>
      <!-- right lanes -->
      <rect x="400" y="56" width="340" height="60" rx="14" class="f-sky outline" />
      <rect x="400" y="126" width="340" height="60" rx="14" class="f-sky outline" />
      <text x="414" y="74" font-size="12" class="t-mono t-dim">thread A</text>
      <text x="414" y="144" font-size="12" class="t-mono t-dim">thread B</text>
      <IllBox :x="470" :y="66" :w="170" :h="40" color="amber" title="run 1" :size="13.5" />
      <IllBox :x="484" :y="136" :w="170" :h="40" color="teal" title="run 2 (overlaps)" :size="13.5" />
      <text x="570" y="214" text-anchor="middle" font-size="12.5" class="t-dim">no shared transcript, no waiting</text>
      <text x="380" y="270" text-anchor="middle" font-size="13.5">One active run per (resource, thread). Per process, unless you configure a distributed PubSub.</text>
    </svg>
  </figure>
</template>
