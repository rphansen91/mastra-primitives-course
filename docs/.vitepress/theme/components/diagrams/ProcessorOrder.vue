<template>
  <figure class="mpc-figure">
    <svg class="ill" viewBox="0 0 760 250" role="img" aria-label="Input processors A then B run in array order on the messages. Output stream processors X then Y run on every chunk: the model streams hi, X makes it hi[X], Y makes it hi[X][Y].">
      <ArrowDefs />
      <IllBox :x="10" :y="40" :w="110" :h="56" color="sky" title="user msg" :size="14" />
      <IllBox :x="150" :y="40" :w="90" :h="56" color="violet" title="A" sub="processInput" />
      <IllBox :x="260" :y="40" :w="90" :h="56" color="violet" title="B" sub="processInput" />
      <IllBox :x="380" :y="30" :w="120" :h="76" color="amber" title="model" sub="streams “hi”" :size="17" />
      <IllBox :x="530" :y="40" :w="90" :h="56" color="coral" title="X" sub="per chunk" />
      <IllBox :x="640" :y="40" :w="90" :h="56" color="coral" title="Y" sub="per chunk" />
      <Arrow d="M124 68 L146 68" />
      <Arrow d="M244 68 L256 68" />
      <Arrow d="M354 68 L376 68" />
      <Arrow d="M504 68 L526 68" />
      <Arrow d="M624 68 L636 68" />
      <g font-size="14" class="t-mono">
        <text x="440" y="150" text-anchor="middle" class="t-mono">"hi"</text>
        <text x="575" y="150" text-anchor="middle" class="t-mono">"hi[X]"</text>
        <text x="685" y="150" text-anchor="middle" class="t-mono">"hi[X][Y]"</text>
      </g>
      <path d="M440 112 L440 132 M575 102 L575 132 M685 102 L685 132" class="stroke" stroke-width="1.8" stroke-dasharray="3 4" />
      <text x="380" y="200" text-anchor="middle" font-size="14">Array order, every time. Each processor sees the previous one's output.</text>
      <text x="380" y="224" text-anchor="middle" font-size="12.5" class="t-dim">Verified in Lab 3 on @mastra/core 1.75.0 through 1.77.0: final text “hi[X][Y]”.</text>
    </svg>
  </figure>
</template>
