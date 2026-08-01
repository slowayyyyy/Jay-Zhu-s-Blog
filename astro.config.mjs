// @ts-check
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkAcademicCitations } from './src/lib/remark-academic-citations.mjs';
import { devContentSync } from './tools/dev-content-sync.mjs';

const site =
	process.env.CF_PAGES_URL ||
	process.env.PUBLIC_SITE_URL ||
	'https://jay-zhu-s-blog.pages.dev';

export default defineConfig({
	site,
	output: 'static',
	integrations: [sitemap(), devContentSync()],
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath, remarkAcademicCitations],
			rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false, trust: false }]],
			remarkRehype: {
				footnoteLabel: '脚注',
				footnoteBackLabel: '返回正文',
			},
		}),
		syntaxHighlight: {
			type: 'shiki',
			excludeLangs: ['math', 'mermaid'],
		},
		shikiConfig: {
			theme: 'github-dark-default',
			wrap: true,
		},
	},
});
