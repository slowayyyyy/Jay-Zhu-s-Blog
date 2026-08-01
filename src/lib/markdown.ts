import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { remarkImagePresentation } from './remark-image-presentation.mjs';
import { remarkAcademicCitations } from './remark-academic-citations.mjs';
import { remarkTightInlineFormatting } from './remark-tight-inline-formatting.mjs';

let markdownProcessorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

function getMarkdownProcessor() {
	if (!markdownProcessorPromise) {
		markdownProcessorPromise = createMarkdownProcessor({
			remarkPlugins: [
				remarkMath,
				remarkTightInlineFormatting,
				remarkImagePresentation,
				remarkAcademicCitations,
			],
			rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false, trust: false }]],
			remarkRehype: {
				footnoteLabel: '脚注',
				footnoteBackLabel: '返回正文',
			},
			syntaxHighlight: {
				type: 'shiki',
				excludeLangs: ['math', 'mermaid'],
			},
			shikiConfig: {
				theme: 'github-dark-default',
				wrap: true,
			},
		});
	}

	return markdownProcessorPromise;
}

export async function renderPostMarkdown(content: string, frontmatter: Record<string, unknown>) {
	const processor = await getMarkdownProcessor();
	return processor.render(content, { frontmatter });
}

export async function renderMarkdownContent(content: string, frontmatter: Record<string, unknown> = {}) {
	const processor = await getMarkdownProcessor();
	return processor.render(content, { frontmatter });
}
