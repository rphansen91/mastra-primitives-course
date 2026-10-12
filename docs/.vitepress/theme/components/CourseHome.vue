<script setup lang="ts">
/** Landing page: hero, stats strip, outcomes and curriculum with live progress. */
import { computed, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { MODULES, PAGE_LABEL, pageLink, TOTAL_MINUTES, VERIFIED } from '../modules';
import { data as labs } from '../labs.data';
import { COURSE_PAGES, continueTarget, courseDone, isRead, last, loadCourse, moduleDone } from '../course';
import { progress } from '../progress';

const hours = Math.round(TOTAL_MINUTES / 30) / 2;
const groups = (['Foundations', 'Primitives', 'Capstone'] as const).map((g) => ({ g, mods: MODULES.filter((m) => m.group === g) }));
const mounted = ref(false);
onMounted(() => { loadCourse(); mounted.value = true; });
const started = computed(() => mounted.value && progress.loaded && (courseDone() > 0 || !!last.link));
const target = computed(() => (started.value ? continueTarget() : null));
const doneAll = computed(() => mounted.value && courseDone() === COURSE_PAGES.length);
const pct = computed(() => (mounted.value ? Math.round((100 * courseDone()) / COURSE_PAGES.length) : 0));
const modPct = (m: (typeof MODULES)[number]) => (mounted.value ? Math.round((100 * moduleDone(m)) / m.pages.length) : 0);
const OUTCOMES = [
  ['02', 'Trace a run from <code>agent.stream()</code> to <code>finish</code> and name every hook it passes.'],
  ['03', 'Put redaction, guardrails, budgets and retries in the right processor hook.'],
  ['04', 'Predict what memory sends to the model on each request, and what quietly falls out.'],
  ['05', 'Suspend a workflow on one machine and resume it on another.'],
  ['07', 'Say exactly what survives a <code>kill -9</code> and what does not, as of 1.76.'],
  ['10', 'Design a new primitive: a failing test, prior art, and an RFC.'],
] as const;
</script>

<template>
  <div class="ch">
    <section class="hero" aria-labelledby="ch-title">
      <div class="copy">
        <p class="kicker">A source-level course · free · runnable labs, no API keys</p>
        <h1 id="ch-title">Mastra Primitives</h1>
        <p class="sub">Understand the core. Then build the next primitive.</p>
        <p class="tag">The agent loop, processors, memory, workflows, signals, durability and multi-agent coordination in the open-source Mastra framework, read from real source at a pinned commit.</p>
        <div class="cta">
          <a v-if="target" class="mpc-btn primary lg" :href="withBase(target.link)" data-continue>
            <Icon name="play" :size="15" /> Continue: {{ target.label }}
          </a>
          <a v-else-if="doneAll" class="mpc-btn primary lg" :href="withBase('/certificate')"><Icon name="star" :size="15" /> Get your certificate</a>
          <a v-else class="mpc-btn primary lg" :href="withBase('/guide/method')"><Icon name="play" :size="15" /> Start the course</a>
          <a class="mpc-btn lg" :href="withBase('/m00/')">Module 0: setup</a>
          <a class="link" :href="withBase('/cheatsheet')">Cheat sheet <Icon name="next" :size="13" /></a>
        </div>
        <p v-if="started" class="resume" data-course-progress>
          <span class="bar" aria-hidden="true"><span :style="{ width: pct + '%' }" /></span>
          {{ courseDone() }} of {{ COURSE_PAGES.length }} pages done
        </p>
      </div>
      <LoopMini />
    </section>

    <dl class="stats" aria-label="Course at a glance">
      <div><dt>Modules</dt><dd>{{ MODULES.length }}</dd><span>setup to capstone</span></div>
      <div><dt>Lesson time</dt><dd>~{{ hours }} h</dd><span>from module estimates</span></div>
      <div><dt>Labs</dt><dd>{{ labs.labs }}</dd><span>{{ labs.tests }} tests, green in CI</span></div>
      <div><dt>Verified on</dt><dd class="v"><code>@mastra/core@{{ VERIFIED.core }}</code></dd><span>source pinned to {{ VERIFIED.sha.slice(0, 7) }}</span></div>
    </dl>

    <section class="sec" aria-labelledby="ch-out">
      <h2 id="ch-out">What you'll be able to do</h2>
      <ul class="outcomes">
        <li v-for="[m, t] in OUTCOMES" :key="m" :class="`mod-${m}`">
          <ModuleArt :module="m" :size="28" />
          <span v-html="t" />
        </li>
      </ul>
    </section>

    <section class="sec" aria-labelledby="ch-cur">
      <h2 id="ch-cur">Curriculum</h2>
      <div v-for="grp in groups" :key="grp.g" class="grp">
        <h3>{{ grp.g }}</h3>
        <ol class="cards">
          <li v-for="m in grp.mods" :key="m.n" :class="['card', `mod-${m.n}`, { done: modPct(m) === 100 }]">
            <a :href="withBase(pageLink(m.n, 'lesson'))" class="hit">
              <span class="art"><ModuleArt :module="m.n" :size="34" /></span>
              <span class="num">Module {{ Number(m.n) }} · {{ m.minutes }} min</span>
              <span class="t">{{ m.title }}</span>
              <span class="hook">{{ m.hook }}</span>
            </a>
            <div class="foot">
              <span class="pages">
                <a v-for="k in m.pages" :key="k" :href="withBase(pageLink(m.n, k))" :class="{ read: mounted && isRead(pageLink(m.n, k)) }">
                  <Icon v-if="mounted && isRead(pageLink(m.n, k))" name="check" :size="11" />{{ PAGE_LABEL[k] }}
                </a>
              </span>
              <span class="mbar" role="img" :aria-label="`${modPct(m)}% done`"><span :style="{ width: modPct(m) + '%' }" /></span>
            </div>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ch { --pad: 24px; }
.hero { display: grid; grid-template-columns: 1.05fr 1fr; gap: 40px; align-items: center; padding: 56px 0 40px; }
.kicker { font-size: var(--fs-sm); font-weight: var(--fw-medium); color: var(--vp-c-text-2); margin: 0 0 14px; }
h1 { font-size: 48px; line-height: 1.05; letter-spacing: -0.035em; font-weight: var(--fw-semibold); margin: 0; }
.sub { font-size: var(--fs-h2); line-height: 1.25; letter-spacing: -0.015em; font-weight: var(--fw-medium); margin: 10px 0 0; color: var(--vp-c-brand-1); }
.tag { font-size: var(--fs-body); line-height: 1.6; color: var(--vp-c-text-2); margin: 16px 0 0; max-width: 34em; }
.cta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin-top: 26px; }
.mpc-btn.lg { font-size: var(--fs-md); padding: 9px 18px; text-decoration: none; }
.link { display: inline-flex; align-items: center; gap: 4px; font-weight: var(--fw-medium); font-size: var(--fs-md); color: var(--vp-c-text-1); text-decoration: none; }
.link:hover { color: var(--vp-c-brand-1); }
.resume { display: flex; align-items: center; gap: 10px; margin: 14px 0 0; font-size: var(--fs-sm); color: var(--vp-c-text-2); }
.bar, .mbar { position: relative; display: inline-block; height: 6px; border-radius: var(--r-pill); background: var(--mpc-surface-3); overflow: hidden; }
.bar { width: 140px; }
.bar > span, .mbar > span { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--vp-c-brand-1); transition: width 0.4s var(--mpc-ease); }
.mbar > span { background: var(--mod-accent); }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; border-top: 1px solid var(--mpc-line); border-bottom: 1px solid var(--mpc-line); }
.stats > div { padding: 18px 20px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.stats > div + div { border-left: 1px solid var(--mpc-line); }
dt { order: 1; font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-2); }
dd { order: 2; margin: 2px 0 0; font-size: var(--fs-h2); font-weight: var(--fw-semibold); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
dd.v { font-size: var(--fs-md); padding-top: 8px; }
dd.v code { font-size: inherit; overflow-wrap: anywhere; }
.stats span { order: 3; font-size: var(--fs-sm); color: var(--vp-c-text-2); }

.sec { padding: 48px 0 0; }
h2 { font-size: var(--fs-h2); letter-spacing: -0.02em; font-weight: var(--fw-semibold); margin: 0 0 18px; }
h3 { font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-2); margin: 26px 0 10px; }
.outcomes { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 28px; }
.outcomes li { display: flex; gap: 12px; align-items: flex-start; font-size: var(--fs-md); line-height: 1.55; }
.outcomes :deep(code), .hook :deep(code) { font-family: var(--vp-font-family-mono); font-size: 0.88em; padding: 1px 5px; border-radius: 5px; background: var(--mpc-surface-2); border: 1px solid var(--mpc-line); }

