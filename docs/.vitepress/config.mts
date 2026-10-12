import { defineConfig, type HeadConfig } from 'vitepress';
import { MODULES, PAGE_LABEL, pageLink, moduleOf, VERIFIED } from './theme/modules';
import { breakIdent } from './theme/ident';
import { writeOgImages, writeTouchIcon, type OgItem } from './og';

const BASE = '/mastra-primitives-course/';
const SITE = 'https://rphansen91.github.io/mastra-primitives-course';
const DESCRIPTION = 'A source-level course on the primitives inside the Mastra agent framework, and how to design new ones. Runnable labs, no API keys.';

const num = (n: string) => n; // two-digit everywhere: "00" … "10"
const moduleSidebar = (m: (typeof MODULES)[number]) =>
  m.pages.length === 1
    ? { text: `${num(m.n)}. ${m.title}`, link: pageLink(m.n, 'lesson') }
    : {
        text: `${num(m.n)}. ${m.title}`,
        collapsed: !['01', '02', '03'].includes(m.n),
        items: m.pages.map((p) => ({ text: p === 'quiz' ? 'Quiz' : PAGE_LABEL[p], link: pageLink(m.n, p) })),
      };

const COURSE_PAGES = [
  { text: 'Overview', link: '/' },
  { text: 'The four-pass method', link: '/guide/method' },
  { text: 'Running the labs', link: '/guide/labs' },
  { text: 'Decision-table cheat sheet', link: '/cheatsheet' },
  { text: 'Production guide', link: '/adopting' },
  { text: 'Reading list', link: '/reading' },
];
const byGroup = (g: string) => MODULES.filter((m) => m.group === g).map(moduleSidebar);
const capstone = MODULES.find((m) => m.n === '10')!;

// Flat reading order with human labels, used for prev/next ("Module 1 · Quiz").
type Stop = { link: string; label: string };
const ORDER: Stop[] = [
  ...COURSE_PAGES.filter((p) => p.link !== '/').map((p) => ({ link: p.link, label: p.text })),
  ...MODULES.flatMap((m) => [
    ...m.pages.map((p) => ({ link: pageLink(m.n, p), label: `Module ${Number(m.n)} · ${PAGE_LABEL[p]}` })),
    ...(m.n === '10' ? [{ link: '/m10/rfc-template', label: 'Module 10 · RFC template' }] : []),
  ]),
];
const linkOf = (relativePath: string) => '/' + relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');

function metaFor(relativePath: string, title: string, fmDescription?: string) {
  const n = moduleOf(relativePath);
  const m = n ? MODULES.find((x) => x.n === n) : undefined;
  const link = linkOf(relativePath);
  const stop = ORDER.find((s) => s.link === link);
  const slug = link === '/' ? 'home' : link.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'home';
  const kicker = m ? `Module ${m.n}${stop && !link.endsWith('/') ? ' · ' + stop.label.split(' · ')[1] : ''} · ${m.minutes} min` : link === '/' ? 'A source-level course' : 'Mastra Primitives';
  const desc = fmDescription || (m ? m.hook : DESCRIPTION);
  return { slug, kicker, desc, color: m?.color ?? '#5b3df5', title };
}
const ogItems = new Map<string, OgItem>();

export default defineConfig({
  title: 'Mastra Primitives',
  description: DESCRIPTION,
  base: BASE,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    // Preload the 20 KB body face so it is ready at first paint (no swap shift on mobile).
    ['link', { rel: 'preload', href: `${BASE}fonts/Geist.woff2`, as: 'font', type: 'font/woff2', crossorigin: '' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    ['link', { rel: 'apple-touch-icon', href: `${BASE}apple-touch-icon.png` }],
    ['link', { rel: 'mask-icon', href: `${BASE}mask-icon.svg`, color: '#16141f' }],
    ['meta', { name: 'theme-color', content: '#16141f' }],
    ['meta', { property: 'og:site_name', content: 'Mastra Primitives (independent course)' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  markdown: {
    lineNumbers: false,
    theme: { light: 'github-light-default', dark: 'github-dark-default' },
    config(md) {
      // Long identifiers in inline code wrap at camelCase/./_ boundaries, never mid-word.
      md.renderer.rules.code_inline = (tokens, idx, _o, _e, self) =>
        `<code${self.renderAttrs(tokens[idx])}>${breakIdent(md.utils.escapeHtml(tokens[idx].content))}</code>`;
    },
  },
  transformPageData(pageData) {
    const rp = pageData.relativePath;
    const n = moduleOf(rp);
    if (n) pageData.frontmatter.pageClass = [pageData.frontmatter.pageClass, `mod-${n}`, 'in-module'].filter(Boolean).join(' ');
    const link = linkOf(rp);
    const i = ORDER.findIndex((s) => s.link === link);
    if (i >= 0) {
      if (pageData.frontmatter.prev === undefined) pageData.frontmatter.prev = i > 0 ? { text: ORDER[i - 1].label, link: ORDER[i - 1].link } : false;
      if (pageData.frontmatter.next === undefined) pageData.frontmatter.next = i < ORDER.length - 1 ? { text: ORDER[i + 1].label, link: ORDER[i + 1].link } : false;
    }
  },
  transformHead({ pageData, title }) {
    if (pageData.isNotFound) return [];
    const m = metaFor(pageData.relativePath, pageData.title || 'Mastra Primitives', pageData.frontmatter.description);
    const ogTitle = pageData.relativePath === 'index.md' ? 'Learn Mastra from the inside out' : (pageData.title || 'Mastra Primitives');
    ogItems.set(m.slug, { ...m, title: ogTitle });
    const url = `${SITE}${linkOf(pageData.relativePath)}`;
    const img = `${SITE}/og/${m.slug}.png`;
    const head: HeadConfig[] = [
      ['meta', { name: 'description', content: m.desc }],
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'article' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: m.desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: img }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: `${ogTitle}: ${m.kicker}` }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: m.desc }],
      ['meta', { name: 'twitter:image', content: img }],
    ];
    return head;
  },
  buildEnd(siteConfig) {
    writeOgImages([...ogItems.values()], siteConfig.outDir, VERIFIED.core);
    writeTouchIcon(siteConfig.outDir);
  },
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    nav: [
      { text: 'Course', link: '/m00/', activeMatch: '^/(m\\d\\d|guide)/' },
      { text: 'Cheat sheet', link: '/cheatsheet' },
      { text: 'Production guide', link: '/adopting' },
      { text: 'Reading', link: '/reading' },
    ],
    sidebar: [
      { text: 'Course', items: COURSE_PAGES },
      { text: 'Foundations', items: byGroup('Foundations') },
      { text: 'Primitives', items: byGroup('Primitives') },
      { text: 'Capstone', items: [{ text: `${capstone.n}. ${capstone.title}`, collapsed: false, items: [{ text: 'Lesson', link: '/m10/' }, { text: 'RFC template', link: '/m10/rfc-template' }] }] },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/rphansen91/mastra-primitives-course', ariaLabel: 'Course source on GitHub' }],
    editLink: {
      pattern: 'https://github.com/rphansen91/mastra-primitives-course/edit/main/docs/:path',
      text: 'Suggest an edit',
    },
    docFooter: { prev: 'Previous', next: 'Next' },
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    footer: {
      message: 'Independent course, not affiliated with or endorsed by Mastra. Course text and code are MIT licensed. Book and founder quotes are short, attributed excerpts.',
      copyright: 'Source links point to mastra-ai/mastra at a pinned commit.',
    },
  },
});
