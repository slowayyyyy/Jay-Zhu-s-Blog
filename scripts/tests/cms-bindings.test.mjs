import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {
	ADMIN_ACTIVITY_TYPES,
	ADMIN_COLOR_OPTIONS,
	ADMIN_ICON_OPTIONS,
} from "../../src/scripts/admin-choice-options.js";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const data = JSON.parse(read("src/data/azure-content.json"));
const yaml = createRequire(import.meta.resolve("astro/package.json"))("yaml");
const cms = yaml.parse(read("public/admin/config.yml"));
const azureFields = cms.collections
	.find((c) => c.name === "site_settings")
	.files.find((f) => f.name === "azure").fields;

// Simulate changed CMS JSON in memory, without saving fake data to the user's files.
function config(path, content) {
	const source = ts.transpileModule(read(path), {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
			esModuleInterop: true,
		},
	}).outputText;
	const exports = {};
	vm.runInNewContext(source, {
		exports,
		require(specifier) {
			assert.match(specifier, /azure-content\.json$/);
			return content;
		},
	});
	return exports;
}
test("changed CMS title and short quotes reach the banner, with an empty-pool fallback", () => {
	const content = structuredClone(data);
	content.hero.title = "测试横幅";
	content.hero.subtitle = "备用短句";
	content.home.momentQuotes = [" 第一条 ", "", "第二条"];
	let actual = config(
		"src/config/backgroundWallpaper.ts",
		content,
	).backgroundWallpaper;
	assert.equal(actual.common.homeText.title, "测试横幅");
	assert.deepEqual(Array.from(actual.common.homeText.subtitle), [
		"第一条",
		"第二条",
	]);
	content.home.momentQuotes = [];
	content.visuals.backgroundVideo = "";
	actual = config(
		"src/config/backgroundWallpaper.ts",
		content,
	).backgroundWallpaper;
	assert.equal(actual.common.homeText.subtitle, "备用短句");
	assert.equal(actual.playerEnable, false);
	delete content.home.momentQuotes;
	assert.equal(
		config("src/config/backgroundWallpaper.ts", content).backgroundWallpaper
			.common.homeText.subtitle,
		"备用短句",
	);
});

test("music configuration excludes empty sources without disturbing track/cover/lyrics/translation pairing", () => {
	const content = structuredClone(data);
	content.playlist[0].src = "";
	const tracks = config("src/config/musicConfig.ts", content).musicPlayerConfig
		.local.playlist;
	assert.equal(tracks.length, data.playlist.length - 1);
	assert.equal(tracks[0].url, data.playlist[1].src);
	assert.equal(tracks[0].cover, data.playlist[1].cover);
	assert.equal(tracks[0].lrc, data.playlist[1].lrc);
	assert.deepEqual(tracks[0].translations, content.playlist[1].translations);
	content.playlist = [];
	assert.equal(
		config("src/config/musicConfig.ts", content).musicPlayerConfig.local
			.playlist.length,
		0,
	);
});

test("Umami public ID and script address use CMS settings; blank ID disables collection", () => {
	const content = structuredClone(data);
	content.integrations.umamiWebsiteId = " test-id ";
	content.integrations.umamiScriptUrl = "https://stats.example.com/script.js";
	let actual = config("src/config/analyticsConfig.ts", content).analyticsConfig
		.umamiAnalytics;
	assert.equal(actual.websiteId, "test-id");
	assert.equal(actual.scriptUrl, "https://stats.example.com/script.js");
	content.integrations.umamiWebsiteId = "";
	actual = config("src/config/analyticsConfig.ts", content).analyticsConfig
		.umamiAnalytics;
	assert.equal(actual.websiteId, "");
});

test("inactive opening and branch fields are hidden but still preserved in JSON", () => {
	assert.equal(azureFields.find((f) => f.name === "opening").widget, "hidden");
	assert.ok(data.opening);
	for (const name of ["hero", "home"]) {
		for (const field of azureFields
			.find((f) => f.name === name)
			.fields.filter((f) => f.widget === "hidden")) {
			assert.ok(Object.hasOwn(data[name], field.name), name + "." + field.name);
		}
	}
});

