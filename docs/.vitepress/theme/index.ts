import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { defineAsyncComponent } from 'vue';
import './style.css';

// Every .vue file under components/ is registered globally under its file name,
// so lessons can use <Quiz/>, <TryIt/> etc. without imports.
// The small kit is bundled eagerly. The big per-module visualizers in components/viz/
// are lazy: each becomes its own chunk, loaded only by the page that uses it.
const kit = import.meta.glob(['./components/**/*.vue', '!./components/viz/*.vue'], { eager: true }) as Record<string, { default: any }>;
const viz = import.meta.glob('./components/viz/*.vue') as Record<string, () => Promise<{ default: any }>>;
const nameOf = (path: string) => path.split('/').pop()!.replace(/\.vue$/, '');

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    for (const [path, mod] of Object.entries(kit)) app.component(nameOf(path), mod.default);
    for (const [path, load] of Object.entries(viz)) app.component(nameOf(path), defineAsyncComponent(load));
  },
} satisfies Theme;
