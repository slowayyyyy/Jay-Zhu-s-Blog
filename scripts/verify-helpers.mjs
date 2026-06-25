import { constants } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

export const root = process.cwd();

export async function listFiles(directory, extension) {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if (error?.code === 'ENOENT') return [];
		throw error;
	}

	const files = await Promise.all(
		entries.map((entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? listFiles(path, extension) : path.endsWith(extension) ? [path] : [];
		}),
	);
	return files.flat();
}

export function readFrontmatter(source, file) {
	const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) throw new Error(`Missing frontmatter: ${file}`);
	return match[1];
}

const unquote = (value) => {
	const trimmed = value.trim();
	const quote = trimmed[0];
	return (quote === '"' || quote === "'") && trimmed.endsWith(quote)
		? trimmed.slice(1, -1)
		: trimmed;
};

export function readScalar(frontmatter, field) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
	return match ? unquote(match[1]) : '';
}

export function readList(frontmatter, field) {
	const lines = frontmatter.split(/\r?\n/);
	const items = [];
	let inBlock = false;

	for (const line of lines) {
		if (!inBlock) {
			if (new RegExp(`^${field}:\\s*$`).test(line)) {
				inBlock = true;
			}
			continue;
		}

		if (/^\S/.test(line)) break;
		const match = line.match(/^\s*-\s+(.+?)\s*$/);
		if (match) {
			items.push(unquote(match[1]));
		}
	}

	return items;
}

export function normalizeText(value = '') {
	return String(value).normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ').trim();
}

export function appearsIn(html, text) {
	const escaped = text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
	return html.includes(text) || html.includes(escaped);
}

export async function fileExists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

const compareManualOrder = (a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
const compareIdsDescending = (a, b) => b.slug.localeCompare(a.slug, 'zh-CN');

export async function loadPublishedPosts() {
	const postFiles = await listFiles(join(root, 'src', 'content', 'posts'), '.md');
	const posts = [];

	for (const file of postFiles) {
		const source = await readFile(file, 'utf8');
		const frontmatter = readFrontmatter(source, file);
		if (readScalar(frontmatter, 'draft').toLowerCase() === 'true') continue;

		const title = readScalar(frontmatter, 'title');
		const section = readScalar(frontmatter, 'section');
		if (!title || !section) throw new Error(`Missing title or section: ${file}`);

		posts.push({
			file,
			title,
			section,
			tags: readList(frontmatter, 'tags'),
			slug: basename(file, '.md'),
			excerpt: readScalar(frontmatter, 'excerpt'),
			body: source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''),
			sortOrder: Number.parseInt(readScalar(frontmatter, 'sortOrder') || '0', 10) || 0,
			publishDate: new Date(readScalar(frontmatter, 'publishDate')),
		});
	}

	return posts.sort(
		(a, b) =>
			compareManualOrder(a, b) ||
			b.publishDate.getTime() - a.publishDate.getTime() ||
			compareIdsDescending(a, b),
	);
}

export async function loadPublishedCheckins() {
	const checkinFiles = await listFiles(join(root, 'src', 'content', 'checkins'), '.md');
	const checkins = [];

	for (const file of checkinFiles) {
		const source = await readFile(file, 'utf8');
		const frontmatter = readFrontmatter(source, file);
		if (readScalar(frontmatter, 'draft').toLowerCase() === 'true') continue;

		const title = readScalar(frontmatter, 'title');
		if (!title) throw new Error(`Missing title: ${file}`);

		checkins.push({
			file,
			title,
			tags: readList(frontmatter, 'tags'),
			body: source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''),
			sortOrder: Number.parseInt(readScalar(frontmatter, 'sortOrder') || '0', 10) || 0,
			date: new Date(readScalar(frontmatter, 'date')),
			slug: basename(file, '.md'),
		});
	}

	return checkins.sort(
		(a, b) =>
			compareManualOrder(a, b) ||
			b.date.getTime() - a.date.getTime() ||
			compareIdsDescending(a, b),
	);
}

export async function loadTagIds() {
	const tagFiles = await listFiles(join(root, 'src', 'content', 'tags'), '.json');
	return tagFiles.map((file) => basename(file, '.json').toLocaleLowerCase('en-US'));
}

export function extractSearchResults(html) {
	const results = [];
	for (const match of html.matchAll(/<div\s+data-result\b([^>]*)>/g)) {
		const attrs = match[1];
		const readAttr = (name) => attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? '';
		results.push({
			title: readAttr('data-title'),
			excerpt: readAttr('data-excerpt'),
			body: readAttr('data-body'),
			section: readAttr('data-section'),
			year: readAttr('data-year'),
			tags: readAttr('data-tags'),
		});
	}
	return results;
}

export function extractCheckinTitles(html) {
	return [...html.matchAll(/<article class="checkin-entry"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)].map(
		(match) => match[1],
	);
}

export function runSearchFilters(entries, { keyword = '', section = '', year = '', tag = '' } = {}) {
	const keywordValues = normalizeText(keyword).split(' ').filter(Boolean);
	const tagValue = normalizeText(tag);

	return entries.filter((entry) => {
		const haystack = normalizeText([entry.title, entry.excerpt, entry.body].join(' '));
		const cardTags = normalizeText(entry.tags).split('|').filter(Boolean);
		const matchesKeyword = keywordValues.every((value) => haystack.includes(value));
		const matchesSection = !section || entry.section === section;
		const matchesYear = !year || entry.year === year;
		const matchesTag = !tagValue || cardTags.includes(tagValue);
		return matchesKeyword && matchesSection && matchesYear && matchesTag;
	});
}
