const LANGUAGE_ALIASES = new Map([
	["javascript", "js"],
	["typescript", "ts"],
	["shell", "sh"],
	["shellsession", "shellsession"],
	["powershell", "powershell"],
	["markdown", "md"],
	["plaintext", "text"],
	["textile", "text"],
	["c++", "cpp"],
	["c#", "csharp"],
]);

const LANGUAGE_OPTIONS = [
	{ label: "纯文本", value: "text" },
	{ label: "JavaScript", value: "js" },
	{ label: "TypeScript", value: "ts" },
	{ label: "JSX", value: "jsx" },
	{ label: "TSX", value: "tsx" },
	{ label: "Python", value: "python" },
	{ label: "Java", value: "java" },
	{ label: "C", value: "c" },
	{ label: "C++", value: "cpp" },
	{ label: "C#", value: "csharp" },
	{ label: "Go", value: "go" },
	{ label: "Rust", value: "rust" },
	{ label: "Kotlin", value: "kotlin" },
	{ label: "Swift", value: "swift" },
	{ label: "PHP", value: "php" },
	{ label: "Ruby", value: "ruby" },
	{ label: "Shell / Bash", value: "sh" },
	{ label: "PowerShell", value: "powershell" },
	{ label: "SQL", value: "sql" },
	{ label: "HTML", value: "html" },
	{ label: "CSS", value: "css" },
	{ label: "SCSS", value: "scss" },
	{ label: "Vue", value: "vue" },
	{ label: "Svelte", value: "svelte" },
	{ label: "Astro", value: "astro" },
	{ label: "JSON", value: "json" },
	{ label: "YAML", value: "yaml" },
	{ label: "TOML", value: "toml" },
	{ label: "Markdown", value: "md" },
	{ label: "Dockerfile", value: "dockerfile" },
	{ label: "Diff", value: "diff" },
	{ label: "LaTeX", value: "latex" },
	{ label: "MATLAB", value: "matlab" },
	{ label: "R", value: "r" },
];

export const CODE_BLOCK_PATTERN =
	/^(`{3,})(?!(?:mermaid|plantuml)(?:\s|$))([^\s`]*)[ \t]*([^\n]*)\r?\n([\s\S]*?)\r?\n\1[ \t]*$/m;

const readValue = (source, key) => {
	if (!source) return undefined;
	if (typeof source.get === "function") return source.get(key);
	return source[key];
};

