import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { inflateSync } from "node:zlib";

const KRC_MAGIC = Buffer.from("krc1");
const KRC_KEY = Buffer.from([
	0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47,
	0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69,
]);

function decodeKrc(buffer) {
	if (!buffer.subarray(0, 4).equals(KRC_MAGIC)) {
		throw new Error("Unsupported KRC file: missing krc1 header");
	}

	const compressed = Buffer.from(buffer.subarray(4));
	for (let index = 0; index < compressed.length; index += 1) {
		compressed[index] ^= KRC_KEY[index % KRC_KEY.length];
	}

	return inflateSync(compressed).toString("utf8").replace(/^\uFEFF/, "");
}

function parseMeta(text) {
	const meta = {};
	for (const row of text.split(/\r?\n/)) {
		const match = row.match(/^\[([a-z]+):(.*)\]$/i);
		if (match) meta[match[1].toLowerCase()] = match[2].trim();
	}
	return meta;
}

function isCreditLine(text) {
	return /\s[-—]\s.+$/.test(text)
		|| /^(?:词|曲|编曲|作词|作曲|演唱|歌手)\s*[:：]/.test(text);
}

function parseLyrics(text) {
	const meta = parseMeta(text);
	const globalOffset = Number(meta.offset || 0) + Number(meta.manualoffset || 0);
	const lines = [];

	for (const row of text.split(/\r?\n/)) {
		const lineMatch = row.match(/^\[(\d+),(\d+)\](.*)$/);
		if (!lineMatch) continue;

		const lineStartMs = Number(lineMatch[1]) + globalOffset;
		const lineDurationMs = Number(lineMatch[2]);
		const words = [];
		const wordPattern = /<(\d+),(\d+),\d+>([^<]*)/g;
		let wordMatch;

		while ((wordMatch = wordPattern.exec(lineMatch[3])) !== null) {
			const wordOffsetMs = Number(wordMatch[1]);
			const durationMs = Number(wordMatch[2]);
			words.push({
				text: wordMatch[3],
				start: Math.max(0, lineStartMs + wordOffsetMs) / 1000,
				duration: durationMs / 1000,
			});
		}

		const lineText = words.map((word) => word.text).join("").trim();
		if (!lineText || isCreditLine(lineText)) continue;

		lines.push({
			time: Math.max(0, lineStartMs) / 1000,
			end: Math.max(0, lineStartMs + lineDurationMs) / 1000,
			text: lineText,
			words,
		});
	}

	return {
		format: "karaoke-v1",
		title: meta.ti || "",
		artist: meta.ar || "",
		lines,
	};
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
	throw new Error("Usage: node scripts/convert-krc.mjs <input.krc> <output.json>");
}

const decoded = decodeKrc(await readFile(inputPath));
const karaoke = parseLyrics(decoded);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(karaoke, null, 2)}\n`, "utf8");
console.log(`${karaoke.title}: ${karaoke.lines.length} timed lines -> ${outputPath}`);
