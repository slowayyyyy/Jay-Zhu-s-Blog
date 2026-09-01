const DEFAULT_SIZE = 'md';
const DEFAULT_ALIGN = 'left';

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

const createFigureCaption = (value) => ({
	type: 'paragraph',
	data: {
		hName: 'figcaption',
		hProperties: {
			className: ['prose-caption'],
		},
	},
	children: [{ type: 'text', value }],
});

const hasVisibleContent = (children) =>
	children.some((child) => child.type !== 'text' || child.value.trim().length > 0);

const splitParagraphAroundImages = (paragraph) => {
	const segments = [];
	let inlineChildren = [];

	const flushInlineChildren = () => {
		if (hasVisibleContent(inlineChildren)) {
			segments.push({ ...paragraph, children: inlineChildren });
		}
		inlineChildren = [];
	};

	for (const child of paragraph.children) {
		if (child?.type !== 'image') {
			inlineChildren.push(child);
			continue;
		}

		flushInlineChildren();
		const caption = typeof child.title === 'string' ? child.title.trim() : '';
		if (caption) child.title = null;
		const presentation = applyImagePresentation(child);
		const figure = {
			...paragraph,
			children: caption ? [child, createFigureCaption(caption)] : [child],
		};
		applyFigurePresentation(figure, presentation);
		segments.push(figure);
	}

	flushInlineChildren();
	return segments;
};

const visitTree = (node) => {
	if (!node?.children) return;

	const nextChildren = [];
	for (const child of node.children) {
		if (child?.type === 'paragraph' && child.children?.some((item) => item?.type === 'image')) {
			const segments = splitParagraphAroundImages(child);
			for (const segment of segments) {
				visitTree(segment);
				nextChildren.push(segment);
			}
			continue;
		}

		visitTree(child);
		nextChildren.push(child);
	}

	node.children = nextChildren;
};

export function remarkImagePresentation() {
	return (tree) => {
		visitTree(tree);
	};
}
