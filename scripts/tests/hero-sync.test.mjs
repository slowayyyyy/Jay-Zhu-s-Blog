import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const controller = ts.transpileModule(read("src/scripts/typewriter-controller.ts"), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const carousel = read("src/layouts/MainGridLayout.astro")
	.match(/<script is:inline data-swup-ignore-script>\s*\(function initBannerCarousel\(\)[\s\S]*?<\/script>/)[0]
	.replace(/^<script[^>]*>|<\/script>$/g, "");

class Event {
	constructor(type, options = {}) { Object.assign(this, options); this.type = type; this.defaultPrevented = false; }
	preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
}
class Target {
	listeners = new Map();
	addEventListener(type, fn, options = {}) {
		const list = this.listeners.get(type) || [];
		list.push({ fn, once: options.once }); this.listeners.set(type, list);
	}
	removeEventListener(type, fn) {
		this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item.fn !== fn));
	}
	dispatchEvent(event) {
		if (!event.target) event.target = this;
		for (const item of [...(this.listeners.get(event.type) || [])]) {
			if (item.once) this.removeEventListener(event.type, item.fn);
			item.fn(event);
		}
		if (event.bubbles && this.parent) this.parent.dispatchEvent(event);
		return !event.defaultPrevented;
	}
}
class Element extends Target {
	dataset = {};
	attrs = new Map();
	classes = new Set();
	style = {};
	isConnected = true;
	textContent = "";
	classList = {
		add: (...values) => values.forEach((v) => this.classes.add(v)),
		remove: (...values) => values.forEach((v) => this.classes.delete(v)),
		contains: (value) => this.classes.has(value),
	};
	getAttribute(name) { return this.attrs.get(name) ?? null; }
	setAttribute(name, value) { this.attrs.set(name, value); }
	removeAttribute(name) { this.attrs.delete(name); }
	hasAttribute(name) { return this.attrs.has(name); }
	querySelector() { return null; }
	closest() { return null; }
}
function harness(texts = ["短句", "下一段文字"], options = {}) {
	let now = 0, id = 0;
	const timers = new Map();
	const setTimeout = (fn, delay = 0) => { timers.set(++id, { fn, at: now + delay }); return id; };
	const clearTimeout = (key) => timers.delete(key);
	const tick = (ms) => {
		const end = now + ms;
		let count = 0;
		while (true) {
			const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
			if (!next) break;
			if (++count > 100000) throw new Error("Runaway timer");
			const [key, timer] = next;
			now = timer.at; timers.delete(key); timer.fn();
		}
		now = end;
	};
	const window = new Target();
	Object.assign(window, { innerWidth: 1280, setTimeout, clearTimeout });
	const media = Object.assign(new Target(), { matches: options.reduced || false });
	window.matchMedia = () => media;
	const document = Object.assign(new Target(), { hidden: false, documentElement: new Element() });
	document.documentElement.setAttribute("data-wallpaper-mode", "banner");
	const wrapper = new Element(), overlay = new Element(), container = new Element();
	container.dataset = { carouselInterval: "5000", carouselEnabled: "true", carouselSwitchable: "true", carouselEffect: "zoom" };
	const makeSlides = (count, mobile) => Array.from({ length: count }, (_, index) => {
		const slide = new Element(), img = new Element();
		img.complete = !options.delayed?.includes((mobile ? "m" : "d") + index);
		img.naturalWidth = img.complete ? 100 : 0;
		img.setAttribute(index ? "data-src" : "src", "/image-" + index + ".jpg");
		slide.dataset.index = String(index);
		slide.classList.add(mobile ? "lg:hidden" : "hidden");
		if (!index) slide.classList.add("active");
		slide.img = img;
		slide.querySelector = (selector) => selector.includes("img") ? img : null;
		return slide;
	});
	const desktop = makeSlides(options.images ?? 3, false);
	const mobile = makeSlides(2, true);
	container.querySelectorAll = () => [...mobile, ...desktop];
	const element = new Element();
	element.parent = window;
	element.dataset = { text: JSON.stringify(texts), speed: "100", deleteSpeed: "50", pauseTime: "2000", syncCarousel: "true" };
	element.closest = () => overlay;
	document.getElementById = (id) => ({ "banner-images-container": container, "wallpaper-wrapper": wrapper })[id] || null;
	document.querySelector = () => element.isConnected && element.dataset.typewriterReady === "true" && !overlay.classList.contains("hidden") ? element : null;
	const intersections = [];
	class IntersectionObserver {
		constructor(callback) { this.callback = callback; intersections.push(this); }
		observe() {}
		disconnect() {}
		trigger(isIntersecting) { this.callback([{ isIntersecting }]); }
	}
	class MutationObserver { constructor(callback) { this.callback = callback; } observe() {} disconnect() {} }
	const context = vm.createContext({
		window, document, console, exports: {}, Intl, performance: { now: () => now },
		setTimeout, clearTimeout, CustomEvent: Event, IntersectionObserver, MutationObserver,
		localStorage: { getItem: () => null }, HTMLElement: Element,
		HTMLInputElement: class {}, HTMLTextAreaElement: class {}, HTMLSelectElement: class {},
	});
	if (options.carousel !== false) vm.runInContext(carousel, context);
	vm.runInContext(controller, context);
	const writer = new context.exports.TypewriterEffect(element);
	const index = () => (window.innerWidth >= 1024 ? desktop : mobile).findIndex((s) => s.classList.contains("active"));
	const boundaries = [];
	// Event listener order: carousel commits the image before this records text.
	element.addEventListener("hero:cycle", (event) => {
		const resume = event.detail.resume;
		event.detail.resume = () => {
			resume();
			boundaries.push({ time: now, image: index(), text: element.textContent });
		};
	});
	const emit = (target, type, detail) => target.dispatchEvent(new Event(type, { detail }));
	return { writer, element, desktop, mobile, window, document, media, overlay, intersections, boundaries, index, tick, emit, now: () => now };
}

