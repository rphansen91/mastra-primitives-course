import { reactive } from 'vue';
import { MODULES, PAGE_LABEL, pageLink, type ModuleInfo } from './modules';
import { progress, loadProgress, mark } from './progress';

/**
 * Course-wide progress. A page counts as done once you reach its end (the reading bar
 * marks "read:<link>"). The last lesson page you opened is remembered for "Continue".
 * Everything lives in localStorage; nothing leaves the browser.
 */
export type CoursePage = { link: string; module: ModuleInfo; kind: keyof typeof PAGE_LABEL; label: string };
export const COURSE_PAGES: CoursePage[] = MODULES.flatMap((m) =>
  m.pages.map((kind) => ({ link: pageLink(m.n, kind), module: m, kind, label: `Module ${Number(m.n)} · ${PAGE_LABEL[kind]}` })),
);
const norm = (link: string) => link.replace(/\.html$/, '').replace(/\/index$/, '/');
export const pageByLink = (link: string) => COURSE_PAGES.find((p) => p.link === norm(link));

export const readKey = (link: string) => `read:${norm(link)}`;
export const isRead = (link: string) => !!progress.done[readKey(link)];
export const markRead = (link: string) => pageByLink(link) && mark(readKey(link));
export const moduleDone = (m: ModuleInfo) => m.pages.filter((k) => isRead(pageLink(m.n, k))).length;
export const courseDone = () => COURSE_PAGES.filter((p) => isRead(p.link)).length;

const LAST = 'mpc-last-v1';
export const last = reactive<{ link: string | null; at: number }>({ link: null, at: 0 });
export function loadCourse() {
  loadProgress();
  try {
    const v = JSON.parse(localStorage.getItem(LAST) || 'null');
    if (v?.link && pageByLink(v.link)) Object.assign(last, v);
  } catch { /* ignore */ }
}
export function rememberPage(link: string) {
  const p = pageByLink(link);
  if (!p) return;
  last.link = p.link; last.at = Date.now();
  try { localStorage.setItem(LAST, JSON.stringify(last)); } catch { /* private mode */ }
}
/** Where "Continue" should go: the last page if unfinished, else the next unread page after it, else the first unread. */
export function continueTarget(): CoursePage | null {
  const i = last.link ? COURSE_PAGES.findIndex((p) => p.link === last.link) : -1;
  if (i >= 0 && !isRead(COURSE_PAGES[i].link)) return COURSE_PAGES[i];
  const after = COURSE_PAGES.slice(Math.max(i, 0)).find((p) => !isRead(p.link));
  return after ?? COURSE_PAGES.find((p) => !isRead(p.link)) ?? null;
}
