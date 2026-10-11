import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const fullModule = (n: string, title: string) => ({
  text: `${n}. ${title}`,
  collapsed: false,
  items: [
    { text: 'Lesson', link: `/m${n}/` },
    { text: 'Lab', link: `/m${n}/lab` },
    { text: 'Break it', link: `/m${n}/break-it` },
    { text: 'Check your understanding', link: `/m${n}/quiz` },
  ],
});
const builtLabModule = (n: string, title: string) => ({
  text: `${n}. ${title}`,
  collapsed: true,
  items: [
    { text: 'Lesson', link: `/m${n}/` },
    { text: 'Lab', link: `/m${n}/lab` },
  ],
});
const lessonModule = (n: string, title: string) => ({ text: `${n}. ${title}`, link: `/m${n}/` });

export default withMermaid(
  defineConfig({
    title: 'Mastra Primitives',
    description: 'A source-level course on the primitives inside the Mastra agent framework, and how to design new ones.',
    base: '/mastra-primitives-course/',
    cleanUrls: true,
    lastUpdated: true,
    head: [['link', { rel: 'icon', href: '/mastra-primitives-course/favicon.svg' }]],
    markdown: { lineNumbers: false },
    themeConfig: {
      nav: [
        { text: 'Start', link: '/guide/method' },
        { text: 'Modules', link: '/m00/' },
        { text: 'Cheat sheet', link: '/cheatsheet' },
        { text: 'Capstone RFC template', link: '/m10/rfc-template' },
      ],
      sidebar: [
        {
          text: 'Course',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'The four-pass method', link: '/guide/method' },
            { text: 'Running the labs', link: '/guide/labs' },
            { text: 'Decision-table cheat sheet', link: '/cheatsheet' },
          ],
        },
        {
          text: 'Foundations',
          items: [
            { text: '0. Setup and reading the codebase', link: '/m00/' },
            fullModule('01', 'First principles before Mastra'),
            fullModule('02', 'The agent loop'),
            fullModule('03', 'Processors'),
          ],
        },
        {
          text: 'Primitives',
          items: [
            lessonModule('04', 'Memory'),
            lessonModule('05', 'Workflows'),
            builtLabModule('06', 'Signals and notifications'),
            builtLabModule('07', 'Durability'),
            builtLabModule('08', 'Multi-agent coordination'),
            lessonModule('09', 'Evals and observability'),
          ],
        },
        {
          text: 'Capstone',
          items: [
            { text: '10. Building primitives', link: '/m10/' },
            { text: 'RFC template', link: '/m10/rfc-template' },
          ],
        },
      ],
      socialLinks: [{ icon: 'github', link: 'https://github.com/rphansen91/mastra-primitives-course' }],
      editLink: {
        pattern: 'https://github.com/rphansen91/mastra-primitives-course/edit/main/docs/:path',
        text: 'Suggest an edit',
      },
      search: { provider: 'local' },
      outline: { level: [2, 3] },
      footer: {
        message: 'Course text and code are MIT licensed. Not an official Mastra project.',
        copyright: 'Source links point to mastra-ai/mastra at a pinned commit.',
      },
    },
    mermaid: {},
  }),
);
