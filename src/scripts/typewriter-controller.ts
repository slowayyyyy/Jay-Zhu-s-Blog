export type HeroCycleDetail = {
	element: HTMLElement;
	direction: number;
	manual: boolean;
	resume: () => void;
};

/** One clock owns a sentence. The image carousel acknowledges its boundary,
 * so loading an image can never race a second, fixed-duration text timer. */
export class TypewriterEffect {
	private readonly texts: string[];
	private readonly segments: string[][];
	private readonly speed: number;
	private readonly deleteSpeed: number;
	private readonly pauseTime: number;
	private readonly syncCarousel: boolean;
	private readonly reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	private currentTextIndex = 0;
	private currentIndex = 0;
	private phase: "typing" | "deleting" | "advance" = "typing";
	private timer: number | null = null;
	private deadline = 0;
	private remaining = 0;
	private waiting = false;
	private visible = true;
	private paused = false;
	private destroyed = false;
	private version = 0;
	private observer?: IntersectionObserver;
	private mutations?: MutationObserver;

	constructor(private readonly element: HTMLElement) {
		const raw = element.dataset.text || "";
		let texts: unknown = raw;
		try { texts = JSON.parse(raw); } catch { /* A plain string is supported. */ }
		this.texts = (Array.isArray(texts) ? texts : [raw])
			.filter((text): text is string => typeof text === "string" && Boolean(text.trim()));
		const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
		this.segments = this.texts.map((text) => Array.from(segmenter.segment(text), (s) => s.segment));
		const duration = (value: string | undefined, fallback: number) => {
			const number = Number(value);
			return value !== undefined && Number.isFinite(number) && number >= 0 ? number : fallback;
		};
		this.speed = Math.max(16, duration(element.dataset.speed, 100));
		this.deleteSpeed = Math.max(16, duration(element.dataset.deleteSpeed, 50));
		this.pauseTime = Math.max(500, duration(element.dataset.pauseTime, 2000));
		this.syncCarousel = element.dataset.syncCarousel === "true";

		document.addEventListener("visibilitychange", this.refresh);
		this.reduced.addEventListener("change", this.motionChanged);
		element.addEventListener("hero:skip", this.skip);
		window.addEventListener("hero:pause", this.pause);
		this.observer = new IntersectionObserver(([entry]) => {
			this.visible = entry.isIntersecting;
			this.refresh();
		});
		this.observer.observe(element);
		this.mutations = new MutationObserver(this.refresh);
		this.mutations.observe(document.documentElement, { attributes: true, attributeFilter: ["data-wallpaper-mode", "data-banner-title-enabled", "data-bg-video-playing"] });
		const overlay = element.closest(".banner-home-text-overlay");
		if (overlay) this.mutations.observe(overlay, { attributes: true, attributeFilter: ["class"] });

		element.dataset.typewriterReady = "true";
		element.dispatchEvent(new CustomEvent("hero:typewriter-ready", { bubbles: true }));
		if (this.reduced.matches) this.showFullText();
		else this.schedule(0);
	}

	private canRun() {
		if (this.destroyed || !this.element.isConnected || document.hidden || !this.visible || this.paused || this.reduced.matches) return false;
		if (this.syncCarousel) {
			const overlay = this.element.closest(".banner-home-text-overlay");
			if (overlay?.classList.contains("hidden") || overlay?.classList.contains("user-hidden")) return false;
			if (document.documentElement.getAttribute("data-banner-title-enabled") === "false") return false;
			if (document.documentElement.hasAttribute("data-bg-video-playing")) return false;
		}
		return true;
	}

	private schedule(delay: number) {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.remaining = delay;
		if (!this.canRun() || this.waiting || !this.texts.length) return;
		this.deadline = performance.now() + delay;
		this.timer = window.setTimeout(() => {
			this.timer = null;
			this.remaining = 0;
			if (this.canRun()) this.step();
		}, delay);
	}

	private refresh = () => {
		if (!this.canRun()) {
			if (this.timer !== null) {
				this.remaining = Math.max(0, this.deadline - performance.now());
				window.clearTimeout(this.timer);
				this.timer = null;
			}
			return;
		}
		if (this.timer === null && !this.waiting) this.schedule(this.remaining);
	};

	private render() {
		this.element.textContent = (this.segments[this.currentTextIndex] || []).slice(0, this.currentIndex).join("");
	}

	private step() {
		const segments = this.segments[this.currentTextIndex] || [];
		if (this.phase === "advance") {
			this.advance(1, false);
		} else if (this.phase === "deleting") {
			this.currentIndex = Math.max(0, this.currentIndex - 1);
			this.render();
			if (this.currentIndex === 0) {
				this.phase = "advance";
				this.schedule(this.speed);
			} else this.schedule(this.deleteSpeed);
		} else {
			this.currentIndex = Math.min(segments.length, this.currentIndex + 1);
			this.render();
			if (this.currentIndex === segments.length) {
				if (this.texts.length > 1 || this.syncCarousel) {
					this.phase = "deleting";
					this.schedule(this.pauseTime);
				}
			} else this.schedule(this.speed);
		}
	}

	private advance(direction: number, manual: boolean) {
		if (!this.texts.length) return;
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.waiting = true;
		const version = ++this.version;
		const resume = () => {
			if (this.destroyed || version !== this.version || !this.waiting) return;
			this.waiting = false;
			this.currentTextIndex = (this.currentTextIndex + direction + this.texts.length) % this.texts.length;
			this.currentIndex = 0;
			this.phase = "typing";
			this.remaining = 0;
			// The image's active class and first character change in the same task.
			if (this.reduced.matches || this.paused) {
				this.showFullText();
				this.currentIndex = this.segments[this.currentTextIndex]?.length || 0;
				this.phase = "deleting";
				this.remaining = this.pauseTime;
			}
			else if (this.canRun()) this.step();
			else this.render();
		};
		const event = new CustomEvent<HeroCycleDetail>("hero:cycle", {
			bubbles: true, cancelable: true,
			detail: { element: this.element, direction, manual, resume },
		});
		if (!this.syncCarousel || this.element.dispatchEvent(event)) resume();
	}

	private skip = (event: Event) => {
		const direction = (event as CustomEvent<{ direction: number }>).detail?.direction;
		if (this.syncCarousel && (direction === 1 || direction === -1)) this.advance(direction, true);
	};

	private pause = (event: Event) => {
		if (!this.syncCarousel) return;
		this.paused = Boolean((event as CustomEvent<{ paused: boolean }>).detail?.paused);
		this.refresh();
	};

	private showFullText() {
		this.element.textContent = this.texts[this.currentTextIndex] || "";
	}

	private motionChanged = () => {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.version++;
		this.waiting = false;
		this.currentIndex = 0;
		this.phase = "typing";
		if (this.reduced.matches) this.showFullText();
		else this.schedule(0);
	};

	public destroy(): void {
		this.destroyed = true;
		this.version++;
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.observer?.disconnect();
		this.mutations?.disconnect();
		document.removeEventListener("visibilitychange", this.refresh);
		this.reduced.removeEventListener("change", this.motionChanged);
		this.element.removeEventListener("hero:skip", this.skip);
		window.removeEventListener("hero:pause", this.pause);
		delete this.element.dataset.typewriterReady;
	}
}
