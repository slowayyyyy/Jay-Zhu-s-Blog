import { inspectTyporaMarkdown, prepareTyporaImport } from './typora-import-core.js';
import { getCmsGithubToken, publishTyporaDraft, validateImportAssets } from './typora-import-publish.js';

const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;

export function setupTyporaImportPage() {
	const form = document.getElementById('typora-import-form');
	if (!form) return;
	const folderInput = document.getElementById('folder-input');
	folderInput.setAttribute('webkitdirectory', '');
	folderInput.setAttribute('directory', '');
	const markdownInput = document.getElementById('markdown-input');
	const assetsInput = document.getElementById('assets-input');
	const titleInput = document.getElementById('import-title');
	const dateInput = document.getElementById('import-date');
	const categoryInput = document.getElementById('import-category');
	const descriptionInput = document.getElementById('import-description');
	const tagsInput = document.getElementById('import-tags');
	const fileSummary = document.getElementById('file-summary');
	const summary = document.getElementById('import-summary');
	const issues = document.getElementById('import-issues');
	const preview = document.getElementById('import-preview');
	const submit = document.getElementById('import-submit');
	const status = document.getElementById('import-status');
	let source = null;
	let plan = null;
	let busy = false;

	const showStatus = (message, kind = '') => {
		status.replaceChildren();
		status.dataset.kind = kind;
		status.textContent = message;
	};
	const addIssue = (message, kind) => {
		const line = document.createElement('p');
		line.className = kind;
		line.textContent = message;
		issues.append(line);
	};

	const render = () => {
		plan = null;
		submit.disabled = true;
		issues.replaceChildren();
		preview.textContent = '';
		if (!source) return;
		try {
			plan = prepareTyporaImport({
				markdown: source.markdown,
				markdownFile: source.file,
				files: source.files,
				title: titleInput.value,
				published: dateInput.value,
				category: categoryInput.value,
				description: descriptionInput.value,
				tags: tagsInput.value,
			});
			validateImportAssets(plan.assets);
			summary.textContent = `${plan.slug}.md · ${plan.assets.length} 张本地图片 · 导入后状态：隐藏`;
			for (const missing of plan.missing) addIssue(`未找到图片：${missing}。请把图片放在所选目录或补充选择，再导入。`, 'error');
			for (const link of plan.unsupportedLinks) addIssue(`正文中的相对链接 ${link} 会原样保留，请在导入后检查目标是否可访问。`, 'warning');
			if (plan.extras.length) addIssue(`原始 YAML 还有 ${plan.extras.join('、')} 字段：本次会保留在文章文件中，但日后在 Decap 后台再次保存时可能不保留，请核对。`, 'warning');
			preview.textContent = plan.content.length > 30_000 ? `${plan.content.slice(0, 30_000)}\n\n……预览已截断，实际导入会保留全文。` : plan.content;
			submit.disabled = busy || plan.missing.length > 0;
		} catch (error) {
			summary.textContent = '请补全或修正文章信息后再导入。';
			addIssue(error.message, 'error');
		}
	};

	const readSource = async (file, files) => {
		if (file.size === 0 || file.size > MAX_MARKDOWN_BYTES) throw new Error('Markdown 文件必须非空且小于 2 MB。');
		if (files.length > 300) throw new Error('所选目录文件过多，请只选择一篇文章及其素材。');
		const markdown = await file.text();
		const info = inspectTyporaMarkdown(markdown);
		source = { file, files, markdown };
		titleInput.value = info.title || file.name.replace(/\.(?:md|markdown)$/iu, '');
		dateInput.value = info.published;
		categoryInput.value = [...categoryInput.options].some((option) => option.value === info.category) ? info.category : '';
		descriptionInput.value = info.description;
		tagsInput.value = info.tags.join(', ');
		fileSummary.textContent = `${file.name} · 已读取 ${files.length - 1} 个附带文件`;
		showStatus('文件已在本地读取，尚未上传或发布。');
		render();
	};

	folderInput.addEventListener('change', async () => {
		try {
			const files = [...folderInput.files];
			const markdownFiles = files.filter((file) => /\.(?:md|markdown)$/iu.test(file.name));
			if (markdownFiles.length !== 1) throw new Error('目录中必须恰好有一篇 .md 文章；若有多篇，请单独选择文件。');
			markdownInput.value = '';
			await readSource(markdownFiles[0], files);
		} catch (error) { source = null; render(); showStatus(error.message, 'error'); }
	});
	markdownInput.addEventListener('change', async () => {
		try {
			const file = markdownInput.files[0];
			if (!file) return;
			folderInput.value = '';
			await readSource(file, [file, ...assetsInput.files]);
		} catch (error) { source = null; render(); showStatus(error.message, 'error'); }
	});
	assetsInput.addEventListener('change', () => {
		if (source && !folderInput.files.length) {
			source.files = [source.file, ...assetsInput.files];
			fileSummary.textContent = `${source.file.name} · 已选择 ${assetsInput.files.length} 张补充图片`;
			render();
		}
	});
	for (const input of [titleInput, dateInput, categoryInput, descriptionInput, tagsInput]) {
		input.addEventListener('input', render);
	}

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (busy || !plan || plan.missing.length) return;
		const token = getCmsGithubToken();
		if (!token) {
			showStatus('请先打开博客后台并完成 GitHub 登录，然后返回本页重试。', 'error');
			return;
		}
		busy = true;
		submit.disabled = true;
		try {
			const result = await publishTyporaDraft(plan, { token, onProgress: (message) => showStatus(message) });
			status.replaceChildren();
			status.dataset.kind = 'success';
			status.append(document.createTextNode(`已导入隐藏草稿（${result.sha.slice(0, 8)}）。Cloudflare 构建后可在后台继续编辑。 `));
			const link = document.createElement('a');
			link.href = `/admin/#/collections/posts/entries/${encodeURIComponent(result.slug)}`;
			link.textContent = '打开这篇文章';
			status.append(link);
		} catch (error) {
			showStatus(error.message, 'error');
			busy = false;
			render();
		}
	});
}
