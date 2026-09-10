const POST_ENTRY_LINK_SELECTOR = 'a[href*="#/collections/posts/entries/"]';
const STATUS_CONTAINER_ATTRIBUTE = "data-jay-post-statuses";

const STATUS_DEFINITIONS = {
	public: {
		label: "公开",
		icon: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.2 2.47 3.33 5.47 3.33 9S14.2 18.53 12 21m0-18C9.8 5.47 8.67 8.47 8.67 12S9.8 18.53 12 21M3.5 9h17m-17 6h17"/>',
	},
	locked: {
		label: "上锁",
		icon: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
	},
	hidden: {
		label: "隐藏",
		icon: '<path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.24A9.7 9.7 0 0 1 12 4c5.5 0 9 5 9 5a16.7 16.7 0 0 1-2.1 2.6M6.6 6.6C4.3 8.1 3 10 3 10s3.5 5 9 5c1 0 1.9-.16 2.7-.43"/>',
	},
	pinned: {
		label: "置顶",
		icon: '<path d="M9 4h6l-1 5 3 3H7l3-3-1-5Zm3 8v8"/>',
	},
};

const readValue = (source, key) => {
	if (!source) return undefined;
	if (typeof source.get === "function") return source.get(key);
	return source[key];
};

const normalizeSlug = (value) =>
	String(value ?? "")
		.trim()
		.replace(/^src\/content\/posts\//u, "")
		.replace(/\.(?:md|mdx)$/iu, "");

export const normalizePostStatus = (source = {}) => ({
	slug: normalizeSlug(source.slug ?? source.id ?? source.path),
	draft: source.draft === true,
	pinned: source.pinned === true,
	locked:
		typeof source.locked === "boolean"
			? source.locked
			: typeof source.password === "string" &&
				source.password.trim().length > 0,
});

export const getPostStatusKinds = (source) => {
	const status = normalizePostStatus(source);
	const primary = status.draft ? "hidden" : status.locked ? "locked" : "public";
	return status.pinned ? [primary, "pinned"] : [primary];
};

export const getPostSlugFromHref = (href) => {
	const match = String(href ?? "").match(
		/#\/collections\/posts\/entries\/([^/?#]+)/u,
	);
	if (!match) return "";
	try {
		return normalizeSlug(decodeURIComponent(match[1]));
	} catch {
		return normalizeSlug(match[1]);
	}
};

export const getPostStatusFromCmsEntry = (entry) => {
	const data = readValue(entry, "data");
	const path = readValue(entry, "path");
	const slug = readValue(entry, "slug") || path;
	return normalizePostStatus({
		slug,
		draft: readValue(data, "draft"),
		pinned: readValue(data, "pinned"),
		password: readValue(data, "password"),
	});
};

const createStatusIcon = (kind) => {
	const namespace = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(namespace, "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("aria-hidden", "true");
	svg.setAttribute("focusable", "false");
	svg.innerHTML = STATUS_DEFINITIONS[kind].icon;
	return svg;
};

const createStatusBadge = (kind) => {
	const badge = document.createElement("span");
	badge.dataset.kind = kind;
	badge.append(
		createStatusIcon(kind),
		document.createTextNode(STATUS_DEFINITIONS[kind].label),
	);
	return badge;
};

const renderStatusBadges = (anchor, status) => {
	const kinds = getPostStatusKinds(status);
	const signature = kinds.join(",");
	const existing = anchor.querySelector(`[${STATUS_CONTAINER_ATTRIBUTE}]`);
	if (existing?.dataset.signature === signature) return;

	const container = existing || document.createElement("span");
	container.setAttribute(STATUS_CONTAINER_ATTRIBUTE, "");
	container.dataset.signature = signature;
	container.setAttribute(
		"aria-label",
		`文章状态：${kinds.map((kind) => STATUS_DEFINITIONS[kind].label).join("，")}`,
	);
	container.title = kinds
		.map((kind) => STATUS_DEFINITIONS[kind].label)
		.join(" · ");
	container.replaceChildren(...kinds.map(createStatusBadge));

	if (!existing) anchor.append(container);
};

const installPostStatusStyles = () => {
	if (document.getElementById("jay-post-status-style")) return;
	const style = document.createElement("style");
	style.id = "jay-post-status-style";
	style.textContent = `
		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] {
			display: inline-flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 5px;
			margin-inline-start: 10px;
			vertical-align: middle;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] > span {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			min-height: 22px;
			padding: 1px 8px;
			border: 1px solid transparent;
			border-radius: 999px;
			font: 600 12px/18px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
			letter-spacing: 0;
			white-space: nowrap;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] svg {
			width: 13px;
			height: 13px;
			fill: none;
			stroke: currentColor;
			stroke-width: 1.8;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] [data-kind="public"] {
			border-color: #b8decf;
			background: #eaf6f0;
			color: #22634d;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] [data-kind="locked"] {
			border-color: #ead29b;
			background: #fff5dc;
			color: #76500e;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] [data-kind="hidden"] {
			border-color: #dcc7cd;
			background: #f6ecef;
			color: #6b4650;
		}

		a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] [data-kind="pinned"] {
			border-color: #b8dce5;
			background: #e9f6f8;
			color: #245f70;
		}

		@media (max-width: 640px) {
			a[href*="#/collections/posts/entries/"] [${STATUS_CONTAINER_ATTRIBUTE}] {
				display: flex;
				width: fit-content;
				margin: 6px 0 0;
			}
		}
	`;
	document.head.append(style);
};

export const setupPostStatusIndicators = (initialStatuses = []) => {
	const statuses = new Map();
	const storeStatus = (source) => {
		const status = normalizePostStatus(source);
		if (status.slug) statuses.set(status.slug, status);
		return status;
	};
	for (const source of initialStatuses) {
		storeStatus(source);
	}

	installPostStatusStyles();
	let scheduled = false;

	const decorate = (root = document) => {
		const anchors = [];
		if (
			root instanceof HTMLAnchorElement &&
			root.matches(POST_ENTRY_LINK_SELECTOR)
		) {
			anchors.push(root);
		}
		root.querySelectorAll?.(POST_ENTRY_LINK_SELECTOR).forEach((anchor) => {
			anchors.push(anchor);
		});

		for (const anchor of anchors) {
			const status = statuses.get(
				getPostSlugFromHref(anchor.getAttribute("href")),
			);
			if (status) renderStatusBadges(anchor, status);
		}
	};

	const scheduleDecorate = () => {
		if (scheduled) return;
		scheduled = true;
		window.requestAnimationFrame(() => {
			scheduled = false;
			decorate();
		});
	};

	const observer = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => mutation.addedNodes.length > 0))
			scheduleDecorate();
	});
	observer.observe(document.body, { childList: true, subtree: true });
	decorate();

	return {
		refresh: decorate,
		updateFromEntry(entry) {
			const status = storeStatus(getPostStatusFromCmsEntry(entry));
			if (!status.slug) return;
			scheduleDecorate();
		},
		destroy() {
			observer.disconnect();
		},
	};
};
