import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { remarkImagePresentation } from './remark-image-presentation.mjs';
import { remarkTightInlineFormatting } from './remark-tight-inline-formatting.mjs';

let markdownProcessorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

function getMarkdownProcessor() {
	if (!markdownProcessorPromise) {
		markdownProcessorPromise = createMarkdownProcessor({
			remarkPlugins: [remarkTightInlineFormatting, remarkImagePresentation],
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
