let cleanup: (() => void) | undefined;

/** Loaded by the shared layout, including when the first page is not the feed. */
export function setupDynamicFeed(): void {
	cleanup?.();
	cleanup = undefined;
	const shell = document.querySelector<HTMLElement>(".dynamic-shell");
	if (!shell) return;
	const abort = new AbortController();
	cleanup = () => abort.abort();
	const items = Array.from(shell.querySelectorAll<HTMLElement>(".dynamic-item"));
	const more = shell.querySelector<HTMLButtonElement>(".dynamic-load-more");
	const end = shell.querySelector<HTMLElement>(".dynamic-end-label");
	shell.querySelectorAll<HTMLImageElement>(".dynamic-content img").forEach((img) => {
		img.tabIndex = 0;
		img.setAttribute("role", "button");
		img.setAttribute("aria-label", `查看原图${img.alt ? `：${img.alt}` : ""}`);
	});
	shell.addEventListener("keydown", (event) => {
		if ((event.key === "Enter" || event.key === " ") && event.target instanceof HTMLImageElement && event.target.closest(".dynamic-content")) {
			event.preventDefault(); event.target.click();
		}
	}, { signal: abort.signal });
	let visibleCount = 6;
	const update = () => {
		items.forEach((item, index) => { item.hidden = index >= visibleCount; });
		if (more) more.hidden = visibleCount >= items.length;
		if (end) end.hidden = visibleCount < items.length;
	};
	const revealAnchor = () => {
		let anchor: string;
		try { anchor = decodeURIComponent(location.hash.slice(1)); } catch { return; }
		const index = items.findIndex((item) => item.id === anchor);
		if (index >= visibleCount) { visibleCount = index + 1; update(); }
	};
	more?.addEventListener("click", () => { visibleCount += 6; update(); }, { signal: abort.signal });
	shell.addEventListener("click", async (event) => {
		const button = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-moment-share]") : null;
		if (!button?.dataset.momentShare) return;
		const permalink = new URL(location.href);
		permalink.hash = button.dataset.momentShare;
		const status = shell.querySelector<HTMLElement>(".dynamic-copy-status");
		try {
			await navigator.clipboard.writeText(permalink.href);
			if (status) status.textContent = "说说链接已复制";
		} catch {
			if (status) status.textContent = "无法复制，请点击这条说说的日期打开链接。";
		}
	}, { signal: abort.signal });
	window.addEventListener("hashchange", revealAnchor, { signal: abort.signal });
	update(); revealAnchor();
}
