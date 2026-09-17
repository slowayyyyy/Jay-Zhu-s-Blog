import { visit } from 'unist-util-visit';

export function remarkTyporaToc() {
	return (tree) => {
		visit(tree, 'paragraph', (node) => {
			if (node.children.length !== 1 || node.children[0].type !== 'text') return;
			if (!/^\[toc\]$/iu.test(node.children[0].value.trim())) return;
			node.data = { ...node.data, hName: 'nav', hProperties: { 'data-typora-toc': true, 'aria-label': '本文目录' } };
			node.children = [];
		});
	};
}

const headingText = (node) => {
	let value = '';
	visit(node, 'text', (text) => { value += text.value; });
	return value.trim();
};

export function rehypeTyporaToc() {
	return (tree) => {
		const headings = [];
		visit(tree, 'element', (node) => {
			if (!/^h[1-6]$/u.test(node.tagName) || !node.properties?.id) return;
			headings.push({ level: Number(node.tagName[1]), id: String(node.properties.id), label: headingText(node) });
		});
		visit(tree, 'element', (node) => {
			if (node.tagName !== 'nav' || !('data-typora-toc' in (node.properties || {}))) return;
			node.properties = { ...node.properties, className: ['typora-toc'], 'aria-label': '本文目录' };
			delete node.properties['data-typora-toc'];
			node.children = [
			{ type: 'element', tagName: 'strong', properties: {}, children: [{ type: 'text', value: '本文目录' }] },
			{ type: 'element', tagName: 'ol', properties: {}, children: headings.map(({ level, id, label }) => ({
				type: 'element', tagName: 'li', properties: { className: [`typora-toc__level-${level}`] },
				children: [{ type: 'element', tagName: 'a', properties: { href: `#${id}` }, children: [{ type: 'text', value: label }] }],
			})) },
		];
		});
	};
}
