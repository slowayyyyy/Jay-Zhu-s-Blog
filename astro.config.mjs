// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { devContentSync } from './tools/dev-content-sync.mjs';

const site = process.env.PUBLIC_SITE_URL || 'https://jay-zhus-blog.pages.dev';

export default defineConfig({
	site,
	output: 'static',
	integrations: [sitemap(), devContentSync()],
	markdown: {
		shikiConfig: {
			theme: 'github-dark-default',
			wrap: true,
		},
	},
});
