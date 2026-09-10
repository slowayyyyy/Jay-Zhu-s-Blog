import assert from "node:assert/strict";
import test from "node:test";
import {
	CODE_BLOCK_PATTERN,
	codeBlockFromMatch,
	codeBlockPreview,
	codeBlockToMarkdown,
} from "../../src/scripts/admin-code-block.js";

test("CMS code fields serialize to Expressive Code metadata", () => {
	const markdown = codeBlockToMarkdown({
		language: "typescript",
		code: "const answer: number = 42;",
		title: 'src/answer"demo.ts',
		wrap: true,
		showLineNumbers: false,
		startLineNumber: 8,
		highlightLines: "1, 3-4",
	});
	assert.equal(
		markdown,
		'```ts title="src/answer\\"demo.ts" wrap showLineNumbers=false startLineNumber=8 {1,3-4}\nconst answer: number = 42;\n```',
	);
});

test("longer fences preserve pasted code containing backtick runs", () => {
	const markdown = codeBlockToMarkdown({
		language: "markdown",
		code: "```js\nconsole.log(true)\n```",
	});
	assert.match(markdown, /^````md\n/u);
	assert.match(markdown, /\n````$/u);
	const match = markdown.match(CODE_BLOCK_PATTERN);
	assert.ok(match);
	assert.equal(codeBlockFromMatch(match).code, "```js\nconsole.log(true)\n```");
});

test("existing fenced code is read back into friendly editor fields", () => {
	const markdown =
		'```python title="train.py" wrap {2,4-5} startLineNumber=20\nprint("hello")\n```';
	const match = markdown.match(CODE_BLOCK_PATTERN);
	assert.ok(match);
	assert.deepEqual(codeBlockFromMatch(match), {
		language: "python",
		code: 'print("hello")',
		title: "train.py",
		wrap: true,
		showLineNumbers: true,
		startLineNumber: 20,
		highlightLines: "2,4-5",
	});
});

test("diagram fences remain owned by their dedicated CMS components", () => {
	assert.equal("```mermaid\nflowchart LR\n```".match(CODE_BLOCK_PATTERN), null);
	assert.equal(
		"```plantuml\nAlice -> Bob\n```".match(CODE_BLOCK_PATTERN),
		null,
	);
});

test("preview escapes pasted markup and shows line numbers without exposing HTML", () => {
	const preview = codeBlockPreview({
		language: "html",
		code: '<script>alert("x")</script>',
		title: "index.html",
		startLineNumber: 7,
	});
	assert.match(preview, /index\.html/u);
	assert.match(preview, /data-line="7"/u);
	assert.doesNotMatch(preview, /<script>/u);
	assert.match(preview, /&lt;script&gt;/u);
});