test("image crop lists bind the same nested values used by the frontend", () => {
	const visualsField = azureFields.find((field) => field.name === "visuals");
	for (const name of [
		"desktopWallpapers",
		"mobileWallpapers",
		"timeGreetingImages",
	]) {
		const cmsField = visualsField.fields.find((field) => field.name === name);
		assert.equal(cmsField.widget, "list");
		assert.equal(cmsField.fields.length, 1);
		assert.equal(cmsField.fields[0].name, "crop");
		assert.equal(cmsField.fields[0].widget, "image-crop");
		for (const item of data.visuals[name]) {
			assert.equal(typeof item.crop.src, "string");
			assert.ok(item.crop.src.startsWith("/"));
			assert.equal(typeof item.crop.positionX, "number");
			assert.equal(typeof item.crop.positionY, "number");
			assert.equal(typeof item.crop.zoom, "number");
		}
	}
});

test("visual CMS fields use understandable pickers and preserve every current value", () => {
	const files = cms.collections.find(
		(collection) => collection.name === "site_settings",
	).files;
	const profile = files.find((file) => file.name === "profile");
	const changelog = files.find((file) => file.name === "changelog");
	const tools = files.find((file) => file.name === "tools");
	const profileData = JSON.parse(read("src/data/profile.json"));
	const changelogData = JSON.parse(read("src/data/changelog.json"));
	const toolsData = JSON.parse(read("src/data/tools.json"));
	const iconValues = new Set(ADMIN_ICON_OPTIONS.map((option) => option.value));
	const colorValues = new Set(
		ADMIN_COLOR_OPTIONS.map((option) => option.value),
	);

	const links = profile.fields.find((field) => field.name === "links");
	const projects = profile.fields.find((field) => field.name === "projects");
	const activity = profile.fields.find(
		(field) => field.name === "recentActivity",
	);
	const entries = changelog.fields.find((field) => field.name === "entries");
	const toolItems = tools.fields
		.find((field) => field.name === "sections")
		.fields.find((field) => field.name === "items");

	for (const field of [links, projects, entries, toolItems]) {
		assert.equal(
			field.fields.find((item) => item.name === "icon").widget,
			"icon-picker",
		);
	}
	for (const field of [entries, toolItems]) {
		assert.equal(
			field.fields.find((item) => item.name === "accent").widget,
			"color-palette",
		);
	}
	assert.equal(
		projects.fields.find((field) => field.name === "tone").widget,
		"select",
	);
	const activityType = activity.fields.find((field) => field.name === "kind");
	assert.equal(activityType.widget, "select");
	assert.deepEqual(activityType.options, ADMIN_ACTIVITY_TYPES);

	for (const icon of [
		...profileData.links.map((item) => item.icon),
		...profileData.projects.map((item) => item.icon),
		...changelogData.entries.map((item) => item.icon),
		...toolsData.sections.flatMap((section) =>
			section.items.map((item) => item.icon),
		),
	]) {
		assert.ok(iconValues.has(icon), `missing current icon option: ${icon}`);
	}
	for (const accent of [
		...changelogData.entries.map((item) => item.accent),
		...toolsData.sections.flatMap((section) =>
			section.items.map((item) => item.accent),
		),
	]) {
		assert.ok(
			colorValues.has(accent),
			`missing current color option: ${accent}`,
		);
	}
	for (const item of profileData.recentActivity) {
		assert.ok(
			ADMIN_ACTIVITY_TYPES.includes(item.kind),
			`missing activity type: ${item.kind}`,
		);
	}
});

test("all CMS file collections point to real files; about metadata is accepted and consumed", () => {
	for (const collection of cms.collections) {
		for (const file of collection.files || [])
			assert.ok(existsSync(new URL(file.file, root)), file.file);
	}
	const about = cms.collections
		.find((c) => c.name === "about_settings")
		.files.find((f) => f.name === "about");
	const schema = read("src/content.config.ts");
	const page = read("src/pages/about.astro");
	for (const field of about.fields.filter((f) => f.name !== "body")) {
		assert.ok(
			schema.includes(field.name + ": z.string().optional()"),
			field.name + " schema",
		);
		assert.ok(
			page.includes("aboutData." + field.name),
			field.name + " rendering",
		);
	}
});

test("bundled songs retain existing local cover and lyric file paths", () => {
	for (const track of data.playlist || []) {
		for (const path of [track.cover, track.lrc]) {
			if (
				path?.startsWith("/") &&
				!path.startsWith("//") &&
				!path.startsWith("/media/")
			) {
				assert.ok(
					existsSync(new URL("public" + path, root)),
					track.name + " " + path,
				);
			}
		}
	}
});
