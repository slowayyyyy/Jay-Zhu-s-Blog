/** Homepage navigation is revealed by intent; reading pages retain their normal nav. */
export function setupHomeNavigation(): void {
	const trigger = document.getElementById("home-navigation-trigger");
	if (!trigger || trigger.dataset.ready === "true") return;
	trigger.dataset.ready = "true";
	let pointerAtTop = false;
	let requestedOpen = false;
	let frame = 0;
	const homeContext = () => document.body.classList.contains("is-home") &&
		document.body.classList.contains("home-navigation-demand") &&
		["banner", "fullscreen"].includes(document.documentElement.dataset.wallpaperMode || "banner");
	const update = () => {
		frame = 0;
		const wrapper = document.getElementById("navbar-wrapper");
		const visible = !homeContext() || window.scrollY > 12 || pointerAtTop || requestedOpen ||
			Boolean(wrapper?.contains(document.activeElement));
		if (document.body.classList.contains("home-nav-visible") !== visible) {
			document.body.classList.toggle("home-nav-visible", visible);
		}
		trigger.setAttribute("aria-expanded", String(visible));
		trigger.setAttribute("aria-label", visible ? "收起导航栏" : "显示导航栏");
	};
	const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
	window.addEventListener("scroll", schedule, { passive: true });
	window.addEventListener("resize", schedule, { passive: true });
	document.addEventListener("pointermove", (event) => {
		if (event.pointerType !== "mouse") return;
		pointerAtTop = event.clientY <= 24 || Boolean((event.target as Element)?.closest?.("#top-row"));
		schedule();
	}, { passive: true });
	document.addEventListener("pointerleave", () => { pointerAtTop = false; schedule(); });
	document.addEventListener("focusin", schedule);
	document.addEventListener("focusout", schedule);
	trigger.addEventListener("click", () => { requestedOpen = !requestedOpen; update(); });
	document.addEventListener("click", (event) => {
		const target = event.target instanceof Element ? event.target : null;
		if (!target?.closest("#top-row, #home-navigation-trigger")) { requestedOpen = false; schedule(); }
		const copy = target?.closest<HTMLElement>("[data-hero-copy]");
		if (copy?.dataset.heroCopy) {
			const status = document.querySelector(".home-hero-status");
			if (!navigator.clipboard) { if (status) status.textContent = "当前浏览器不支持复制"; return; }
			navigator.clipboard.writeText(copy.dataset.heroCopy).then(() => {
				if (status) status.textContent = "已复制";
			}).catch(() => { if (status) status.textContent = "复制失败，请稍后重试"; });
		}
	});
	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape" || !homeContext()) return;
		requestedOpen = false;
		pointerAtTop = false;
		if (document.getElementById("navbar-wrapper")?.contains(document.activeElement)) trigger.focus();
		update();
	});
	const reset = () => { requestedOpen = false; pointerAtTop = false; schedule(); };
	document.addEventListener("swup:contentReplaced", reset);
	document.addEventListener("swup:page:view", reset);
	if (window.swup?.hooks) window.swup.hooks.on("page:view", reset);
	new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ["class"] });
	new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["data-wallpaper-mode"] });
	update();
}
