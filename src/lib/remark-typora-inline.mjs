import { visit } from 'unist-util-visit';

const INLINE_PATTERN = /(==([^=\n]+)==|\^([^\^\n]+)\^)/gu;

const textNode = (value) => ({ type: 'text', value });
const styledNode = (value, tagName) => ({
	type: 'emphasis',
	data: { hName: tagName },
	children: [textNode(value)],
});

const splitTyporaText = (value) => {
	const result = [];
	let cursor = 0;
	INLINE_PATTERN.lastIndex = 0;
	for (const match of value.matchAll(INLINE_PATTERN)) {
		if (match.index > cursor) result.push(textNode(value.slice(cursor, match.index)));
		const inner = match[2] || match[3];
		if (!inner.trim() || /^\s|\s$/u.test(inner)) {
			result.push(textNode(match[0]));
		} else {
			result.push(styledNode(inner, match[2] ? 'mark' : 'sup'));
		}
		cursor = match.index + match[0].length;
	}
	if (cursor < value.length) result.push(textNode(value.slice(cursor)));
	return result.length ? result : [textNode(value)];
};

export function remarkTyporaInline() {
	return (tree, file) => {
		const source = String(file?.value ?? file ?? '');
		visit(tree, 'delete', (node) => {
			const start = node.position?.start?.offset;
			const end = node.position?.end?.offset;
			if (start === undefined || end === undefined) return;
			const raw = source.slice(start, end);
			if (/^~(?!~)[\s\S]+(?<!~)~$/u.test(raw)) {
				node.type = 'emphasis';
				node.data = { ...node.data, hName: 'sub' };
			}
		});
		visit(tree, (node) => {
			if (!node.children || ['code', 'inlineCode', 'html'].includes(node.type)) return;
			const children = [];
			for (const child of node.children) {
				if (child.type === 'text') children.push(...splitTyporaText(child.value));
				else children.push(child);
			}
			node.children = children;
		});
	};
}