const escapeHtml = (value) =>
	String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const normalizeLanguage = (value) => {
	const language = String(value ?? "")
		.trim()
		.toLocaleLowerCase()
		.replace(/[^a-z0-9_+#.-]/gu, "");
	return LANGUAGE_ALIASES.get(language) || language || "text";
};

const normalizeCode = (value) =>
	String(value ?? "")
		.replaceAll("\r\n", "\n")
		.replaceAll("\r", "\n")
		.replace(/\n+$/u, "");

const normalizeTitle = (value) =>
	String(value ?? "")
		.replace(/[\r\n]+/gu, " ")
		.trim();

const normalizeHighlightLines = (value) => {
	const input = String(value ?? "").replaceAll(" ", "");
	if (!input || !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/u.test(input)) return "";
	return input;
};

const normalizeStartLine = (value) => {
	const parsed = Number.parseInt(String(value ?? "1"), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const decodeQuotedMeta = (value) =>
	String(value ?? "").replace(/\\([\\"])/gu, "$1");

const readMeta = (meta) => {
	const titleMatch = meta.match(/(?:^|\s)title="((?:\\.|[^"\\])*)"(?=\s|$)/u);
	const wrapMatch = meta.match(/(?:^|\s)wrap(?:=(true|false))?(?=\s|$)/u);
	const lineNumberMatch = meta.match(
		/(?:^|\s)showLineNumbers(?:=(true|false))?(?=\s|$)/u,
	);
	const startLineMatch = meta.match(/(?:^|\s)startLineNumber=(\d+)(?=\s|$)/u);
	const highlightMatch = meta.match(/(?:^|\s)\{([\d,\s-]+)\}(?=\s|$)/u);

	return {
		title: decodeQuotedMeta(titleMatch?.[1]),
		wrap: wrapMatch ? wrapMatch[1] !== "false" : false,
		showLineNumbers: lineNumberMatch ? lineNumberMatch[1] !== "false" : true,
		startLineNumber: normalizeStartLine(startLineMatch?.[1]),
		highlightLines: normalizeHighlightLines(highlightMatch?.[1]),
	};
};

const snippetData = (source) => {
	const snippet = readValue(source, "snippet");
	const nestedCode = readValue(snippet, "code");
	const nestedLanguage =
		readValue(snippet, "language") ?? readValue(snippet, "lang");
	return {
		code: normalizeCode(nestedCode ?? readValue(source, "code")),
		language: normalizeLanguage(
			nestedLanguage ?? readValue(source, "language"),
		),
	};
};

const escapeMetaTitle = (value) =>
	value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const createFence = (code) => {
	const longest = [...code.matchAll(/`+/gu)].reduce(
		(maximum, match) => Math.max(maximum, match[0].length),
		0,
	);
	return "`".repeat(Math.max(3, longest + 1));
};

export const codeBlockToMarkdown = (source) => {
	const { code, language } = snippetData(source);
	const title = normalizeTitle(readValue(source, "title"));
	const wrap = readValue(source, "wrap") === true;
	const showLineNumbers = readValue(source, "showLineNumbers") !== false;
	const startLineNumber = normalizeStartLine(
		readValue(source, "startLineNumber"),
	);
	const highlightLines = normalizeHighlightLines(
		readValue(source, "highlightLines"),
	);
	const meta = [];

	if (title) meta.push(`title="${escapeMetaTitle(title)}"`);
	if (wrap) meta.push("wrap");
	if (!showLineNumbers) meta.push("showLineNumbers=false");
	if (startLineNumber !== 1) meta.push(`startLineNumber=${startLineNumber}`);
	if (highlightLines) meta.push(`{${highlightLines}}`);

	const fence = createFence(code);
	const opening = `${fence}${language}${meta.length ? ` ${meta.join(" ")}` : ""}`;
	return `${opening}\n${code}\n${fence}`;
};

export const codeBlockFromMatch = (match) => {
	const meta = readMeta(match?.[3] || "");
	return {
		code: normalizeCode(match?.[4]),
		language: normalizeLanguage(match?.[2]),
		...meta,
	};
};

export const codeBlockPreview = (source) => {
	const { code, language } = snippetData(source);
	const title = normalizeTitle(readValue(source, "title"));
	const showLineNumbers = readValue(source, "showLineNumbers") !== false;
	const startLineNumber = normalizeStartLine(
		readValue(source, "startLineNumber"),
	);
	const lines = (code || "在这里粘贴代码").split("\n");
	const renderedLines = lines
		.map(
			(line, index) =>
				`<span class="jay-code-preview__line"${showLineNumbers ? ` data-line="${startLineNumber + index}"` : ""}>${escapeHtml(line) || "&#8203;"}</span>`,
		)
		.join("");

	return `<figure class="jay-code-preview"><figcaption><strong>${escapeHtml(title || "代码片段")}</strong><span>${escapeHtml(language.toUpperCase())}</span></figcaption><pre><code>${renderedLines}</code></pre></figure>`;
};

export const ADMIN_CODE_PREVIEW_STYLE = `
	.jay-code-preview{margin:1.25rem 0;overflow:hidden;border:1px solid #d9e4e7;border-radius:14px;background:#f8fafb;color:#24343a}
	.jay-code-preview figcaption{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.65rem .9rem;border-bottom:1px solid #d9e4e7;background:#edf4f5;font:600 13px/1.4 "Segoe UI","PingFang SC",sans-serif}
	.jay-code-preview figcaption span{color:#376d7b;font-size:11px;letter-spacing:.06em}
	.jay-code-preview pre{max-height:28rem;margin:0;overflow:auto;padding:.8rem 0;background:#f8fafb;color:#24343a;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;tab-size:2}
	.jay-code-preview code{display:block;min-width:max-content}
	.jay-code-preview__line{display:block;min-height:1.65em;padding:0 1rem;white-space:pre}
	.jay-code-preview__line[data-line]::before{content:attr(data-line);display:inline-block;width:3ch;margin-right:1.1rem;color:#82969d;text-align:right;user-select:none}
`;

export const registerAdminCodeBlock = (CMS) => {
	CMS.registerPreviewStyle(ADMIN_CODE_PREVIEW_STYLE, { raw: true });
	CMS.registerEditorComponent({
		id: "enhanced-code-block",
		label: "代码块（高亮）",
		collapsed: false,
		fields: [
			{
				name: "language",
				label: "编程语言",
				widget: "select",
				options: LANGUAGE_OPTIONS,
				default: "js",
				hint: "用于前台语法高亮和右上角语言标识。纯文本请选择“纯文本”。",
			},
			{
				name: "code",
				label: "粘贴代码",
				widget: "code",
				default_language: "text",
				allow_language_selection: false,
				output_code_only: true,
				hint: "直接粘贴完整代码；支持 Tab 缩进，保存后前台自动高亮。",
			},
			{
				name: "title",
				label: "文件名或标题（选填）",
				widget: "string",
				required: false,
				hint: "例如 app.ts、train.py 或“安装命令”；填写后会显示在代码框顶部。",
			},
			{
				name: "wrap",
				label: "长行自动换行",
				widget: "boolean",
				default: false,
				required: false,
				hint: "关闭时保留代码原排版并允许横向滚动；手机上阅读超长文本时可开启。",
			},
			{
				name: "showLineNumbers",
				label: "显示行号",
				widget: "boolean",
				default: true,
				required: false,
			},
			{
				name: "startLineNumber",
				label: "起始行号",
				widget: "number",
				value_type: "int",
				min: 1,
				default: 1,
				required: false,
				hint: "完整文件中截取的代码可从实际行号开始；一般保持 1。",
			},
			{
				name: "highlightLines",
				label: "重点行（选填）",
				widget: "string",
				required: false,
				pattern: [
					"^$|^\\d+(?:-\\d+)?(?:,\\s*\\d+(?:-\\d+)?)*$",
					"请填写 2,4-6 这样的行号或范围。",
				],
				hint: "例如 2,4-6，前台会突出显示第 2、4、5、6 行。",
			},
		],
		pattern: CODE_BLOCK_PATTERN,
		fromBlock: codeBlockFromMatch,
		toBlock: codeBlockToMarkdown,
		toPreview: codeBlockPreview,
	});
};
