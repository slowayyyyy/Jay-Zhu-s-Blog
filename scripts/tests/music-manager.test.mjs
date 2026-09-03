import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Execute the actual shipped inline manager, not a second implementation.
const source = readFileSync(new URL("../../src/components/features/MusicManager.astro", import.meta.url), "utf8");
const script = source.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)[1];
const flush = () => new Promise((resolve) => setImmediate(resolve));
function seeded(seed) {
	return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
async function player(count = 9, options = {}) {
	const events = [];
	const listeners = {};
	let audioCount = 0;
	const audio = {
		style: {}, paused: true, currentTime: 0, duration: 200, src: "",
		pause() { this.paused = true; },
		play() { this.paused = false; return options.play?.() || Promise.resolve(); },
		addEventListener(name, handler) { listeners[name] = handler; },
	};
	const playlist = Array.from({ length: count }, (_, index) => ({
		name: "Track " + index, artist: "Artist", url: "/media/audio/" + index + ".mp3",
		lrc: options.lrc || "", translations: options.translations || [],
	}));
	const window = { dispatchEvent(event) { events.push(event); } };
	const math = Object.create(Math);
	math.random = options.random || seeded(42);
	const context = vm.createContext({
		window, console, Math: math,
		managerConfigStr: JSON.stringify({
			mode: "local", localPlaylist: playlist, volume: 0.65,
			playMode: options.mode || "random", i18n: { error: "播放失败", noSongs: "暂无歌曲" },
		}),
		document: {
			createElement(tag) { assert.equal(tag, "audio"); audioCount++; return audio; },
			body: { appendChild() {} },
		},
		localStorage: { getItem() { return null; }, setItem() {} },
		CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
		fetch: options.fetch || (() => { throw new Error("Unexpected fetch"); }),
		requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
	});
	vm.runInContext(script, context);
	const manager = window.__fireflyMusic;
	await manager.init();
	return {
		manager, audio, events, listeners, context,
		index: () => manager.getState().currentIndex,
		audioCount: () => audioCount,
	};
}

test("nine tracks: all songs per round, no boundary repeat (30 seeds x 30 rounds)", async () => {
	for (let seed = 1; seed <= 30; seed++) {
		const p = await player(9, { random: seeded(seed) });
		let previous = -1;
		for (let round = 0; round < 30; round++) {
			const heard = [];
			for (let i = 0; i < 9; i++) {
				const current = p.index();
				assert.notEqual(current, previous);
				heard.push(current);
				previous = current;
				p.manager.playNext();
			}
			assert.equal(new Set(heard).size, 9, "seed " + seed + ", round " + round);
		}
	}
	await flush();
});

test("constant random values cannot trap playback in two songs", async () => {
	const p = await player(9, { random: () => 0 });
	const heard = [];
	for (let i = 0; i < 9; i++) { heard.push(p.index()); p.manager.playNext(); }
	assert.equal(new Set(heard).size, 9);
	await flush();
});

test("previous follows history; next retraces without consuming unplayed songs", async () => {
	const p = await player();
	const heard = [p.index()];
	for (let i = 0; i < 3; i++) { p.manager.playNext(); heard.push(p.index()); }
	p.manager.playPrev(); assert.equal(p.index(), heard[2]);
	p.manager.playPrev(); assert.equal(p.index(), heard[1]);
	p.manager.playNext(); assert.equal(p.index(), heard[2]);
	p.manager.playNext(); assert.equal(p.index(), heard[3]);
	for (let i = 0; i < 5; i++) { p.manager.playNext(); heard.push(p.index()); }
	assert.equal(new Set(heard).size, 9);
	await flush();
});

test("previous at first entry restarts it without inventing a random predecessor", async () => {
	const p = await player();
	const first = p.index();
	p.manager.playPrev();
	assert.equal(p.index(), first);
	await flush();
});

test("manual selection removes an unplayed song from this round's remaining queue", async () => {
	const p = await player();
	const first = p.index();
	const picked = (first + 4) % 9;
	p.manager.playTrackByIndex(picked);
	const heard = [first, picked];
	for (let i = 0; i < 7; i++) { p.manager.playNext(); heard.push(p.index()); }
	assert.equal(new Set(heard).size, 9);
	p.manager.playPrev(); assert.equal(p.index(), heard[7]);
	await flush();
});

test("manual selection after going back creates a new history branch", async () => {
	const p = await player();
	const first = p.index();
	p.manager.playNext(); const second = p.index();
	p.manager.playNext(); const third = p.index();
	p.manager.playPrev();
	const picked = Array.from({ length: 9 }, (_, i) => i).find((i) => ![first, second, third].includes(i));
	p.manager.playTrackByIndex(picked);
	p.manager.playPrev(); assert.equal(p.index(), second);
	p.manager.playNext(); assert.equal(p.index(), picked);
	p.manager.playNext(); assert.notEqual(p.index(), third);
	await flush();
});

test("list and repeat-one work; switching to random starts around current song", async () => {
	const p = await player(9, { mode: "list" });
	p.manager.playNext(); assert.equal(p.index(), 1);
	p.manager.playPrev(); assert.equal(p.index(), 0);
	p.manager.cyclePlayMode();
	p.listeners.ended(); assert.equal(p.index(), 0);
	p.manager.playNext(); assert.equal(p.index(), 1);
	p.manager.cyclePlayMode();
	const heard = [p.index()];
	for (let i = 0; i < 8; i++) { p.manager.playNext(); heard.push(p.index()); }
	assert.equal(new Set(heard).size, 9);
	await flush();
});

test("ended events consume the same queue as Next", async () => {
	const p = await player();
	const heard = [p.index()];
	for (let i = 0; i < 8; i++) { p.listeners.ended(); heard.push(p.index()); }
	assert.equal(new Set(heard).size, 9);
	await flush();
});

test("zero, one and two-track playlists have safe controls", async () => {
	const empty = await player(0);
	empty.manager.playNext(); empty.manager.playPrev(); empty.manager.togglePlay();
	assert.equal(empty.manager.getState().track, null);
	assert.equal(empty.audio.paused, true);
	const single = await player(1);
	for (let i = 0; i < 10; i++) { single.manager.playNext(); assert.equal(single.index(), 0); }
	const pair = await player(2);
	let prev = pair.index();
	for (let i = 0; i < 20; i++) { pair.manager.playNext(); assert.notEqual(pair.index(), prev); prev = pair.index(); }
	await flush();
});

test("invalid indices ignored; re-evaluation cannot create a second audio element", async () => {
	const p = await player();
	const initial = p.index();
	for (const index of [-1, 9, NaN, 1.5, "2"]) p.manager.playTrackByIndex(index);
	assert.equal(p.index(), initial);
	vm.runInContext(script, p.context);
	await p.manager.init();
	assert.equal(p.audioCount(), 1);
});

test("stale play rejections after rapid Next cannot mark the new song failed", async () => {
	const pending = [];
	const p = await player(9, { play: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) });
	p.manager.playNext(); p.manager.playNext();
	pending[1].resolve(); pending[0].reject(new Error("old source"));
	await flush();
	assert.equal(p.manager.getState().isPlaying, true);
	assert.equal(p.manager.getState().error, null);
});

test("inline LRC supports seconds, tenths, centiseconds, milliseconds and translations", async () => {
	const p = await player(1, {
		lrc: "[00:01]a\n[00:02.5]b\n[00:03.25]c\n[00:04.125]d",
		translations: ["甲", "乙", "丙", "丁"],
	});
	const lyrics = JSON.parse(JSON.stringify(p.manager.getState().lyrics));
	assert.deepEqual(lyrics.map((line) => line.time), [1, 2.5, 3.25, 4.125]);
	assert.deepEqual(lyrics.map((line) => line.translation), ["甲", "乙", "丙", "丁"]);
});

test("karaoke JSON retains word timing and user translations", async () => {
	const p = await player(1, {
		lrc: JSON.stringify({ format: "karaoke-v1", lines: [{ time: 1, end: 3, text: "歌", words: [{ text: "歌", start: 0, duration: 2 }] }] }),
		translations: ["用户翻译"],
	});
	const line = p.manager.getState().lyrics[0];
	assert.equal(line.words[0].duration, 2);
	assert.equal(line.translation, "用户翻译");
});