test("different sentence lengths drive the exact image/first-character boundary without fixed-time drift", () => {
	const h = harness(["短句", "这是一段很长很长的测试文字".repeat(5), "👨‍👩‍👧‍👦好"]);
	h.tick(2249); assert.equal(h.index(), 0);
	h.tick(1);
	assert.deepEqual(h.boundaries[0], { time: 2250, image: 1, text: "这" });
	h.tick(5000); assert.equal(h.index(), 1, "fixed 5-second image timer must be disabled");
	h.tick(20000);
	assert.deepEqual(h.boundaries.slice(0, 3).map((b) => [b.image, b.text]), [[1, "这"], [2, "👨‍👩‍👧‍👦"], [0, "短"]]);
	assert.ok(h.boundaries[1].time - h.boundaries[0].time > 10000);
});

test("a slow image delays both the image and new sentence, then releases them in the same task", () => {
	const h = harness(undefined, { delayed: ["d1"] });
	h.tick(2250);
	assert.equal(h.index(), 0);
	assert.equal(h.element.textContent, "");
	h.tick(800);
	h.desktop[1].img.naturalWidth = 100;
	h.emit(h.desktop[1].img, "load");
	assert.deepEqual(h.boundaries[0], { time: 3050, image: 1, text: "下" });
});

test("failed image preserves the old picture and later cycles skip it", () => {
	const h = harness(["短句", "新句"], { delayed: ["d1"] });
	h.tick(2250);
	h.emit(h.desktop[1].img, "error");
	assert.equal(h.index(), 0);
	assert.equal(h.element.textContent, "新");
	h.tick(2250);
	assert.equal(h.index(), 2);
});

test("image loading has a bounded timeout and cannot freeze the text forever", () => {
	const h = harness(undefined, { delayed: ["d1"] });
	h.tick(7250);
	assert.equal(h.element.textContent, "下");
	assert.equal(h.index(), 0);
});

test("different image/text counts loop independently, never using text index as an image index", () => {
	const h = harness(["甲", "乙", "丙", "丁"]);
	h.tick(2100 * 8);
	assert.deepEqual(h.boundaries.map((b) => b.image), [1, 2, 0, 1, 2, 0, 1, 2]);
	assert.deepEqual(h.boundaries.map((b) => b.text), ["乙", "丙", "丁", "甲", "乙", "丙", "丁", "甲"]);
});

