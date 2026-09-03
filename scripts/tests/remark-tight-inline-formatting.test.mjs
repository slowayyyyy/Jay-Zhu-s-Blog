import assert from "node:assert/strict";
import test from "node:test";
import { remarkTightInlineFormatting } from "../../src/lib/remark-tight-inline-formatting.mjs";

const transform = (...children) => {
	const tree = { type: "root", children };
	remarkTightInlineFormatting()(tree);
	return tree;
};

test("converts CJK-adjacent asterisks into emphasis", () => {
	const tree = transform({
		type: "paragraph",
		children: [{ type: "text", value: "哲人说，*世界并不复杂。*他继续解释。" }],
	});

	assert.deepEqual(tree.children[0].children, [
		{ type: "text", value: "哲人说，" },
		{ type: "emphasis", children: [{ type: "text", value: "世界并不复杂。" }] },
		{ type: "text", value: "他继续解释。" },
	]);
});

test("keeps tight Chinese strong text working alongside emphasis", () => {
	const tree = transform({
		type: "paragraph",
		children: [{ type: "text", value: "前文**中文重点。**后文，*中文斜体。*继续" }],
	});

	assert.deepEqual(tree.children[0].children, [
		{ type: "text", value: "前文" },
		{
			type: "strong",
			children: [{ type: "text", value: "中文重点。" }],
		},
		{ type: "text", value: "后文，" },
		{ type: "emphasis", children: [{ type: "text", value: "中文斜体。" }] },
		{ type: "text", value: "继续" },
	]);
});

test("does not consume unmatched, spaced, code, or HTML asterisks", () => {
	const tree = transform(
		{ type: "paragraph", children: [{ type: "text", value: "保留*未闭合和 * 两侧空格 *" }] },
		{ type: "inlineCode", value: "*代码*" },
		{ type: "html", value: "<span>*HTML*</span>" },
	);

	assert.deepEqual(tree.children, [
		{ type: "paragraph", children: [{ type: "text", value: "保留*未闭合和 * 两侧空格 *" }] },
		{ type: "inlineCode", value: "*代码*" },
		{ type: "html", value: "<span>*HTML*</span>" },
	]);
});

test("preserves emphasis nodes already parsed by CommonMark", () => {
	const emphasis = { type: "emphasis", children: [{ type: "text", value: "已有斜体" }] };
	const tree = transform({ type: "paragraph", children: [emphasis] });

	assert.deepEqual(tree.children[0].children, [emphasis]);
});
