import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	appearsIn,
	extractCheckinTitles,
	extractSearchResults,
	loadPublishedCheckins,
	loadPublishedPosts,
	runSearchFilters,
	root,
} from './verify-helpers.mjs';

const baseUrl = (
	process.argv[2] ||
	process.env.PUBLIC_SITE_URL ||
	process.env.CF_PAGES_URL ||
	'https://jay-zhu-s-blog.pages.dev'
).replace(/\/+$/, '');

const settings = JSON.parse(await readFile(join(root, 'src', 'data', 'site-settings.json'), 'utf8'));
const posts = await loadPublishedPosts();
const checkins = await loadPublishedCheckins();
const errors = [];

async function fetchText(path) {
	const url = new URL(path, `${baseUrl}/`);
	const response = await fetch(url);
	const body = await response.text();
	if (!response.ok) {
		errors.push(`Live page failed: ${url.toString()} returned ${response.status}`);
	}
	return body;
}

const pages = {
	home: await fetchText('/'),
	search: await fetchText('/search/'),
	life: await fetchText('/life/'),
	checkins: await fetchText('/checkins/'),
	about: await fetchText('/about/'),
	admin: await fetchText('/admin/'),
	rss: await fetchText('/rss.xml'),
	auth: await fetchText('/api/auth?provider=github&scope=repo'),
};
const searchResults = extractSearchResults(pages.search);
const checkinTitles = extractCheckinTitles(pages.checkins);

const liveArticleLinks = [
	...new Set(
		[...pages.search.matchAll(/href="(\/posts\/[^"]+\/)"/g)].map((match) => match[1]),
	),
];
const liveArticlePages = await Promise.all(liveArticleLinks.map((path) => fetchText(path)));

if (liveArticleLinks.length !== posts.length) {
	errors.push(
		`Live article route count mismatch: expected ${posts.length}, found ${liveArticleLinks.length}`,
	);
}

for (const post of posts) {
	if (!appearsIn(pages.home, post.title)) {
		errors.push(`Live home page is missing: ${post.title}`);
	}
	if (!appearsIn(pages.search, post.title)) {
		errors.push(`Live search page is missing: ${post.title}`);
	}
	if (post.section === 'life' && !appearsIn(pages.life, post.title)) {
		errors.push(`Live life page is missing: ${post.title}`);
	}
	if (!appearsIn(pages.rss, post.title)) {
		errors.push(`Live RSS is missing: ${post.title}`);
	}
	if (!liveArticlePages.some((html) => appearsIn(html, post.title))) {
		errors.push(`Live article page is missing its title: ${post.title}`);
	}
}

for (const checkin of checkins) {
	if (!appearsIn(pages.checkins, checkin.title)) {
		errors.push(`Live check-ins page is missing: ${checkin.title}`);
	}
}

const aboutChecks = [
	settings.author.displayName,
	settings.author.intro.zh,
	settings.author.sectionTitles.research.zh,
	settings.author.sectionTitles.hobbies.zh,
	settings.author.sectionTitles.current.zh,
	settings.author.sectionTitles.contact.zh,
	...settings.author.contact.map((item) => item.display),
];

for (const text of aboutChecks) {
	if (!appearsIn(pages.about, text)) {
		errors.push(`Live about page is missing: ${text}`);
	}
}

if (!appearsIn(pages.admin, 'decap-cms')) {
	errors.push('Live admin page did not load the Decap CMS bundle reference.');
}

if (!appearsIn(pages.auth, 'Jay CMS Auth')) {
	errors.push('Live auth endpoint did not render the CMS auth bridge page.');
}

const viewsResponse = await fetch(`${baseUrl}/api/views?id=health-check`);
const viewsText = await viewsResponse.text();
if (!viewsResponse.ok) {
	errors.push(`Live page views API failed: ${viewsResponse.status} ${viewsText.slice(0, 160)}`);
}

const renderedSearchOrder = searchResults.map((entry) => entry.title);
const expectedSearchOrder = posts.map((post) => post.title);
if (renderedSearchOrder.join('\n') !== expectedSearchOrder.join('\n')) {
	errors.push('Live search page result order does not match the computed post order.');
}

if (checkinTitles.join('\n') !== checkins.map((checkin) => checkin.title).join('\n')) {
	errors.push('Live check-ins page order does not match the computed check-in order.');
}

const impossibleSearch = runSearchFilters(searchResults, { keyword: '__not_existing_keyword__' });
if (impossibleSearch.length !== 0) {
	errors.push('Live search filtering returns results for a guaranteed-missing keyword.');
}

for (const post of posts) {
	const titleSearch = runSearchFilters(searchResults, { keyword: post.title });
	if (!titleSearch.some((entry) => entry.title === post.title)) {
		errors.push(`Live search filtering cannot find post by its own title: ${post.title}`);
	}
}

if (errors.length > 0) {
	throw new Error(`Live verification failed for ${baseUrl}:\n- ${errors.join('\n- ')}`);
}

console.log(
	`Live verification passed for ${baseUrl}: ${posts.length} post(s), ${checkins.length} check-in(s).`,
);
