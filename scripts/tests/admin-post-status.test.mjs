import test from "node:test";
import assert from "node:assert/strict";
import {
	getPostSlugFromHref,
	getPostStatusFromCmsEntry,
	getPostStatusKinds,
	normalizePostStatus,
} from "../../src/scripts/admin-post-status.js";

test("visibility is mutually exclusive while pinned remains an independent status", () => {
	assert.deepEqual(
		getPostStatusKinds({ draft: false, password: "", pinned: false }),
		["public"],
	);
	assert.deepEqual(
		getPostStatusKinds({ draft: false, password: "secret", pinned: true }),
		["locked", "pinned"],
	);
	assert.deepEqual(
		getPostStatusKinds({ draft: true, password: "secret", pinned: true }),
		["hidden", "pinned"],
	);
});

test("normalization stores only whether a password exists and never returns the password", () => {
	const status = normalizePostStatus({
		slug: "src/content/posts/测试文章.md",
		password: "do-not-expose",
	});
	assert.deepEqual(status, {
		slug: "测试文章",
		draft: false,
		pinned: false,
		locked: true,
	});
	assert.equal("password" in status, false);
});

test("Decap entry links resolve unicode slugs without query fragments", () => {
	assert.equal(
		getPostSlugFromHref(
			"http://localhost:4321/admin/#/collections/posts/entries/2026-06-23-%E6%88%91%E7%9A%84%E7%AC%AC%E4%B8%80%E7%AF%87%E5%8D%9A%E5%AE%A2?view=compact",
		),
		"2026-06-23-我的第一篇博客",
	);
	assert.equal(
		getPostSlugFromHref("#/collections/dynamic/entries/example"),
		"",
	);
});

test("current editor data becomes an immediate status update after saving", () => {
	const data = new Map([
		["draft", false],
		["pinned", true],
		["password", "Roxy"],
	]);
	const entry = new Map([
		["slug", "2026-09-11-example"],
		["data", data],
	]);
	assert.deepEqual(getPostStatusFromCmsEntry(entry), {
		slug: "2026-09-11-example",
		draft: false,
		pinned: true,
		locked: true,
	});
});
