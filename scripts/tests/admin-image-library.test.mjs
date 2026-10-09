import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAdminImageLibrary } from "../../src/lib/admin-image-library.mjs";
import {
	filterImageLibrary,
	selectLibraryImage,
	setupImageCropWidget,
} from "../../src/scripts/admin-image-crop.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const mediaIndex = readJson("src/data/media-library.json");
const content = readJson("src/data/azure-content.json");

test("desktop I Miss You slide uses the indexed original with lettering", () => {
	const src = "/uploads/home-carousel-i-miss-you-original.webp";
	assert.equal(content.visuals.desktopWallpapers[3].crop.src, src);
	assert.equal(
		mediaIndex.assets.find((asset) => asset.src === src).usage,
		"当前桌面首页轮播",
	);
});

test("admin image library exposes indexed and other existing public images without duplicates", async () => {
	const images = await buildAdminImageLibrary(
		join(root, "public"),
		mediaIndex.assets,
	);
	const original = images.find(
		(image) => image.src === "/uploads/home-carousel-i-miss-you-original.webp",
	);
	const clean = images.find(
		(image) => image.src === "/uploads/home-carousel-miss-you-clean.webp",
	);
	assert.equal(original.name, "I Miss You 原版文字版");
	assert.equal(original.indexed, true);
	assert.equal(clean.indexed, true);
	assert.equal(images.filter((image) => image.src === original.src).length, 1);
	assert.ok(images.some((image) => !image.indexed));
	assert.ok(
		images.every(
			(image) =>
				image.src.startsWith("/uploads/") ||
				image.src.startsWith("/assets/images/"),
		),
	);
	assert.deepEqual(
		filterImageLibrary(images, "I Miss You 原版", true).map(
			(image) => image.src,
		),
		[original.src],
	);
	assert.ok(
		filterImageLibrary(images, "home-carousel-i-miss-you", false).some(
			(image) => image.src === original.src,
		),
	);
	assert.equal(filterImageLibrary(images, "不存在的图片", false).length, 0);
});

test("choosing an existing image resets stale framing and updates the CMS value", () => {
	const next = selectLibraryImage(
		{
			src: "/uploads/old.webp",
			positionX: 80,
			positionY: 25,
			zoom: 1.6,
		},
		"/uploads/home-carousel-i-miss-you-original.webp",
	);
	assert.deepEqual(next, {
		src: "/uploads/home-carousel-i-miss-you-original.webp",
		positionX: 50,
		positionY: 50,
		zoom: 1,
	});

	const originalWindow = globalThis.window;
	let control;
	try {
		globalThis.window = {
			createClass: (methods) => methods,
			h: () => null,
			CMS: {
				registerWidget: (_name, widget) => {
					control = widget;
				},
			},
		};
		setupImageCropWidget({});
		const instance = {
			props: {
				value: { src: "/uploads/old.webp", positionX: 80, zoom: 1.6 },
				onChange: (value) => {
					instance.saved = value;
				},
			},
			state: control.getInitialState(),
			setState(patch) {
				this.state = { ...this.state, ...patch };
			},
		};
		control.handleSelectLibraryImage.call(instance, {
			src: next.src,
			name: "原版文字版",
		});
		assert.deepEqual(instance.saved, next);
		assert.equal(instance.state.error, "");
	} finally {
		globalThis.window = originalWindow;
	}
});
