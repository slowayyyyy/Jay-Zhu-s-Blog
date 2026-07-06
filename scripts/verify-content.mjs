import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	appearsIn,
	extractCheckinTitles,
	extractSearchResults,
	fileExists,
	listFiles,
	loadPublishedCheckins,
	loadPublishedPosts,
	loadTagIds,
	runSearchFilters,
	root,
} from './verify-helpers.mjs';

const posts = await loadPublishedPosts();
const checkins = await loadPublishedCheckins();
const tagIds = new Set(await loadTagIds());
const settings = JSON.parse(await readFile(join(root, 'src', 'data', 'site-settings.json'), 'utf8'));

const home = await readFile(join(root, 'dist', 'index.html'), 'utf8');
const search = await readFile(join(root, 'dist', 'search', 'index.html'), 'utf8');
const life = await readFile(join(root, 'dist', 'life', 'index.html'), 'utf8');
const checkinsPage = await readFile(join(root, 'dist', 'checkins', 'index.html'), 'utf8');
const about = await readFile(join(root, 'dist', 'about', 'index.html'), 'utf8');
const rss = await readFile(join(root, 'dist', 'rss.xml'), 'utf8');
const postPages = await listFiles(join(root, 'dist', 'posts'), 'index.html');
const renderedPosts = await Promise.all(postPages.map((file) => readFile(file, 'utf8')));
const searchResults = extractSearchResults(search);
const checkinTitles = extractCheckinTitles(checkinsPage);
const errors = [];
const invalidImagePattern = /!\[[^\]]*\]\(\s*(?:\)|file:|[a-z]:\\)/giu;

const findInvalidImageReferences = (body) =>
	[...body.matchAll(invalidImagePattern)].map((match) => ({
		line: body.slice(0, match.index).split(/\r?\n/u).length,
		value: match[0],
	}));

for (const post of posts) {
	if (!appearsIn(home, post.title)) errors.push(`Home page is missing: ${post.title}`);
	if (!appearsIn(search, post.title)) errors.push(`Search page is missing: ${post.title}`);
	if (!appearsIn(rss, post.title)) errors.push(`RSS is missing: ${post.title}`);
	if (post.section === 'life' && !appearsIn(life, post.title)) {
		errors.push(`Life page is missing: ${post.title}`);
	}
	if (!renderedPosts.some((html) => appearsIn(html, post.title))) {
		errors.push(`Article page is missing: ${post.title}`);
	}

	for (const image of findInvalidImageReferences(post.body)) {
		errors.push(`Post has an invalid local or empty image reference: ${post.title}, body line ${image.line}`);
	}

	for (const tag of post.tags) {
		if (!tagIds.has(tag.toLocaleLowerCase('en-US'))) {
			errors.push(`Post uses a missing tag definition: ${post.title} -> ${tag}`);
		}

		const tagPage = join(root, 'dist', 'tags', tag, 'index.html');
		if (!(await fileExists(tagPage))) {
			errors.push(`Tag page is missing: ${tag}`);
		}
	}
}

for (const checkin of checkins) {
	if (!appearsIn(checkinsPage, checkin.title)) {
		errors.push(`Check-ins page is missing: ${checkin.title}`);
	}

	for (const image of findInvalidImageReferences(checkin.body)) {
		errors.push(`Check-in has an invalid local or empty image reference: ${checkin.title}, body line ${image.line}`);
	}

	for (const tag of checkin.tags) {
		if (!tagIds.has(tag.toLocaleLowerCase('en-US'))) {
			errors.push(`Check-in uses a missing tag definition: ${checkin.title} -> ${tag}`);
		}
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

const homeChecks = [
	settings.opening.title,
	settings.opening.caption,
	settings.homeIntro.zh,
	settings.motto.zh,
];

for (const text of aboutChecks) {
	if (!appearsIn(about, text)) {
		errors.push(`About page is missing: ${text}`);
	}
}

for (const text of homeChecks) {
	if (!appearsIn(home, text)) {
		errors.push(`Home page is missing: ${text}`);
	}
}

if (postPages.length !== posts.length) {
	errors.push(`Expected ${posts.length} article pages, generated ${postPages.length}`);
}

const renderedSearchOrder = searchResults.map((entry) => entry.title);
const expectedSearchOrder = posts.map((post) => post.title);
if (renderedSearchOrder.join('\n') !== expectedSearchOrder.join('\n')) {
	errors.push('Search page result order does not match the computed post order.');
}

if (checkinTitles.join('\n') !== checkins.map((checkin) => checkin.title).join('\n')) {
	errors.push('Check-ins page order does not match the computed check-in order.');
}

const impossibleSearch = runSearchFilters(searchResults, { keyword: '__not_existing_keyword__' });
if (impossibleSearch.length !== 0) {
	errors.push('Search filtering returns results for a guaranteed-missing keyword.');
}

for (const post of posts) {
	const titleSearch = runSearchFilters(searchResults, { keyword: post.title });
	if (!titleSearch.some((entry) => entry.title === post.title)) {
		errors.push(`Search filtering cannot find post by its own title: ${post.title}`);
	}
}

for (const tag of tagIds) {
	const expectedCount = posts.filter((post) =>
		post.tags.some((item) => item.toLocaleLowerCase('en-US') === tag),
	).length;
	const actualCount = runSearchFilters(searchResults, { tag }).length;
	if (actualCount !== expectedCount) {
		errors.push(`Search tag filter count mismatch for ${tag}: expected ${expectedCount}, got ${actualCount}`);
	}
}

if (errors.length > 0) {
	throw new Error(`Content verification failed:\n- ${errors.join('\n- ')}`);
}

console.log(
	`Content verification passed: ${posts.length} published post(s), ${checkins.length} check-in(s).`,
);
