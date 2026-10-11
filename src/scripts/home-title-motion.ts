let cleanup: (() => void) | undefined;

/** Pause the decorative color cycle outside the hero, in hidden tabs, or on request. */
export function setupHomeTitleMotion(): void {
	cleanup?.();
	cleanup = undefined;
	const title = document.querySelector<HTMLElement>(".home-hero-title");
	if (!title) return;
	const abort = new AbortController();
	let inView = false;
	const update = () => {
		const paused = document.querySelector("[data-hero-pause]")?.getAttribute("aria-pressed") === "true";
		title.dataset.motionActive = String(inView && !document.hidden && !paused);
	};
	const observer = new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting;
		update();
	});
	observer.observe(title);
	document.addEventListener("visibilitychange", update, { signal: abort.signal });
	document.addEventListener("click", (event) => {
		if ((event.target as Element)?.closest?.("[data-hero-pause]")) queueMicrotask(update);
	}, { signal: abort.signal });
	update();
	cleanup = () => { observer.disconnect(); abort.abort(); title.dataset.motionActive = "false"; };
}
