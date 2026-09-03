import assert from "node:assert/strict";
import test from "node:test";
import { getSeriesPosts } from "../../src/utils/series-utils";

test("series sorts by order then date, omits drafts and unrelated articles", () => {
	const post = (id: string, series: string, seriesOrder?: number, draft = false) => ({
		id, data: { series, seriesOrder, draft, published: new Date("2026-09-01") },
	});
	const input = [post("late", "读书"), post("second", "读书", 2), post("first", " 读书 ", 1), post("draft", "读书", 1, true), post("other", "随笔", 1)];
	assert.deepEqual(getSeriesPosts(input, "读书").map((p) => p.id), ["first", "second", "late"]);
	assert.equal(input[0].id, "late");
	assert.deepEqual(getSeriesPosts(input, ""), []);
});
