import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareTyporaImport, inspectTyporaMarkdown } from '../../src/scripts/typora-import-core.js';
import { applyTyporaCommand, typoraCommandForKey } from '../../src/scripts/admin-typora-shortcuts.js';
import { publishTyporaDraft, validateImportAssets } from '../../src/scripts/typora-import-publish.js';
import { remarkTyporaInline } from '../../src/lib/remark-typora-inline.mjs';
import { remarkTyporaToc, rehypeTyporaToc } from '../../src/lib/typora-toc.mjs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const markdownFile = { name: '我的文章.md', webkitRelativePath: '文章/我的文章.md' };
const photo = { name: '封面.png', webkitRelativePath: '文章/我的文章.assets/封面.png', size: 120, type: 'image/png' };

test('Typora import keeps body and maps local assets without touching fenced examples', () => {
	const markdown = `---
title: 洛琪希笔记
date: 2026-09-17
category: 学习笔记
tags: [Markdown, Typora]
typora-copy-images-to: 我的文章.assets
customKey: 留存
---
# 洛琪希笔记

普通正文 ~~删除线~~，==高亮==。

![图片](我的文章.assets/封面.png "说明")

\`\`\`md
![示例](不存在.png)
\`\`\`
`;
	const plan = prepareTyporaImport({ markdown, markdownFile, files: [markdownFile, photo] });
	assert.equal(plan.slug, '2026-09-17-洛琪希笔记');
	assert.equal(plan.assets.length, 1);
	assert.equal(plan.missing.length, 0);
	assert.match(plan.content, /draft: true/u);
	assert.match(plan.content, /customKey: 留存/u);
	assert.doesNotMatch(plan.content, /typora-copy-images-to/u);
	assert.match(plan.content, /!\[图片\]\(\/uploads\/typora\/2026-09-17-洛琪希笔记\/01-封面.png "说明"\)/u);
	assert.match(plan.content, /!\[示例\]\(不存在.png\)/u);
	assert.match(plan.content, /普通正文 ~~删除线~~，==高亮==/u);
});

test('missing local image prevents publish, external URLs remain unchanged', () => {
	const markdown = '# 标题\n\n![丢失](./missing.png)\n\n![远程](https://example.com/a.png)';
	const plan = prepareTyporaImport({ markdown, markdownFile, files: [markdownFile], category: '学习笔记' });
	assert.deepEqual(plan.missing, ['./missing.png']);
	assert.match(plan.content, /https:\/\/example.com\/a.png/u);
});

test('empty body is rejected and relative attachments are reported', () => {
	assert.throws(() => prepareTyporaImport({ markdown: '---\ntitle: 空文\n---\n', markdownFile, category: '学习笔记' }), /正文为空/u);
	const plan = prepareTyporaImport({ markdown: '# 文章\n\n[附件](./notes.pdf)', markdownFile, category: '学习笔记' });
	assert.deepEqual(plan.unsupportedLinks, ['./notes.pdf']);
});

test('reference-style and HTML image links can be resolved', () => {
	const markdown = '# 标题\n\n![图片][pic]\n\n[pic]: <我的文章.assets/封面.png>\n\n<img src="我的文章.assets/封面.png" alt="图">';
	const plan = prepareTyporaImport({ markdown, markdownFile, files: [markdownFile, photo], category: '学习笔记' });
	assert.equal(plan.assets.length, 1);
	assert.equal(plan.missing.length, 0);
	assert.match(plan.content, /\[pic\]: \/uploads\/typora\//u);
	assert.match(plan.content, /<img src="\/uploads\/typora\//u);
});

test('inspection extracts frontmatter and tolerates absent metadata', () => {
	const data = inspectTyporaMarkdown('---\ntitle: 你好\ntags: [甲, 乙]\n---\n正文');
	assert.equal(data.title, '你好');
	assert.deepEqual(data.tags, ['甲', '乙']);
	assert.equal(inspectTyporaMarkdown('# 标题\n\n一句描述').description, '一句描述');
});

test('formatting shortcuts preserve selection and Typora key map', () => {
	assert.deepEqual(applyTyporaCommand('abc', 0, 3, 'strike'), { value: '~~abc~~', start: 2, end: 5 });
	assert.equal(applyTyporaCommand('你好', 0, 2, 'heading2').value, '## 你好');
	assert.equal(applyTyporaCommand('a\nb', 0, 3, 'task').value, '- [ ] a\n- [ ] b');
	assert.equal(typoraCommandForKey({ metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, key: 'b' }, true), 'bold');
	assert.equal(typoraCommandForKey({ metaKey: false, ctrlKey: true, altKey: false, shiftKey: true, code: 'Backquote', key: '`' }, true), 'strike');
});

test('asset limits reject oversized images', () => {
	assert.throws(() => validateImportAssets([{ file: { name: 'large.png', size: 11 * 1024 * 1024 } }]), /10 MB/u);
});

test('Typora markup renders strikethrough, highlight, subscript and superscript', async () => {
	const processor = unified().use(remarkParse).use(remarkGfm).use(remarkTyporaInline).use(remarkRehype).use(rehypeStringify);
	const result = String(await processor.process('~~删除~~ ==高亮== H~2~O 和 X^2^。'));
	assert.match(result, /<del>删除<\/del>/u);
	assert.match(result, /<mark>高亮<\/mark>/u);
	assert.match(result, /<sub>2<\/sub>/u);
	assert.match(result, /<sup>2<\/sup>/u);
});

test('[toc] uses the generated heading IDs', async () => {
	const processor = unified().use(remarkParse).use(remarkTyporaToc).use(remarkRehype)
		.use(() => (tree) => { tree.children[2].properties.id = '研究笔记'; })
		.use(rehypeTyporaToc).use(rehypeStringify);
	const html = String(await processor.process('[toc]\n\n## 研究笔记\n\n正文'));
	assert.match(html, /<nav aria-label="本文目录" class="typora-toc">/u);
	assert.match(html, /href="#研究笔记"/u);
});

test('GitHub import writes one fast-forward commit and never force-updates main', async () => {
	const originalFetch = globalThis.fetch;
	const calls = [];
	const reply = (payload, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => payload });
	globalThis.fetch = async (url, options) => {
		calls.push({ url, ...options });
		if (url.includes('/contents/src/content/posts/')) return reply({}, 404);
		if (url.includes('/git/ref/heads/main')) return reply({ object: { sha: 'base' } });
		if (url.includes('/git/commits/base')) return reply({ tree: { sha: 'base-tree' } });
		if (url.endsWith('/git/blobs')) return reply({ sha: 'article-blob' });
		if (url.endsWith('/git/trees')) return reply({ sha: 'next-tree' });
		if (url.endsWith('/git/commits')) return reply({ sha: 'next-commit' });
		if (url.endsWith('/git/refs/heads/main')) return reply({});
		throw new Error(`Unexpected API request: ${url}`);
	};
	try {
		const plan = prepareTyporaImport({ markdown: '# 文章\n\n正文', markdownFile, category: '学习笔记' });
		const result = await publishTyporaDraft(plan, { token: 'test-token' });
		assert.equal(result.sha, 'next-commit');
		const patch = calls.find((call) => call.method === 'PATCH');
		assert.equal(JSON.parse(patch.body).force, false);
		assert.match(calls.find((call) => call.url.endsWith('/git/blobs')).body, /draft: true/u);
		assert.equal(calls.filter((call) => call.method === 'PATCH').length, 1);
	} finally { globalThis.fetch = originalFetch; }
});
