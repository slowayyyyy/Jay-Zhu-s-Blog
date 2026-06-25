import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	appearsIn,
	fileExists,
	listFiles,
	loadPublishedCheckins,
	loadPublishedPosts,
	loadTagIds,
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
const errors = [];

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

for (const text of aboutChecks) {
	if (!appearsIn(about, text)) {
		errors.push(`About page is missing: ${text}`);
	}
}

if (postPages.length !== posts.length) {
	errors.push(`Expected ${posts.length} article pages, generated ${postPages.length}`);
}

if (errors.length > 0) {
	throw new Error(`Content verification failed:\n- ${errors.join('\n- ')}`);
}

console.log(
	`Content verification passed: ${posts.length} published post(s), ${checkins.length} check-in(s).`,
);
