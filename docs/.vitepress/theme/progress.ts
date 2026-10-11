import { reactive } from 'vue';

/**
 * Tiny localStorage-backed progress store shared by every component.
 * Keys look like "m02:station:2" or "m02:check:loop-order".
 * Nothing is read during SSR; call loadProgress() from onMounted.
 */
const KEY = 'mpc-progress-v1';
export const progress = reactive<{ loaded: boolean; done: Record<string, number> }>({ loaded: false, done: {} });

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress.done));
  } catch {
    /* private mode: progress just won't persist */
  }
}

export function loadProgress() {
  if (progress.loaded || typeof window === 'undefined') return;
  try {
    Object.assign(progress.done, JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    /* ignore corrupt data */
  }
  progress.loaded = true;
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    try {
      const next = JSON.parse(e.newValue || '{}');
      for (const k of Object.keys(progress.done)) if (!(k in next)) delete progress.done[k];
      Object.assign(progress.done, next);
    } catch {
      /* ignore */
    }
  });
}

export const isDone = (id: string) => !!progress.done[id];
export function mark(id: string) {
  if (!progress.done[id]) {
    progress.done[id] = Date.now();
    save();
    window.dispatchEvent(new CustomEvent('mpc-progress', { detail: id }));
  }
}
export function unmarkPrefix(prefix: string) {
  for (const k of Object.keys(progress.done)) if (k.startsWith(prefix)) delete progress.done[k];
  save();
}

/** Minimal inline formatter for our own (trusted) strings: `code`, **bold**, *em*. Escapes HTML first. */
export function fmt(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Knowledge checks register themselves so the module tracker knows the denominator. */
export const registry = reactive<Record<string, string[]>>({});
export function registerCheck(module: string, id: string) {
  const list = (registry[module] ??= []);
  if (!list.includes(id)) list.push(id);
}

export const STATIONS = [
  { n: 1, key: 'problem', title: 'The problem', icon: 'puzzle', color: 'coral' },
  { n: 2, key: 'under-the-hood', title: 'Under the hood', icon: 'wrench', color: 'violet' },
  { n: 3, key: 'break-it', title: 'Break it', icon: 'bolt', color: 'amber' },
  { n: 4, key: 'choose-wisely', title: 'Choose wisely', icon: 'compass', color: 'teal' },
] as const;
