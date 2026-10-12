<script setup lang="ts">
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
    <div class="chips">
      <span class="chip"><Icon name="map" :size="15" /> Module {{ Number(module) }}</span>
      <span class="chip"><Icon name="clock" :size="15" /> ~{{ minutes }} min</span>
      <span class="chip" v-if="lab"><Icon name="flask" :size="15" /> {{ lab }}</span>
      <span class="chip" v-if="recap"><Icon name="headphones" :size="15" /> Listen-friendly recap</span>
    </div>
    <div class="grid">
      <div class="story mpc-card">
        <div class="story-head">
          <Mascot :mood="mood" :size="84" />
          <div>
            <div class="mpc-kicker">{{ scenarioTitle }}</div>
            <div class="story-body"><slot /></div>
          </div>
        </div>
      </div>
      <div class="outcomes mpc-card">
        <div class="mpc-kicker">By the end you'll be able to</div>
        <ul>
          <li v-for="(o, i) in outcomes" :key="i"><span class="tick"><Icon name="check" :size="14" /></span><span v-html="o" /></li>
        </ul>
      </div>
    </div>
    <ModuleProgress :module="module" compact />
  </section>
</template>

<style scoped>
.hero { margin: 20px 0 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: var(--fw-semibold); padding: 4px 12px; border-radius: var(--r-pill); background: var(--vp-c-bg-soft); border: 1.5px solid var(--vp-c-divider); }
.grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 18px; }
.grid .mpc-card { margin: 18px 0 0; }
.story { background: var(--mpc-amber-soft); }
.story-head { display: flex; gap: 14px; align-items: flex-start; }
.story-body :deep(p) { margin: 6px 0; font-size: var(--fs-md); line-height: 1.65; }
.outcomes { background: var(--mpc-teal-soft); }
.outcomes ul { list-style: none; padding: 0 !important; margin: 10px 0 0 !important; }
.outcomes li { display: flex; gap: 10px; margin: 8px 0 !important; line-height: 1.5 !important; font-size: var(--fs-md); }
.tick { width: 22px; height: 22px; border-radius: 50%; background: var(--mpc-teal); color: #fff; display: grid; place-items: center; flex: none; margin-top: 2px; }
@media (max-width: 760px) {
  .grid { grid-template-columns: 1fr; }
  .story-head { flex-direction: column; }
}
</style>