.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.card { position: relative; display: flex; flex-direction: column; border: 1px solid var(--mpc-line); border-radius: var(--r-lg); background: var(--vp-c-bg); box-shadow: var(--mpc-shadow-1); transition: border-color var(--mpc-dur) var(--mpc-ease), box-shadow var(--mpc-dur) var(--mpc-ease), transform var(--mpc-dur) var(--mpc-ease); }
.card:hover { border-color: var(--mod-accent); box-shadow: var(--mpc-shadow-2); transform: translateY(-1px); }
.card::before { content: ''; position: absolute; left: 16px; right: 16px; top: -1px; height: 2px; border-radius: 2px; background: var(--mod-accent); }
.hit { display: flex; flex-direction: column; gap: 4px; padding: 16px 16px 10px; color: inherit; text-decoration: none; flex: 1; }
.hit:focus-visible { outline: 2px solid var(--mod-accent); outline-offset: 2px; border-radius: var(--r-lg); }
.art { width: 44px; height: 44px; border-radius: var(--r-md); background: var(--mod-tint); display: grid; place-items: center; margin-bottom: 8px; }
.num { font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--mod-accent); letter-spacing: 0.02em; }
.t { font-size: var(--fs-body); font-weight: var(--fw-semibold); line-height: 1.3; letter-spacing: -0.01em; }
.hook { font-size: var(--fs-sm); line-height: 1.5; color: var(--vp-c-text-2); }
.foot { display: flex; flex-direction: column; gap: 10px; padding: 0 16px 14px; }
.pages { display: flex; flex-wrap: wrap; gap: 6px; }
.pages a { display: inline-flex; align-items: center; gap: 3px; font-size: var(--fs-xs); font-weight: var(--fw-medium); padding: 2px 8px; border-radius: var(--r-pill); border: 1px solid var(--mpc-line); color: var(--vp-c-text-2); text-decoration: none; }
.pages a:hover { color: var(--vp-c-text-1); border-color: var(--mpc-line-strong); }
.pages a.read { color: var(--mod-accent); border-color: color-mix(in srgb, var(--mod-accent) 45%, var(--vp-c-bg)); }
.mbar { width: 100%; height: 4px; }

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; gap: 28px; padding-top: 36px; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stats > div:nth-child(3) { border-left: 0; }
  .stats > div:nth-child(n + 3) { border-top: 1px solid var(--mpc-line); }
  .outcomes { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  h1 { font-size: 38px; }
  .sub { font-size: var(--fs-h3); }
  .outcomes { grid-template-columns: 1fr; }
  .stats > div { padding: 14px 12px; }
  dd { font-size: var(--fs-h3); }
}
</style>
