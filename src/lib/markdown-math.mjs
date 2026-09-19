const DISPLAY_WRAPPERS = [
	/^\s*\\\[\s*([\s\S]*?)\s*\\\]\s*$/u,
	/^\s*\$\$\s*([\s\S]*?)\s*\$\$\s*$/u,
];

const INLINE_WRAPPERS = [
	/^\s*\\\(\s*([\s\S]*?)\s*\\\)\s*$/u,
	/^\s*\$([^$][\s\S]*?)\$\s*$/u,
];

export function unwrapMathDelimiters(value, displayMode = true) {
	let normalized = String(value ?? "").trim();
	const wrappers = displayMode ? DISPLAY_WRAPPERS : INLINE_WRAPPERS;
	let changed = true;

	while (changed && normalized) {
		changed = false;
		for (const wrapper of wrappers) {
			const match = normalized.match(wrapper);
			if (!match) continue;
			normalized = match[1].trim();
			changed = true;
			break;
		}
	}

	return normalized;
}

const normalizeMathChunk = (source) =>
	source
		.replace(
			/(^|\n)([ \t]*)\$\$[ \t]*\n[ \t]*\\\[[ \t]*\n?([\s\S]*?)\n?[ \t]*\\\][ \t]*\n[ \t]*\$\$(?=\n|$)/gu,
			(_match, boundary, indent, formula) =>
				`${boundary}${indent}$$\n${unwrapMathDelimiters(formula, true)}\n${indent}$$`,
		)
		.replace(
			/(^|\n)([ \t]*)\\\[[ \t]*\n?([\s\S]*?)\n?[ \t]*\\\][ \t]*(?=\n|$)/gu,
			(_match, boundary, indent, formula) =>
				`${boundary}${indent}$$\n${unwrapMathDelimiters(formula, true)}\n${indent}$$`,
		);

export function normalizeMarkdownMath(source) {
	const lines = String(source ?? "")
		.replaceAll("\r\n", "\n")
		.split("\n");
	const output = [];
	let markdownChunk = [];
	let fence = null;

	const flushMarkdown = () => {
		if (!markdownChunk.length) return;
		output.push(normalizeMathChunk(markdownChunk.join("\n")));
		markdownChunk = [];
	};

	for (const line of lines) {
		const marker = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
		if (!fence && marker) {
			flushMarkdown();
			fence = { character: marker[0], length: marker.length };
			output.push(line);
			continue;
		}
		if (fence) {
			output.push(line);
			const closingMarker = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/u)?.[1];
			if (
				closingMarker?.[0] === fence.character &&
				closingMarker.length >= fence.length
			)
				fence = null;
			continue;
		}
		markdownChunk.push(line);
	}
	flushMarkdown();

	return output.join("\n");
}

export function remarkNormalizeMath() {
	return (tree) => {
		const syncRenderedValue = (node) => {
			const stack = Array.isArray(node?.data?.hChildren)
				? [...node.data.hChildren]
				: [];
			while (stack.length) {
				const child = stack.shift();
				if (child?.type === "text") {
					child.value = node.value;
					return;
				}
				if (Array.isArray(child?.children)) stack.unshift(...child.children);
			}
		};
		const visit = (node) => {
			if (node?.type === "math") {
				node.value = unwrapMathDelimiters(node.value, true);
				syncRenderedValue(node);
			}
			if (node?.type === "inlineMath") {
				node.value = unwrapMathDelimiters(node.value, false);
				syncRenderedValue(node);
			}
			if (Array.isArray(node?.children)) node.children.forEach(visit);
		};
		visit(tree);
	};
}
