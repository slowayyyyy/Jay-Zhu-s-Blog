import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import YAML from 'yaml';
import { normalizeMarkdownMath } from '../lib/markdown-math.mjs';

const IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|webp)$/iu;
const REMOTE_URL = /^(?:https?:)?\/\//iu;
const SITE_IMAGE = /^\/(?:uploads|assets|media)\//iu;
const TYPORA_KEYS = new Set(['typora-root-url', 'typora-copy-images-to']);
const BLOG_KEYS = new Set([
	'title', 'description', 'excerpt', 'published', 'date', 'updated', 'category', 'tags',
	'image', 'pinned', 'draft', 'password', 'passwordHint', 'lang', 'author', 'sourceLink',
	'licenseName', 'licenseUrl', 'aiSummary', 'series', 'seriesOrder', 'comment',
]);

const normalizeSlashes = (value) => String(value ?? '').replaceAll('\\', '/');
const normalizePath = (value) => {
	const parts = [];
	for (const part of normalizeSlashes(value).split('/')) {
		if (!part || part === '.') continue;
		if (part === '..') parts.pop();
		else parts.push(part);
	}
	return parts.join('/');
};

const decodePath = (value) => {
	try { return decodeURIComponent(value); } catch { return value; }
};

const sourcePath = (value) => decodePath(String(value ?? '').trim().replace(/^<|>$/gu, '').split(/[?#]/u)[0]);

const splitFrontmatter = (source) => {
	const text = String(source ?? '').replace(/^\uFEFF/u, '').replaceAll('\r\n', '\n');
	const match = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/u);
	if (!match) return { metadata: {}, body: text };
	const document = YAML.parseDocument(match[1], { uniqueKeys: true, strict: true });
	if (document.errors.length) throw new Error(`YAML 元数据格式有误：${document.errors[0].message}`);
	const metadata = document.toJS() ?? {};
	if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
		throw new Error('YAML 元数据必须是字段列表。');
	}
	return { metadata, body: text.slice(match[0].length) };
};

export const inspectTyporaMarkdown = (source) => {
	const { metadata, body } = splitFrontmatter(source);
	return {
		title: String(metadata.title ?? titleFromBody(body) ?? '').trim(),
		description: String(metadata.description ?? metadata.excerpt ?? descriptionFromBody(body)).trim(),
		published: dateValue(metadata.published ?? metadata.date, new Date().toISOString().slice(0, 10)),
		category: String(metadata.category ?? '').trim(),
		tags: tagsValue(metadata.tags),
	};
};

const plainText = (value) => String(value ?? '')
	.replace(/!?\[([^\]]+)\]\([^)]*\)/gu, '$1')
	.replace(/[*_~`>#]/gu, '')
	.replace(/\s+/gu, ' ')
	.trim();

const titleFromBody = (body) => body.match(/^#\s+(.+)$/mu)?.[1]?.trim() ?? '';

const descriptionFromBody = (body) => {
	const paragraph = body.split(/\n\s*\n/u).find((part) => {
		const value = part.trim();
		return value && !/^(?:#|>|[-*+] |\d+\. |```|\$\$|\||!\[|<|\[toc\])/iu.test(value);
	});
	return plainText(paragraph).slice(0, 180);
};

const dateValue = (value, fallback) => {
	if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
	const raw = String(value ?? '').trim();
	if (/^\d{4}-\d{2}-\d{2}$/u.test(raw) && !Number.isNaN(Date.parse(raw))) return raw;
	return fallback;
};

export const slugForTitle = (title) => String(title ?? '')
	.normalize('NFKC')
	.toLowerCase()
	.replace(/[^\p{L}\p{N}]+/gu, '-')
	.replace(/^-+|-+$/gu, '')
	.slice(0, 72) || 'typora-article';

const tagsValue = (value) => Array.isArray(value)
	? value.map((item) => String(item).trim()).filter(Boolean)
	: typeof value === 'string'
		? value.split(/[,，]/u).map((item) => item.trim()).filter(Boolean)
		: [];

const filePath = (file) => normalizePath(file.webkitRelativePath || file.relativePath || file.name);

const escapeImageAlt = (value) => String(value ?? '').replaceAll('\\', '\\\\').replaceAll(']', '\\]');
const escapeImageTitle = (value) => String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');

