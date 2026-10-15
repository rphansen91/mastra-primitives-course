<script setup lang="ts">
function listen() { window.dispatchEvent(new CustomEvent('mpc-listen')); }
withDefaults(
  defineProps<{
    module: string;
    minutes: number;
    outcomes: string[];
    mood?: 'happy' | 'thinking' | 'alarmed' | 'sleepy' | 'cheer';
    scenarioTitle?: string;
    lab?: string;
    recap?: boolean;
  }>(),
  { mood: 'alarmed', scenarioTitle: 'The scenario', recap: true },
);
</script>

<template>
  <section class="hero" aria-label="Lesson overview">
    <p class="meta">
      <span class="mod"><ModuleArt :module="module" :size="22" /> Module {{ Number(module) }}</span>
      <span><Icon name="clock" :size="14" /> ~{{ minutes }} min</span>
      <span v-if="lab"><Icon name="flask" :size="14" /> {{ lab }}</span>
      <a v-if="recap" class="listen" href="#listen" data-listen-link aria-label="Listen to the lesson recap (jumps to the player)" @click.prevent="listen"><Icon name="headphones" :size="14" /> Listen</a>
    </p>
    <div class="grid">
      <div class="story">
        <div class="mpc-kicker">{{ scenarioTitle }}</div>
        <div class="story-body"><slot /></div>
      </div>
      <div class="outcomes">
        <div class="mpc-kicker">By the end you'll be able to</div>
        <ul>
          <li v-for="(o, i) in outcomes" :key="i"><span class="tick" aria-hidden="true"><Icon name="check" :size="12" /></span><span v-html="o" /></li>
        </ul>
      </div>
    </div>
    <ModuleProgress :module="module" compact />
  </section>
</template>

<style scoped>
.hero { margin: 12px 0 8px; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 0; margin: 0 0 20px !important; font-size: var(--fs-sm); color: var(--vp-c-text-2); }
.meta span { display: inline-flex; align-items: center; gap: 5px; }
.meta span + a.listen::before, .meta span + span::before { content: '·'; margin: 0 10px; color: var(--vp-c-text-3); }
.meta :deep(svg.mpc-icon) { color: var(--vp-c-text-3); }
.meta .listen { display: inline-flex; align-items: center; gap: 5px; font-weight: var(--fw-semibold); color: var(--mod-accent); text-decoration: underline; text-underline-offset: 3px; min-height: 28px; cursor: pointer; }
.meta .listen:hover { text-decoration-thickness: 2px; }
.meta .mod { font-weight: var(--fw-semibold); color: var(--mod-accent); }
.grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px; }
.story, .outcomes { border-radius: var(--r-lg); padding: 16px 20px; }
.story { background: var(--mpc-surface-2); border: 1px solid var(--mpc-line); }
.story .mpc-kicker { color: var(--mpc-danger-ink); }
.story-body :deep(p) { margin: 8px 0; font-size: var(--fs-md); line-height: 1.65; }
.story-body :deep(> :last-child) { margin-bottom: 0; }
.outcomes { border: 1px solid var(--mpc-line); }
.outcomes .mpc-kicker { color: var(--mod-accent); }
.outcomes ul { list-style: none; padding: 0 !important; margin: 8px 0 0 !important; }
.outcomes li { display: flex; gap: 10px; margin: 8px 0 !important; line-height: 1.5 !important; font-size: var(--fs-md); }
.tick { width: 18px; height: 18px; border-radius: 50%; background: var(--mod-accent); color: #fff; display: grid; place-items: center; flex: none; margin-top: 3px; }
.dark .tick { color: #14112b; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .meta { gap: 4px 14px; } .meta span + a.listen::before, .meta span + span::before { content: none; } }
</style>
