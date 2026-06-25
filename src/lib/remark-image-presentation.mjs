const DEFAULT_SIZE = 'md';
const DEFAULT_ALIGN = 'center';

const SIZE_ALIASES = new Map([
	['xs', 'xs'],
	['mini', 'xs'],
	['tiny', 'xs'],
	['超小', 'xs'],
	['sm', 'sm'],
	['small', 'sm'],
	['小', 'sm'],
	['md', 'md'],
	['medium', 'md'],
	['default', 'md'],
	['中', 'md'],
	['默认', 'md'],
	['lg', 'lg'],
	['large', 'lg'],
	['大', 'lg'],
	['full', 'full'],
	['wide', 'full'],
	['全宽', 'full'],
	['铺满', 'full'],
]);

const ALIGN_ALIASES = new Map([
	['left', 'left'],
	['左', 'left'],
	['居左', 'left'],
	['center', 'center'],
	['centre', 'center'],
	['middle', 'center'],
	['中', 'center'],
	['居中', 'center'],
	['right', 'right'],
	['右', 'right'],
	['居右', 'right'],
]);

const toClassList = (value) =>
	Array.isArray(value)
		? value.filter(Boolean)
		: typeof value === 'string'
			? value.split(/\s+/u).filter(Boolean)
			: [];

const mergeClassNames = (current, additions) =>
	Array.from(new Set([...toClassList(current), ...additions.filter(Boolean)]));

const mergeStyleValue = (current, addition) => {
	if (!addition) return current;
	if (!current) return addition;
	const normalized = String(current).trim().replace(/;?\s*$/u, ';');
	return `${normalized} ${addition}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const sanitizeWidth = (rawValue) => {
	if (!rawValue) return null;
	const value = rawValue.trim().toLowerCase();

	if (/^\d+(?:\.\d+)?$/u.test(value)) {
		return `${clamp(Number(value), 20, 100)}%`;
	}

	const percentMatch = value.match(/^(\d+(?:\.\d+)?)%$/u);
	if (percentMatch) {
		return `${clamp(Number(percentMatch[1]), 20, 100)}%`;
	}

	const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/u);
	if (remMatch) {
		return `${clamp(Number(remMatch[1]), 8, 64)}rem`;
	}

	const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/u);
	if (pxMatch) {
		return `${clamp(Number(pxMatch[1]), 160, 1200)}px`;
	}

	const vwMatch = value.match(/^(\d+(?:\.\d+)?)vw$/u);
	if (vwMatch) {
		return `${clamp(Number(vwMatch[1]), 20, 100)}vw`;
	}

	return null;
};

const parseDirective = (token) => {
	const normalized = token.trim().toLowerCase();
	if (!normalized) return null;

	if (SIZE_ALIASES.has(normalized)) {
		return { type: 'size', value: SIZE_ALIASES.get(normalized) };
	}

	if (ALIGN_ALIASES.has(normalized)) {
		return { type: 'align', value: ALIGN_ALIASES.get(normalized) };
	}

	const widthMatch = normalized.match(/^(?:w|width|宽度)\s*=\s*(.+)$/u);
	if (widthMatch) {
		const width = sanitizeWidth(widthMatch[1]);
		if (width) return { type: 'width', value: width };
	}

	return null;
};

const parseImagePresentation = (rawAlt = '') => {
	const source = typeof rawAlt === 'string' ? rawAlt : '';
	const parts = source.split('|').map((part) => part.trim());
	if (parts.length === 1) {
		return {
			alt: source.trim(),
			size: DEFAULT_SIZE,
			align: DEFAULT_ALIGN,
			width: null,
		};
	}

	let alt = parts.shift() ?? '';
	let size = DEFAULT_SIZE;
	let align = DEFAULT_ALIGN;
	let width = null;
	let matchedDirective = false;
	const extraAltSegments = [];

	for (const token of parts) {
		const directive = parseDirective(token);
		if (!directive) {
			if (token) extraAltSegments.push(token);
			continue;
		}

		matchedDirective = true;
		if (directive.type === 'size') size = directive.value;
		if (directive.type === 'align') align = directive.value;
		if (directive.type === 'width') width = directive.value;
	}

	if (!matchedDirective) {
		return {
			alt: source.trim(),
			size: DEFAULT_SIZE,
			align: DEFAULT_ALIGN,
			width: null,
		};
	}

	if (extraAltSegments.length > 0) {
		alt = [alt, ...extraAltSegments].filter(Boolean).join(' | ');
	}

	return { alt, size, align, width };
};

const applyImagePresentation = (node) => {
	const presentation = parseImagePresentation(node.alt);
	node.alt = presentation.alt;

	const hProperties = {
		...(node.data?.hProperties ?? {}),
		loading: node.data?.hProperties?.loading ?? 'lazy',
		decoding: node.data?.hProperties?.decoding ?? 'async',
	};

	hProperties.className = mergeClassNames(hProperties.className, [
		'prose-image',
		`prose-image--${presentation.size}`,
		`prose-image--${presentation.align}`,
	]);

	if (presentation.width) {
		hProperties.style = mergeStyleValue(
			hProperties.style,
			`--prose-media-width: ${presentation.width}`,
		);
	}

	node.data = {
		...(node.data ?? {}),
		hProperties,
	};

	return presentation;
};

const applyFigurePresentation = (node, presentation) => {
	const hProperties = {
		...(node.data?.hProperties ?? {}),
	};

	hProperties.className = mergeClassNames(hProperties.className, [
		'prose-media',
		`prose-media--${presentation.size}`,
		`prose-media--${presentation.align}`,
	]);

	if (presentation.width) {
		hProperties.style = mergeStyleValue(
			hProperties.style,
			`--prose-media-width: ${presentation.width}`,
		);
	}

	node.data = {
		...(node.data ?? {}),
		hName: 'figure',
		hProperties,
	};
};

const visitTree = (node) => {
	if (!node?.children) return;

	if (node.type === 'paragraph') {
		const imageChildren = node.children.filter((child) => child?.type === 'image');
		if (imageChildren.length > 0) {
			if (node.children.length === 1 && node.children[0]?.type === 'image') {
				const presentation = applyImagePresentation(node.children[0]);
				applyFigurePresentation(node, presentation);
			} else {
				for (const child of imageChildren) {
					applyImagePresentation(child);
				}
			}
		}
	}

	for (const child of node.children) {
		visitTree(child);
	}
};

export function remarkImagePresentation() {
	return (tree) => {
		visitTree(tree);
	};
}
