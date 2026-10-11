import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../../src/scripts/home-title-motion.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness() {
	const title = { dataset: {} }, button = { pressed: "false", getAttribute() { return this.pressed; } };
	const listeners = [], observers = [];
	const document = {
		hidden: false, title,
		querySelector: (selector) => selector === ".home-hero-title" ? document.title : button,
		addEventListener: (name, callback, options) => listeners.push({ name, callback, signal: options.signal }),
	};
	const exports = {};
	vm.runInNewContext(code, {
		exports, document, AbortController, queueMicrotask,
		IntersectionObserver: class {
			constructor(callback) { this.callback = callback; observers.push(this); }
			observe(target) { this.target = target; }
			disconnect() { this.disconnected = true; }
		},
	});
	exports.setupHomeTitleMotion();
	const emit = (name, event = {}) => listeners.filter((l) => l.name === name && !l.signal.aborted).forEach((l) => l.callback(event));
	return { title, button, document, observers, emit, setup: exports.setupHomeTitleMotion };
}

test("title motion only runs while visible and pauses in hidden tabs", () => {
	const h = harness();
	assert.equal(h.title.dataset.motionActive, "false");
	h.observers[0].callback([{ isIntersecting: true }]);
	assert.equal(h.title.dataset.motionActive, "true");
	h.document.hidden = true; h.emit("visibilitychange");
	assert.equal(h.title.dataset.motionActive, "false");
	h.document.hidden = false; h.emit("visibilitychange");
	assert.equal(h.title.dataset.motionActive, "true");
	h.observers[0].callback([{ isIntersecting: false }]);
	assert.equal(h.title.dataset.motionActive, "false");
});

test("hero pause button pauses and resumes the title too", async () => {
	const h = harness();
	h.observers[0].callback([{ isIntersecting: true }]);
	h.button.pressed = "true";
	h.emit("click", { target: { closest: () => h.button } });
	await Promise.resolve();
	assert.equal(h.title.dataset.motionActive, "false");
	h.button.pressed = "false";
	h.emit("click", { target: { closest: () => h.button } });
	await Promise.resolve();
	assert.equal(h.title.dataset.motionActive, "true");
});

test("Swup reinitialization releases old observers and listeners", () => {
	const h = harness();
	h.setup();
	assert.equal(h.observers[0].disconnected, true);
	h.observers[1].callback([{ isIntersecting: true }]);
	h.document.hidden = true; h.emit("visibilitychange");
	assert.equal(h.title.dataset.motionActive, "false");
	h.document.title = null; h.setup();
	assert.equal(h.observers[1].disconnected, true);
});

test("reduced motion and small moment previews remain scoped to their surfaces", () => {
	const css = readFileSync(new URL("../../src/styles/immersive-home.css", import.meta.url), "utf8");
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*#wallpaper-wrapper \.home-hero-title \.home-title-glitch-layer \{ animation: none; opacity: 0;/);
	assert.doesNotMatch(css, /home-title-colors/);
	assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/);
	assert.match(css, /:hover \.home-title-glitch-blue \{ animation: home-title-glitch-blue/);
	assert.match(css, /:hover \.home-title-glitch-red \{ animation: home-title-glitch-red/);
	const title = readFileSync(new URL("../../src/components/features/HomeHeroContent.astro", import.meta.url), "utf8");
	assert.equal((title.match(/aria-hidden="true">\{homeText.title\}/g) || []).length, 2);
	const page = readFileSync(new URL("../../src/pages/dynamic/index.astro", import.meta.url), "utf8");
	assert.match(page, /\.dynamic-content :global\(img\).*max-height: 240px/);
	assert.match(page, /max-width: min\(100%, 180px\)/);
	assert.match(page, /:global\(figcaption\).*contain: inline-size;.*text-align: center/);
	const layout = readFileSync(new URL("../../src/layouts/Layout.astro", import.meta.url), "utf8");
	assert.match(layout, /import \{ setupDynamicFeed \} from "@\/scripts\/dynamic-feed"/);
	assert.match(layout, /addEventListener\("astro:page-load", setupDynamicFeed\)/);
	assert.match(layout, /addEventListener\("astro:page-load", setupHomeTitleMotion\)/);
	const lightbox = readFileSync(new URL("../../src/components/features/FancyboxManager.astro", import.meta.url), "utf8");
	assert.match(lightbox, /IMG_SELECTOR = .*\.dynamic-content img/);
	assert.match(lightbox, /addEventListener\("astro:page-load", setup\)/);
});
