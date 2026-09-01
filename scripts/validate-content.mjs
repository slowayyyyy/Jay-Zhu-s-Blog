import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const errors = [];
const warnings = [];

const toRelative = (file) => path.relative(root, file).replaceAll("\\", "/");

async function listFiles(directory, extensions) {
	const result = [];
	for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			result.push(...(await listFiles(fullPath, extensions)));
		} else if (extensions.has(path.extname(entry.name).toLowerCase())) {
			result.push(fullPath);
		}
	}
	return result;
}

async function readNamedJsonDirectory(directory, label) {
	const files = await listFiles(directory, new Set([".json"]));
	const names = new Set();
	for (const file of files) {
		try {
			const value = JSON.parse(await fs.readFile(file, "utf8"));
			const name = String(value.name ?? "").trim();
			if (!name) {
				errors.push(`${toRelative(file)}: ${label}名称不能为空`);
				continue;
			}
			if (names.has(name)) {
				errors.push(`${toRelative(file)}: ${label}“${name}”重复`);
			}
			names.add(name);
		} catch (error) {
			errors.push(`${toRelative(file)}: JSON 无法解析（${error.message}）`);
		}
	}
	return names;
}

async function assertLocalAsset(source, owner) {
	if (typeof source !== "string" || !source.startsWith("/")) return;
	if (source.startsWith("/media/")) return;
	const cleanSource = source.split(/[?#]/u, 1)[0];
	let decoded;
	try {
		decoded = decodeURIComponent(cleanSource);
	} catch {
		errors.push(`${owner}: 无法解析资源地址 ${source}`);
		return;
	}
	const diskPath = path.resolve(root, "public", decoded.replace(/^\/+/, ""));
	const publicRoot = path.resolve(root, "public");
	if (!diskPath.startsWith(`${publicRoot}${path.sep}`)) {
		errors.push(`${owner}: 资源地址越出了 public 目录：${source}`);
		return;
	}
	try {
		await fs.access(diskPath);
	} catch {
		errors.push(`${owner}: 找不到本地资源 ${source}`);
	}
}

function collectLocalAssets(value, result = []) {
	if (typeof value === "string") {
		if (value.startsWith("/uploads/") || value.startsWith("/assets/")) result.push(value);
		return result;
	}
	if (Array.isArray(value)) {
		for (const item of value) collectLocalAssets(item, result);
		return result;
	}
	if (value && typeof value === "object") {
		for (const item of Object.values(value)) collectLocalAssets(item, result);
	}
	return result;
}

const categoryNames = await readNamedJsonDirectory(
	path.join(root, "src/content/categories"),
	"分区",
);
const tagNames = await readNamedJsonDirectory(path.join(root, "src/content/tags"), "标签");
const postFiles = await listFiles(
	path.join(root, "src/content/posts"),
	new Set([".md", ".mdx"]),
);

for (const file of postFiles) {
	const relative = toRelative(file);
	try {
		const source = await fs.readFile(file, "utf8");
		const { data, content } = matter(source);
		if (!String(data.title ?? "").trim()) errors.push(`${relative}: 缺少标题`);
		if (!data.published || Number.isNaN(new Date(data.published).getTime())) {
			errors.push(`${relative}: 发布时间无效`);
		}
		const category = String(data.category ?? "").trim();
		if (category && !categoryNames.has(category)) {
			errors.push(`${relative}: 使用了未在“分区管理”中登记的分区“${category}”`);
		}
		for (const tag of Array.isArray(data.tags) ? data.tags : []) {
			if (!tagNames.has(String(tag))) {
				errors.push(`${relative}: 使用了未在“标签管理”中登记的标签“${tag}”`);
			}
		}
		if (data.seriesOrder != null && !String(data.series ?? "").trim()) {
			errors.push(`${relative}: 填写了系列顺序，但没有填写系列名称`);
		}
		if (data.passwordHint && !data.password) {
			warnings.push(`${relative}: 有密码提示但未设置阅读密码`);
		}
		if (/\b(?:blob:|file:)|data:image\//iu.test(source)) {
			errors.push(`${relative}: 正文包含临时或内嵌图片地址，请重新上传图片`);
		}

		const assets = new Set();
		if (typeof data.image === "string") assets.add(data.image);
		for (const match of content.matchAll(/(?:src=["']|\]\()([^"')\s]+)["')]/giu)) {
			assets.add(match[1]);
		}
		for (const asset of assets) await assertLocalAsset(asset, relative);
	} catch (error) {
		errors.push(`${relative}: Frontmatter 或正文无法解析（${error.message}）`);
	}
}

for (const relative of [
	"src/data/azure-content.json",
	"src/data/profile.json",
	"src/data/gallery.json",
	"src/data/friends.json",
]) {
	const file = path.join(root, relative);
	try {
		const value = JSON.parse(await fs.readFile(file, "utf8"));
		for (const asset of new Set(collectLocalAssets(value))) {
			await assertLocalAsset(asset, relative);
		}
	} catch (error) {
		errors.push(`${relative}: JSON 无法解析（${error.message}）`);
	}
}

for (const warning of warnings) console.warn(`[内容检查] 警告：${warning}`);
if (errors.length > 0) {
	for (const error of errors) console.error(`[内容检查] 错误：${error}`);
	console.error(`[内容检查] 失败：发现 ${errors.length} 个必须修复的问题。`);
	process.exit(1);
}

console.log(
	`[内容检查] 通过：${postFiles.length} 篇文章、${categoryNames.size} 个分区、${tagNames.size} 个标签。`,
);