test("one sentence repeats in sync; one image or absent carousel still allows text to advance", () => {
	const oneText = harness(["甲"]);
	oneText.tick(2100);
	assert.equal(oneText.index(), 1); assert.equal(oneText.element.textContent, "甲");
	const oneImage = harness(["甲", "乙"], { images: 1 });
	oneImage.tick(2100);
	assert.equal(oneImage.index(), 0); assert.equal(oneImage.element.textContent, "乙");
	const noCarousel = harness(["甲", "乙"], { carousel: false });
	noCarousel.tick(2100); assert.equal(noCarousel.element.textContent, "乙");
});

test("hidden tab pauses both clocks, with no accumulated burst when it returns", () => {
	const h = harness(["长一点的测试句子", "下一句"]);
	h.tick(500);
	const previous = h.element.textContent;
	h.document.hidden = true; h.emit(h.document, "visibilitychange");
	h.tick(60000);
	assert.equal(h.element.textContent, previous); assert.equal(h.index(), 0);
	h.document.hidden = false; h.emit(h.document, "visibilitychange");
	h.tick(200);
	assert.equal(h.index(), 0);
	assert.equal(h.boundaries.length, 0);
	h.tick(5000); assert.ok(h.boundaries.length > 0);
});

test("reduced motion shows a full stable sentence and stops automatic picture transitions", () => {
	const h = harness(["静态完整句子", "下一句"], { reduced: true });
	h.tick(60000);
	assert.equal(h.element.textContent, "静态完整句子");
	assert.equal(h.index(), 0);
	assert.equal(h.boundaries.length, 0);
});

test("manual next/previous also switch sentence and image together", () => {
	const h = harness(["甲", "乙", "丙"]);
	h.tick(0);
	h.element.dispatchEvent(new Event("hero:skip", { detail: { direction: 1 } }));
	assert.equal(h.index(), 1); assert.equal(h.element.textContent, "乙");
	h.element.dispatchEvent(new Event("hero:skip", { detail: { direction: -1 } }));
	assert.equal(h.index(), 0); assert.equal(h.element.textContent, "甲");
});

test("resize cancels a stale desktop image request and next cycle uses mobile images", () => {
	const h = harness(["甲", "乙"], { delayed: ["d1"] });
	h.tick(2100);
	h.window.innerWidth = 390; h.emit(h.window, "resize");
	h.desktop[1].img.naturalWidth = 100; h.emit(h.desktop[1].img, "load");
	assert.equal(h.desktop[1].classList.contains("active"), false);
	h.tick(2100); assert.equal(h.index(), 1);
});

test("destroy cancels callbacks and a pending image cannot restart a removed sentence", () => {
	const h = harness(undefined, { delayed: ["d1"] });
	h.tick(2250);
	h.writer.destroy(); h.element.isConnected = false;
	h.desktop[1].img.naturalWidth = 100; h.emit(h.desktop[1].img, "load");
	h.tick(10000);
	assert.equal(h.element.textContent, "");
	assert.equal(h.desktop[1].classList.contains("active"), false);
});

test("scrolling out of view pauses both clocks and resumes the same sentence", () => {
	const h = harness(["稍微长一些的句子", "下一句"]);
	h.tick(300);
	h.intersections.forEach((observer) => observer.trigger(false));
	const previous = h.element.textContent;
	h.tick(30000);
	assert.equal(h.element.textContent, previous);
	assert.equal(h.index(), 0);
	h.intersections.forEach((observer) => observer.trigger(true));
	h.tick(6000);
	assert.ok(h.boundaries.length > 0);
});

test("pausing allows a manual step to display a complete sentence without restarting autoplay", () => {
	const h = harness(["甲乙", "丙丁"]);
	h.tick(0);
	h.emit(h.window, "hero:pause", { paused: true });
	h.element.dispatchEvent(new Event("hero:skip", { detail: { direction: 1 } }));
	assert.equal(h.index(), 1);
	assert.equal(h.element.textContent, "丙丁");
	h.tick(60000);
	assert.equal(h.index(), 1);
	assert.equal(h.element.textContent, "丙丁");
});
