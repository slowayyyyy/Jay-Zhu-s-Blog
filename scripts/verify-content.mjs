import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

async function listFiles(directory, extension) {
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

function readFrontmatter(source, file) {
	const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) throw new Error(`Missing frontmatter: ${file}`);
	return match[1];
}

function readScalar(frontmatter, field) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
	if (!match) return '';
	const value = match[1].trim();
	const quote = value[0];
	return (quote === '"' || quote === "'") && value.endsWith(quote) ? value.slice(1, -1) : value;
}

function appearsIn(html, text) {
	const escaped = text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
	return html.includes(text) || html.includes(escaped);
}

const postFiles = await listFiles(join(root, 'src', 'content', 'posts'), '.md');
const posts = [];

for (const file of postFiles) {
	const source = await readFile(file, 'utf8');
	const frontmatter = readFrontmatter(source, file);
	if (readScalar(frontmatter, 'draft').toLowerCase() === 'true') continue;

	const title = readScalar(frontmatter, 'title');
	const section = readScalar(frontmatter, 'section');
	if (!title || !section) throw new Error(`Missing title or section: ${file}`);
	posts.push({ file, title, section });
}

const home = await readFile(join(root, 'dist', 'index.html'), 'utf8');
const search = await readFile(join(root, 'dist', 'search', 'index.html'), 'utf8');
const life = await readFile(join(root, 'dist', 'life', 'index.html'), 'utf8');
const postPages = await listFiles(join(root, 'dist', 'posts'), 'index.html');
const renderedPosts = await Promise.all(postPages.map((file) => readFile(file, 'utf8')));
const errors = [];

for (const post of posts) {
	if (!appearsIn(home, post.title)) errors.push(`Home page is missing: ${post.title}`);
	if (!appearsIn(search, post.title)) errors.push(`Search page is missing: ${post.title}`);
	if (post.section === 'life' && !appearsIn(life, post.title)) {
		errors.push(`Life page is missing: ${post.title}`);
	}
	if (!renderedPosts.some((html) => appearsIn(html, post.title))) {
		errors.push(`Article page is missing: ${post.title}`);
	}
}

if (postPages.length !== posts.length) {
	errors.push(`Expected ${posts.length} article pages, generated ${postPages.length}`);
}

if (errors.length > 0) {
	throw new Error(`Content verification failed:\n- ${errors.join('\n- ')}`);
}

console.log(`Content verification passed: ${posts.length} published post(s).`);
