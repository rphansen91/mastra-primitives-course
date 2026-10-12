<script setup lang="ts">
/**
 * Mounted once in the layout. On doc pages it draws the sticky reading-progress bar, marks a
 * course page done when you reach its end, remembers it for "Continue", and ticks finished
 * pages (and fully finished modules) in the sidebar.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, useRoute, withBase } from 'vitepress';
import { COURSE_PAGES, isRead, loadCourse, markRead, rememberPage } from '../course';
import { progress } from '../progress';

const route = useRoute();
const { frontmatter, page } = useData();
const frac = ref(0);
const show = ref(false);
let raf = 0;
let io: IntersectionObserver | undefined;

const linkNow = () => '/' + page.value.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');

function measure() {
  raf = 0;
  const el = document.documentElement;
  const max = el.scrollHeight - window.innerHeight;
  frac.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
}
const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };

function syncSidebar() {
  const base = withBase('/').replace(/\/$/, '');
  for (const a of document.querySelectorAll<HTMLAnchorElement>('.VPSidebar a.VPLink, .VPSidebar a.link')) {
    const href = (a.getAttribute('href') || '').replace(base, '').replace(/\.html$/, '').replace(/#.*$/, '') || '/';
    const on = COURSE_PAGES.some((p) => p.link === href) && isRead(href);
    if (on) a.setAttribute('data-read', ''); else a.removeAttribute('data-read');
  }
  for (const grp of document.querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem.level-1')) {
    const links = [...grp.querySelectorAll<HTMLAnchorElement>('.items a')];
    const all = links.length > 0 && links.every((a) => a.hasAttribute('data-read'));
    if (all) grp.setAttribute('data-complete', ''); else grp.removeAttribute('data-complete');
  }
}

function watchEnd() {
  io?.disconnect();
  const isDoc = (frontmatter.value.layout ?? 'doc') === 'doc';
  show.value = isDoc;
  if (!isDoc) return;
  const link = linkNow();
  rememberPage(link);
  const end = document.querySelector('.mpc-doc-note') || document.querySelector('.VPDocFooter');
  if (!end) return;
  io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { markRead(link); io?.disconnect(); } }, { rootMargin: '0px 0px 80px 0px' });
  io.observe(end);
}

async function onRoute() {
  await nextTick();
  setTimeout(() => { watchEnd(); syncSidebar(); measure(); }, 60);
}
onMounted(() => {
  loadCourse();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onRoute();
});
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); io?.disconnect(); });
watch(() => route.path, onRoute);
watch(() => Object.keys(progress.done).length, () => nextTick(syncSidebar));
</script>

<template>
  <div v-if="show" class="mpc-readbar" aria-hidden="true"><span :style="{ transform: `scaleX(${frac})` }" /></div>
</template>

<style scoped>
.mpc-readbar { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: calc(var(--vp-z-index-nav) + 10); pointer-events: none; }
.mpc-readbar span { display: block; height: 100%; background: var(--mod-accent, var(--vp-c-brand-1)); transform-origin: 0 50%; transition: transform 0.08s linear; }
@media (prefers-reduced-motion: reduce) { .mpc-readbar span { transition: none; } }
</style>
