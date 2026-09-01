const STAR = '*';
const SKIP_CHILD_TYPES = new Set(['code', 'inlineCode', 'html']);

const isStrongDelimiterAt = (text, index) =>
	text[index] === STAR &&
	text[index + 1] === STAR &&
	text[index - 1] !== STAR &&
	text[index + 2] !== STAR;

const isEmDelimiterAt = (text, index) =>
	text[index] === STAR &&
	text[index - 1] !== STAR &&
	text[index + 1] !== STAR;

const findDelimiter = (text, start, matcher, width) => {
	for (let index = start; index <= text.length - width; index += 1) {
		if (matcher(text, index)) return index;
	}

	return -1;
};

const isInlineContent = (value) => value.trim().length > 0 && !/^\s|\s$/u.test(value) && !value.includes('\n');

const createTextNode = (value) => ({ type: 'text', value });

const mergeTextNodes = (nodes) => {
	/** @type {Array<Record<string, any>>} */
	const merged = [];

	for (const node of nodes) {
		const previous = merged.at(-1);
		if (node.type === 'text' && previous?.type === 'text') {
			previous.value += node.value;
			continue;
		}

		merged.push(node);
	}

	return merged;
};

const splitEmphasisSegments = (text) => {
	/** @type {Array<Record<string, any>>} */
	const nodes = [];
	let cursor = 0;

	while (cursor < text.length) {
		const open = findDelimiter(text, cursor, isEmDelimiterAt, 1);
		if (open === -1) {
			nodes.push(createTextNode(text.slice(cursor)));
			break;
		}

		const close = findDelimiter(text, open + 1, isEmDelimiterAt, 1);
		if (close === -1) {
			nodes.push(createTextNode(text.slice(cursor)));
			break;
		}

		if (open > cursor) {
			nodes.push(createTextNode(text.slice(cursor, open)));
		}

		const value = text.slice(open + 1, close);
		if (isInlineContent(value)) {
			nodes.push({
				type: 'emphasis',
				children: [createTextNode(value)],
			});
		} else {
			nodes.push(createTextNode(text.slice(open, close + 1)));
		}

		cursor = close + 1;
	}

	return mergeTextNodes(nodes);
};

const splitStrongSegments = (text) => {
	/** @type {Array<Record<string, any>>} */
	const nodes = [];
	let cursor = 0;

	while (cursor < text.length) {
		const open = findDelimiter(text, cursor, isStrongDelimiterAt, 2);
		if (open === -1) {
			nodes.push(...splitEmphasisSegments(text.slice(cursor)));
			break;
		}

		const close = findDelimiter(text, open + 2, isStrongDelimiterAt, 2);
		if (close === -1) {
			nodes.push(...splitEmphasisSegments(text.slice(cursor)));
			break;
		}

		if (open > cursor) {
			nodes.push(...splitEmphasisSegments(text.slice(cursor, open)));
		}

		const value = text.slice(open + 2, close);
		if (isInlineContent(value)) {
			nodes.push({
				type: 'strong',
				children: splitEmphasisSegments(value),
			});
		} else {
			nodes.push(createTextNode(text.slice(open, close + 2)));
		}

		cursor = close + 2;
	}

	return mergeTextNodes(nodes);
};

const transformNode = (node) => {
	if (!node?.children || SKIP_CHILD_TYPES.has(node.type)) return;

	/** @type {Array<Record<string, any>>} */
	const nextChildren = [];

	for (const child of node.children) {
		if (child.type === 'text') {
			nextChildren.push(...splitStrongSegments(child.value));
			continue;
		}

		transformNode(child);
		nextChildren.push(child);
	}

	node.children = mergeTextNodes(nextChildren);
};

export function remarkTightInlineFormatting() {
	return (tree) => {
		transformNode(tree);
	};
}
