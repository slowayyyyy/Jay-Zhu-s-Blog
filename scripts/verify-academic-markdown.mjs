import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkAcademicCitations } from '../src/lib/remark-academic-citations.mjs';
import { remarkImagePresentation } from '../src/lib/remark-image-presentation.mjs';

const processor = await createMarkdownProcessor({
	remarkPlugins: [remarkMath, remarkImagePresentation, remarkAcademicCitations],
	rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false, trust: false }]],
	remarkRehype: {
		footnoteLabel: '脚注',
		footnoteBackLabel: '返回正文',
	},
	syntaxHighlight: {
		type: 'shiki',
		excludeLangs: ['math', 'mermaid'],
	},
});

const markdown = [
	String.raw`行内公式 $E = mc^2$，论文结论 [@vaswani2017, p. 3]。`,
	'',
	'上标 x<sup>2</sup>，下标 H<sub>2</sub>O。',
	'',
	'文字后紧跟图片：![示例图 | lg | center](/uploads/example.png)',
	'',
	'![模型结构 | md | center](/uploads/model.png "图 1 · 模型整体结构")',
	'',
	'$$',
	String.raw`\mathcal{L} = -\sum_{i=1}^{n} y_i \log \hat{y}_i`,
	'$$',
	'',
	'脚注示例。[^note]',
	'',
	'[^note]: 脚注内容。',
	'',
	'```mermaid',
	'flowchart LR',
	'  A --> B',
	'```',
	'',
	'```python',
	'print("hello")',
	'```',
].join('\n');

const { code } = await processor.render(markdown, {
	frontmatter: {
		references: [
			{
				key: 'vaswani2017',
				authors: 'Vaswani, A., et al.',
				title: 'Attention Is All You Need',
				venue: 'NeurIPS',
				year: 2017,
				doi: '10.48550/arXiv.1706.03762',
			},
		],
	},
});

const checks = {
	inlineMath: code.includes('<span class="katex">'),
	displayMath: code.includes('<span class="katex-display">'),
	superscript: code.includes('x<sup>2</sup>'),
	subscript: code.includes('H<sub>2</sub>O'),
	standaloneImage:
		code.includes('</p>\n<figure class="prose-media prose-media--lg prose-media--center">') &&
		!code.includes('文字后紧跟图片：<img'),
	imageCaption:
		code.includes('<figcaption class="prose-caption">图 1 · 模型整体结构</figcaption>') &&
		!code.includes('title="图 1 · 模型整体结构"') &&
		(code.match(/<figcaption\b/gu) ?? []).length === 1,
	footnote: code.includes('data-footnotes') && code.includes('脚注内容'),
	mermaid: code.includes('class="language-mermaid"') && code.includes('flowchart LR'),
	code: code.includes('print') && code.includes('class="astro-code'),
	citation: code.includes('class="academic-citation"') && code.includes('href="#ref-vaswani2017"'),
	bibliography:
		code.includes('class="academic-references"') && code.includes('Attention Is All You Need'),
};

const failures = Object.entries(checks)
	.filter(([, passed]) => !passed)
	.map(([name]) => name);

if (failures.length > 0) {
	throw new Error(`Academic Markdown verification failed: ${failures.join(', ')}`);
}

console.log(
	'Academic Markdown verification passed: math, image captions, superscript, subscript, Mermaid, footnotes, code, and citations.',
);
