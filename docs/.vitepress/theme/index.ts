import DefaultTheme from 'vitepress/theme-without-fonts';
import type { Theme } from 'vitepress';
import { defineAsyncComponent, h } from 'vue';
import { useData } from 'vitepress';
import './style.css';
import CourseSync from './components/CourseSync.vue';

// Every .vue file under components/ is registered globally under its file name,
// so lessons can use <Quiz/>, <TryIt/> etc. without imports.
// The small kit is bundled eagerly. The big per-module visualizers in components/viz/
// are lazy: each becomes its own chunk, loaded only by the page that uses it.
const kit = import.meta.glob(['./components/**/*.vue', '!./components/viz/*.vue'], { eager: true }) as Record<string, { default: any }>;
const viz = import.meta.glob('./components/viz/*.vue') as Record<string, () => Promise<{ default: any }>>;
const nameOf = (path: string) => path.split('/').pop()!.replace(/\.vue$/, '');

export default {
  extends: DefaultTheme,
  // VitePress hides its site footer on pages with a sidebar, so the independence note is
  // also rendered after every doc page's prev/next links.
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(CourseSync),
      'doc-after': () => {
        const { theme } = useData();
        return h('p', { class: 'mpc-doc-note' }, theme.value.footer?.message ?? '');
      },
    });
  },
  enhanceApp({ app }) {
    for (const [path, mod] of Object.entries(kit)) app.component(nameOf(path), mod.default);
    for (const [path, load] of Object.entries(viz)) app.component(nameOf(path), defineAsyncComponent(load));
  },
} satisfies Theme;
