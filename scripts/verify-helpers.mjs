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
		});
	}

	return posts;
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
		});
	}

	return checkins;
}

export async function loadTagIds() {
	const tagFiles = await listFiles(join(root, 'src', 'content', 'tags'), '.json');
	return tagFiles.map((file) => basename(file, '.json').toLocaleLowerCase('en-US'));
}
