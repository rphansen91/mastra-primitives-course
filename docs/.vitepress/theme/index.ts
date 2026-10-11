import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './style.css';

// Every .vue file under components/ is registered globally under its file name,
// so lessons can use <LoopVisualizer/>, <Quiz/> etc. without imports.
const modules = import.meta.glob('./components/**/*.vue', { eager: true }) as Record<string, { default: any }>;

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    for (const [path, mod] of Object.entries(modules)) {
      const name = path.split('/').pop()!.replace(/\.vue$/, '');
      app.component(name, mod.default);
    }
  },
} satisfies Theme;
