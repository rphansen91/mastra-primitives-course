<script setup lang="ts">
/**
 * Loopy, the course mascot: a small robot whose antenna is a loop arrow
 * (because everything in this course is a loop, eventually).
 */
const props = withDefaults(defineProps<{ mood?: 'happy' | 'thinking' | 'alarmed' | 'sleepy' | 'cheer'; size?: number; label?: string }>(), {
  mood: 'happy',
  size: 96,
});
const aria = props.label ?? `Loopy the robot, looking ${props.mood}`;
</script>

<template>
  <svg class="ill mascot" :class="`mood-${mood}`" :width="size" :height="size" viewBox="0 0 120 120" role="img" :aria-label="aria">
    <!-- antenna loop -->
    <line x1="60" y1="30" x2="60" y2="19" class="stroke" />
    <path d="M66 10 A7 7 0 1 1 60 4" class="stroke s-violet" stroke-width="3" />
    <path d="M58 1 L61 4.5 L57 7" class="stroke s-violet" stroke-width="3" />
    <!-- arms -->
    <g v-if="mood === 'cheer'">
      <path d="M24 66 Q12 50 16 36" class="stroke" />
      <path d="M96 66 Q108 50 104 36" class="stroke" />
      <circle cx="16" cy="34" r="4.5" class="c-amber outline" stroke-width="2" />
      <circle cx="104" cy="34" r="4.5" class="c-amber outline" stroke-width="2" />
    </g>
    <g v-else>
      <path d="M23 74 Q12 80 14 92" class="stroke" />
      <path d="M97 74 Q108 80 106 92" class="stroke" />
    </g>
    <!-- body shadow + body -->
    <ellipse cx="63" cy="74" rx="40" ry="38" class="shadow" opacity="0.9" />
    <ellipse cx="60" cy="71" rx="40" ry="38" class="f-teal outline" />
    <!-- face screen -->
    <rect x="31" y="50" width="58" height="38" rx="16" class="f-paper outline" />
    <!-- cheeks -->
    <circle cx="38" cy="78" r="4" class="c-coral" opacity="0.55" />
    <circle cx="82" cy="78" r="4" class="c-coral" opacity="0.55" />
    <!-- eyes + mouth per mood -->
    <g v-if="mood === 'happy' || mood === 'cheer'">
      <path d="M44 67 Q48 61 52 67" class="stroke" stroke-width="3" />
      <path d="M68 67 Q72 61 76 67" class="stroke" stroke-width="3" />
      <path d="M52 76 Q60 83 68 76" class="stroke" stroke-width="3" />
    </g>
    <g v-else-if="mood === 'thinking'">
      <circle cx="50" cy="64" r="3.4" class="f-ink" />
      <circle cx="74" cy="64" r="3.4" class="f-ink" />
      <path d="M54 79 L66 77" class="stroke" stroke-width="3" />
      <text x="96" y="36" font-size="22" class="t-strong" style="fill: var(--mpc-violet)">?</text>
    </g>
    <g v-else-if="mood === 'alarmed'">
      <circle cx="48" cy="66" r="5.5" class="f-paper outline" stroke-width="2.5" />
      <circle cx="72" cy="66" r="5.5" class="f-paper outline" stroke-width="2.5" />
      <circle cx="48" cy="66" r="2" class="f-ink" />
      <circle cx="72" cy="66" r="2" class="f-ink" />
      <ellipse cx="60" cy="80" rx="4" ry="4.5" class="f-ink" />
      <path d="M95 46 Q99 54 95 57 Q91 54 95 46 Z" class="c-sky outline" stroke-width="1.5" />
    </g>
    <g v-else>
      <path d="M44 66 L52 66" class="stroke" stroke-width="3" />
      <path d="M68 66 L76 66" class="stroke" stroke-width="3" />
      <path d="M56 78 Q60 80 64 78" class="stroke" stroke-width="2.5" />
      <text x="92" y="38" font-size="15" class="t-strong t-dim">z</text>
      <text x="101" y="27" font-size="11" class="t-strong t-dim">z</text>
    </g>
  </svg>
</template>

<style scoped>
.mascot { flex: none; overflow: visible; }
@media (prefers-reduced-motion: no-preference) {
  .mood-cheer { animation: bob 1.6s ease-in-out infinite; }
  .mood-thinking { animation: tilt 3s ease-in-out infinite; transform-origin: 50% 80%; }
}
@keyframes bob { 50% { transform: translateY(-3px); } }
@keyframes tilt { 50% { transform: rotate(-4deg); } }
</style>
