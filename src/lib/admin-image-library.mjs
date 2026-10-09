import { readdir } from "node:fs/promises";
import { join, posix } from "node:path";

const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu;
const IMAGE_FOLDERS = ["uploads", "assets/images"];

async function collectImages(directory, publicPath) {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") return [];
		throw error;
	}

	const images = [];
	for (const entry of entries) {
		const childPath = posix.join(publicPath, entry.name);
		if (entry.isDirectory()) {
			images.push(
				...(await collectImages(join(directory, entry.name), childPath)),
			);
		} else if (entry.isFile() && IMAGE_EXTENSION.test(entry.name)) {
			images.push(`/${childPath}`);
		}
	}
	return images;
}

export async function buildAdminImageLibrary(publicRoot, indexedAssets = []) {
	const paths = (
		await Promise.all(
			IMAGE_FOLDERS.map((folder) =>
				collectImages(join(publicRoot, folder), folder),
			),
		)
	).flat();
	const availablePaths = new Set(paths);
	const indexedPaths = new Set();
	const indexed = [];

	for (const asset of indexedAssets) {
		if (!availablePaths.has(asset.src) || indexedPaths.has(asset.src)) continue;
		indexedPaths.add(asset.src);
		indexed.push({
			src: asset.src,
			name: asset.name || posix.basename(asset.src),
			usage: asset.usage || "",
			kind: asset.kind || "图片",
			indexed: true,
		});
	}

	const other = paths
		.filter((path) => !indexedPaths.has(path))
		.sort((left, right) => left.localeCompare(right, "zh-CN"))
		.map((src) => ({
			src,
			name: posix.basename(src).replace(/\.[^.]+$/u, ""),
			usage: "站内已有图片",
			kind: src.toLowerCase().endsWith(".gif") ? "动图" : "图片",
			indexed: false,
		}));

	return [...indexed, ...other];
}