export function prepareTyporaImport({ markdown, markdownFile, files = [], category, published, title, description, tags }) {
	const { metadata: original, body } = splitFrontmatter(markdown);
	if (!body.trim()) throw new Error('文章正文为空，请选择包含正文的 Markdown 文件。');
	const resolvedTitle = String(title ?? original.title ?? titleFromBody(body) ?? '').trim();
	if (!resolvedTitle) throw new Error('没有找到文章标题，请填写标题后重试。');
	const resolvedDate = dateValue(published ?? original.published ?? original.date, new Date().toISOString().slice(0, 10));
	const resolvedCategory = String(category ?? original.category ?? '').trim();
	if (!resolvedCategory) throw new Error('请选择博客分区。');
	const resolvedDescription = String(description ?? original.description ?? original.excerpt ?? descriptionFromBody(body)).trim();
	const resolvedTags = tags === undefined ? tagsValue(original.tags) : tagsValue(tags);
	const slug = `${resolvedDate}-${slugForTitle(resolvedTitle)}`;
	const root = filePath(markdownFile).split('/').slice(0, -1).join('/');
	const candidates = files.filter((file) => file !== markdownFile && IMAGE_EXTENSIONS.test(file.name));
	const byPath = new Map(candidates.map((file) => [filePath(file).toLowerCase(), file]));
	const used = new Map();
	const missing = new Set();
	const unsupportedLinks = new Set();
	const replacements = [];
	const parser = unified().use(remarkParse).use(remarkGfm);
	const tree = parser.parse(body);
	const imageDefinitions = new Set();
	visit(tree, 'imageReference', (node) => imageDefinitions.add(node.identifier.toLowerCase()));

	const resolve = (raw) => {
		const url = sourcePath(raw);
		if (!url || REMOTE_URL.test(url) || SITE_IMAGE.test(url)) return null;
		if (/^(?:data:|blob:)/iu.test(url)) { missing.add(raw); return null; }
		const local = url.replace(/^file:\/\//iu, '').replace(/^\/(?:[a-z]:)?/iu, '');
		const wanted = normalizePath(`${root}/${local}`).toLowerCase();
		let file = byPath.get(wanted);
		if (!file) {
			const normalized = normalizePath(local).toLowerCase();
			const matches = candidates.filter((candidate) => {
				const path = filePath(candidate).toLowerCase();
				return path === normalized || path.endsWith(`/${normalized}`);
			});
			if (matches.length === 1) file = matches[0];
		}
		if (!file) {
			const basename = local.split('/').at(-1)?.toLowerCase();
			const matches = candidates.filter((candidate) => candidate.name.toLowerCase() === basename);
			if (matches.length === 1) file = matches[0];
		}
		if (!file) { missing.add(raw); return null; }
		if (!used.has(file)) {
			const safeName = file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]/gu, '-').slice(-90);
			used.set(file, `/uploads/typora/${slug}/${String(used.size + 1).padStart(2, '0')}-${safeName}`);
		}
		return used.get(file);
	};

	const replaceNode = (node, raw) => {
		const target = resolve(raw);
		if (!target) return;
		const titleText = node.title ? ` "${escapeImageTitle(node.title)}"` : '';
		replacements.push({ start: node.position.start.offset, end: node.position.end.offset,
			value: `![${escapeImageAlt(node.alt)}](${target}${titleText})` });
	};

	visit(tree, (node) => {
		if (node.type === 'link' && node.url && !/^(?:#|\/|[a-z][a-z\d+.-]*:)/iu.test(node.url)) {
			unsupportedLinks.add(node.url);
		}
		if (node.type === 'image') replaceNode(node, node.url);
		if (node.type === 'definition' && imageDefinitions.has(node.identifier.toLowerCase())) {
			const target = resolve(node.url);
			if (target) replacements.push({ start: node.position.start.offset, end: node.position.end.offset,
				value: `[${node.label || node.identifier}]: ${target}${node.title ? ` "${escapeImageTitle(node.title)}"` : ''}` });
		}
		if (node.type === 'html' && /<img\b/iu.test(node.value)) {
			const value = node.value.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])(.*?)\2/giu,
				(match, prefix, quote, src) => {
					const target = resolve(src);
					return target ? `${prefix}${quote}${target}${quote}` : match;
				});
			if (value !== node.value) replacements.push({ start: node.position.start.offset, end: node.position.end.offset, value });
		}
	});

	let rewritten = body;
	for (const item of replacements.sort((a, b) => b.start - a.start)) {
		rewritten = rewritten.slice(0, item.start) + item.value + rewritten.slice(item.end);
	}
	rewritten = normalizeMarkdownMath(rewritten);

	const metadata = { ...original };
	for (const key of TYPORA_KEYS) delete metadata[key];
	delete metadata.date;
	delete metadata.excerpt;
	Object.assign(metadata, {
		title: resolvedTitle, description: resolvedDescription, published: resolvedDate,
		category: resolvedCategory, tags: resolvedTags, draft: true,
	});
	if (metadata.image) metadata.image = resolve(metadata.image) || metadata.image;
	const extras = Object.keys(original).filter((key) => !BLOG_KEYS.has(key) && !TYPORA_KEYS.has(key));
	const content = `---\n${YAML.stringify(metadata, { lineWidth: 0 }).trimEnd()}\n---\n\n${rewritten.trimStart()}`;
	return {
		slug, content, title: resolvedTitle, published: resolvedDate, category: resolvedCategory,
		metadata,
		description: resolvedDescription, tags: resolvedTags, missing: [...missing], unsupportedLinks: [...unsupportedLinks], extras,
		assets: [...used].map(([file, url]) => ({ file, url, path: `public${url}` })),
		body: rewritten,
	};
}
