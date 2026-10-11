import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../../src/scripts/immersive-home.ts", import.meta.url), "utf8"), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

class Target {
	listeners = new Map();
	addEventListener(name, callback) {
		const list = this.listeners.get(name) || [];
		list.push(callback); this.listeners.set(name, list);
	}
	emit(name, event = {}) { for (const fn of this.listeners.get(name) || []) fn(event); }
}
class Element extends Target {
	dataset = {};
	classes = new Set();
	attrs = new Map();
	classList = {
		contains: (name) => this.classes.has(name),
		toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name),
	};
	setAttribute(name, value) { this.attrs.set(name, value); }
	closest() { return null; }
	contains(element) { return element === this; }
}
function harness() {
	const document = new Target(), window = new Target();
	window.scrollY = 0;
	document.body = new Element();
	document.body.classes = new Set(["is-home", "home-navigation-demand"]);
	document.documentElement = new Element();
	document.documentElement.dataset.wallpaperMode = "banner";
	const trigger = new Element(), wrapper = new Element(), outside = new Element();
	trigger.closest = () => trigger;
	trigger.focus = () => { document.activeElement = trigger; };
	document.activeElement = outside;
	document.getElementById = (id) => ({ "home-navigation-trigger": trigger, "navbar-wrapper": wrapper })[id] || null;
	document.querySelector = () => null;
	const frames = new Map();
	let id = 0;
	const exports = {};
	vm.runInNewContext(code, {
		exports, document, window, Element,
		requestAnimationFrame: (callback) => { frames.set(++id, callback); return id; },
		MutationObserver: class { observe() {} },
	});
	exports.setupHomeNavigation();
	const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn()); };
	const emit = (target, name, event) => { target.emit(name, event); flush(); };
	return {
		window, document, trigger, wrapper, outside, emit,
		visible: () => document.body.classList.contains("home-nav-visible"),
		init: exports.setupHomeNavigation,
	};
}
test("home navigation is hidden initially and reveals only at the top or after scrolling", () => {
	const h = harness();
	assert.equal(h.visible(), false);
	h.emit(h.document, "pointermove", { pointerType: "mouse", clientY: 8, target: h.outside });
	assert.equal(h.visible(), true);
	h.emit(h.document, "pointermove", { pointerType: "mouse", clientY: 300, target: h.outside });
	assert.equal(h.visible(), false);
	h.window.scrollY = 100;
	h.emit(h.window, "scroll");
	assert.equal(h.visible(), true);
	h.window.scrollY = 0;
	h.emit(h.window, "scroll");
	assert.equal(h.visible(), false);
});
test("touch movement does not accidentally reveal navigation; explicit entry works", () => {
	const h = harness();
	h.emit(h.document, "pointermove", { pointerType: "touch", clientY: 8, target: h.outside });
	assert.equal(h.visible(), false);
	h.emit(h.trigger, "click");
	assert.equal(h.visible(), true);
	assert.equal(h.trigger.attrs.get("aria-expanded"), "true");
	h.emit(h.document, "click", { target: h.outside });
	assert.equal(h.visible(), false);
});
test("Escape closes navigation without trapping a keyboard user in a hidden link", () => {
	const h = harness();
	h.document.activeElement = h.wrapper;
	h.emit(h.document, "focusin");
	assert.equal(h.visible(), true);
	h.emit(h.document, "keydown", { key: "Escape" });
	assert.equal(h.visible(), false);
	assert.equal(h.document.activeElement, h.trigger);
});
test("inner pages and non-image modes keep navigation available", () => {
	const h = harness();
	h.document.body.classes.delete("is-home");
	h.emit(h.document, "swup:page:view");
	assert.equal(h.visible(), true);
	h.document.body.classes.add("is-home");
	h.document.documentElement.dataset.wallpaperMode = "none";
	h.emit(h.document, "swup:page:view");
	assert.equal(h.visible(), true);
	h.document.documentElement.dataset.wallpaperMode = "banner";
	h.emit(h.document, "swup:page:view");
	assert.equal(h.visible(), false);
});
test("turning on-demand navigation off keeps the ordinary navigation visible", () => {
	const h = harness();
	h.document.body.classes.delete("home-navigation-demand");
	h.emit(h.document, "swup:page:view");
	assert.equal(h.visible(), true);
});
test("repeated setup does not add duplicate global event handlers", () => {
	const h = harness();
	h.init();
	assert.equal(h.document.listeners.get("pointermove").length, 1);
	assert.equal(h.trigger.listeners.get("click").length, 1);
	h.emit(h.trigger, "click");
	assert.equal(h.visible(), true);
});
