const CITATION_PATTERN = /\[@([a-z0-9_.:-]+)(?:,\s*([^\]]+))?\]/giu;
const SKIP_NODE_TYPES = new Set([
	'code',
	'definition',
	'html',
	'inlineCode',
	'inlineMath',
	'link',
	'linkReference',
	'math',
]);

const normalizeKey = (value) => String(value ?? '').trim().toLocaleLowerCase('en-US');
const safeId = (value) =>
	normalizeKey(value)
		.replace(/[^a-z0-9_.:-]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'reference';

const text = (value) => ({ type: 'text', value });

const referenceChildren = (reference) => {
	const children = [];
	const authors = String(reference.authors ?? '').trim();
	const title = String(reference.title ?? '').trim();
	const venue = String(reference.venue ?? '').trim();
	const year = Number(reference.year) || 0;
	const doi = String(reference.doi ?? '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, '');
	const url = String(reference.url ?? '').trim() || (doi ? `https://doi.org/${doi}` : '');

	if (authors) children.push(text(`${authors}. `));
	if (year) children.push(text(`(${year}). `));
	if (title) children.push({ type: 'emphasis', children: [text(title)] });
	if (venue) children.push(text(`${title ? '. ' : ''}${venue}`));
	if (url) {
		children.push(text('. '));
		children.push({
			type: 'link',
			url,
			title: doi ? `DOI: ${doi}` : url,
			children: [text(doi ? `https://doi.org/${doi}` : url)],
		});
	}

	return children.length > 0 ? children : [text(String(reference.key ?? '未命名参考文献'))];
};

const transformCitations = (node, references, citedKeys) => {
	if (!Array.isArray(node?.children) || SKIP_NODE_TYPES.has(node.type)) return;

	for (let index = 0; index < node.children.length; index += 1) {
		const child = node.children[index];
		if (child.type !== 'text') {
			transformCitations(child, references, citedKeys);
			continue;
		}

		CITATION_PATTERN.lastIndex = 0;
		const matches = [...child.value.matchAll(CITATION_PATTERN)];
		if (matches.length === 0) continue;

		const replacement = [];
		let cursor = 0;
		for (const match of matches) {
			if (match.index > cursor) replacement.push(text(child.value.slice(cursor, match.index)));
			const key = normalizeKey(match[1]);
			const reference = references.get(key);
			if (!reference) {
				replacement.push(text(match[0]));
			} else {
				if (!citedKeys.includes(key)) citedKeys.push(key);
				const number = citedKeys.indexOf(key) + 1;
				const locator = String(match[2] ?? '').trim();
				replacement.push({
					type: 'link',
					url: `#ref-${safeId(key)}`,
					title: `${reference.authors || ''}${reference.authors ? '：' : ''}${reference.title || key}`,
					children: [text(`[${number}${locator ? `, ${locator}` : ''}]`)],
					data: {
						hProperties: {
							className: ['academic-citation'],
							'data-citation-key': key,
						},
					},
				});
			}
			cursor = match.index + match[0].length;
		}
		if (cursor < child.value.length) replacement.push(text(child.value.slice(cursor)));
		node.children.splice(index, 1, ...replacement);
		index += replacement.length - 1;
	}
};

export function remarkAcademicCitations() {
	return (tree, file) => {
		const configured = file.data.astro?.frontmatter?.references;
		if (!Array.isArray(configured) || configured.length === 0) return;

		const references = new Map();
		for (const reference of configured) {
			const key = normalizeKey(reference?.key);
			if (key && !references.has(key)) references.set(key, reference);
		}
		if (references.size === 0) return;

		const citedKeys = [];
		transformCitations(tree, references, citedKeys);
		if (citedKeys.length === 0) return;

		tree.children.push({ type: 'thematicBreak' });
		tree.children.push({
			type: 'heading',
			depth: 2,
			children: [text('参考文献')],
			data: { hProperties: { className: ['academic-references-title'] } },
		});
		tree.children.push({
			type: 'list',
			ordered: true,
			start: 1,
			spread: true,
			data: { hProperties: { className: ['academic-references'] } },
			children: citedKeys.map((key) => ({
				type: 'listItem',
				spread: false,
				data: { hProperties: { id: `ref-${safeId(key)}` } },
				children: [{ type: 'paragraph', children: referenceChildren(references.get(key)) }],
			})),
		});
	};
}
