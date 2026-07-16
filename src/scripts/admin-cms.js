import { remarkImagePresentation } from '../lib/remark-image-presentation.mjs';
import { remarkTightInlineFormatting } from '../lib/remark-tight-inline-formatting.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const DEFAULT_GITHUB_REPO = 'slowayyyyy/Jay-Zhu-s-Blog';
const DEFAULT_GITHUB_BRANCH = 'main';
const GITHUB_TOKEN_PATTERN =
	/(gho_[A-Za-z0-9_]+|ghu_[A-Za-z0-9_]+|ghs_[A-Za-z0-9_]+|ghr_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/;
const IMAGE_EXTENSION_BY_TYPE = new Map([
	['image/jpeg', 'jpg'],
	['image/jpg', 'jpg'],
	['image/pjpeg', 'jpg'],
	['image/png', 'png'],
	['image/x-png', 'png'],
	['image/gif', 'gif'],
	['image/webp', 'webp'],
	['image/svg+xml', 'svg'],
	['image/bmp', 'bmp'],
	['image/x-ms-bmp', 'bmp'],
	['image/avif', 'avif'],
	['image/tiff', 'tiff'],
	['image/x-icon', 'ico'],
]);
const IMAGE_FILE_EXTENSION_PATTERN = /\.(avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/iu;
const DATA_IMAGE_SOURCE_PATTERN = /^data:image\//iu;
const LOCAL_IMAGE_REFERENCE_PATTERN = /^(file:|[a-z]:\\)/iu;
const FETCHABLE_IMAGE_SOURCE_PATTERN = /^(https?:\/\/|blob:|\/)/iu;
const MARKDOWN_DATA_IMAGE_PATTERN =
	/!\[([^\]]*)\]\(\s*(data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\r\n]+)\s*(?:"[^"]*")?\)/giu;
const MARKDOWN_TRANSIENT_IMAGE_PATTERN =
	/!\[[^\]]*\]\(\s*(?:blob:|file:|[a-z]:\\)[^)]+\)/iu;
const LARGE_CLIPBOARD_IMAGE_BYTES = 900 * 1024;
const MAX_CLIPBOARD_IMAGE_EDGE = 2560;

const readConfigValue = (source, key) => {
	if (!source) return undefined;
	if (typeof source.get === 'function') return source.get(key);
	return source[key];
};

const encodePathPreservingSlashes = (value) =>
	value
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');

const sanitizeFilenamePart = (value) =>
	String(value || 'image')
		.normalize('NFKC')
		.replace(/\.[^.]+$/u, '')
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/gu, '')
		.slice(0, 56) || 'image';

const blobToBase64 = (blob) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('load', () => {
			const result = String(reader.result || '');
			resolve(result.includes(',') ? result.split(',').pop() : result);
		});
		reader.addEventListener('error', () => reject(reader.error));
		reader.readAsDataURL(blob);
	});

export function setupAdminCms() {
	if (!window.CMS || window.__jayCmsSetup) return;
	window.__jayCmsSetup = true;

	window.CMS.registerRemarkPlugin(remarkTightInlineFormatting);
	window.CMS.registerRemarkPlugin(remarkImagePresentation);

	let syncTimer;
	let statusTimer;
	let reloadTimer;
	let idleTimer;
	const replayedPasteEvents = new WeakSet();
	const isLocalPreview = LOCAL_HOSTS.has(window.location.hostname);
	const syncChannel =
		'BroadcastChannel' in window ? new BroadcastChannel('jay-content-sync') : null;
	const previewObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
				rewritePreviewImage(mutation.target);
				continue;
			}

			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				hydratePreviewImages(node);
			}
		}
	});

	const getGithubRepoInfo = () => {
		const config = window.CMS?.getConfig?.();
		const backend = readConfigValue(config, 'backend');
		return {
			repo: readConfigValue(backend, 'repo') || DEFAULT_GITHUB_REPO,
			branch: readConfigValue(backend, 'branch') || DEFAULT_GITHUB_BRANCH,
		};
	};

	const findGithubToken = (value, depth = 0) => {
		if (!value || depth > 6) return null;

		if (typeof value === 'string') {
			const match = value.match(GITHUB_TOKEN_PATTERN);
			return match?.[0] ?? null;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				const token = findGithubToken(item, depth + 1);
				if (token) return token;
			}
			return null;
		}

		if (typeof value === 'object') {
			const preferredKeys = ['token', 'access_token', 'accessToken', 'githubToken'];
			for (const key of preferredKeys) {
				if (!(key in value)) continue;
				const token = findGithubToken(value[key], depth + 1);
				if (token) return token;
			}

			for (const nestedValue of Object.values(value)) {
				const token = findGithubToken(nestedValue, depth + 1);
				if (token) return token;
			}
		}

		return null;
	};

	const getGithubAccessToken = () => {
		for (let index = 0; index < window.localStorage.length; index += 1) {
			const storageKey = window.localStorage.key(index);
			if (!storageKey) continue;

			const rawValue = window.localStorage.getItem(storageKey);
			if (!rawValue) continue;

			const directToken = findGithubToken(rawValue);
			if (directToken) return directToken;

			try {
				const parsedValue = JSON.parse(rawValue);
				const parsedToken = findGithubToken(parsedValue);
				if (parsedToken) return parsedToken;
			} catch {
				continue;
			}
		}

		return null;
	};

	const getImageExtension = (file) => {
		const extensionFromName = file.name?.match(/\.([a-z0-9]+)$/iu)?.[1]?.toLowerCase();
		if (extensionFromName && /^[a-z0-9]{2,5}$/u.test(extensionFromName)) {
			return extensionFromName === 'jpeg' ? 'jpg' : extensionFromName;
		}

		return IMAGE_EXTENSION_BY_TYPE.get(file.type) || 'png';
	};

	const createUploadFilename = (file, index = 0) => {
		const extension = getImageExtension(file);
		const basename = sanitizeFilenamePart(file.name || `pasted-image-${index + 1}`);
		const stamp = new Date()
			.toISOString()
			.replace(/\D/gu, '')
			.slice(0, 14);
		const suffix =
			globalThis.crypto?.randomUUID?.().slice(0, 8) ||
			Math.random().toString(36).slice(2, 10);
		return `${stamp}-${basename}-${suffix}.${extension}`;
	};

	const canvasToBlob = (canvas, type, quality) =>
		new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('image_encode_failed'))),
				type,
				quality,
			);
		});

	const prepareClipboardImage = async (file, index = 0) => {
		if (!file || file.size === 0) throw new Error('empty_clipboard_image');

		const type = file.type.toLowerCase();
		const shouldKeepOriginal =
			file.size <= LARGE_CLIPBOARD_IMAGE_BYTES ||
			type === 'image/gif' ||
			type === 'image/svg+xml';
		if (shouldKeepOriginal) return file;

		let bitmap;
		try {
			bitmap = await createImageBitmap(file);
			const scale = Math.min(
				1,
				MAX_CLIPBOARD_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
			);
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			const context = canvas.getContext('2d');
			if (!context) throw new Error('image_canvas_unavailable');
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

			const compressed = await canvasToBlob(canvas, 'image/webp', 0.93);
			if (compressed.size >= file.size) return file;
			return new File([compressed], `pasted-image-${index + 1}.webp`, {
				type: 'image/webp',
			});
		} catch (error) {
			console.warn('[Jay CMS] keeping original clipboard image.', error);
			return file;
		} finally {
			bitmap?.close?.();
		}
	};

	const githubUploadRequest = async (url, githubToken, payload) => {
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				Authorization: `token ${githubToken}`,
				Accept: 'application/vnd.github+json',
				'Content-Type': 'application/json',
				'X-GitHub-Api-Version': '2022-11-28',
			},
			body: payload,
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			const error = new Error(body.message || `image upload failed: ${response.status}`);
			error.status = response.status;
			throw error;
		}
	};

	const uploadImageToGithub = async (file, index = 0) => {
		if (isLocalPreview) {
			throw new Error('local_preview_upload_unavailable');
		}

		const githubToken = getGithubAccessToken();
		if (!githubToken) {
			throw new Error('missing_github_token');
		}

		const { repo, branch } = getGithubRepoInfo();
		const filename = createUploadFilename(file, index);
		const repoFilePath = `public/uploads/${filename}`;
		const apiPath = encodePathPreservingSlashes(`repos/${repo}/contents/${repoFilePath}`);
		const payload = JSON.stringify({
			message: `Upload pasted image ${filename}`,
			content: await blobToBase64(file),
			branch,
		});

		try {
			await githubUploadRequest(`https://api.github.com/${apiPath}`, githubToken, payload);
		} catch (error) {
			if (typeof error?.status === 'number') throw error;
			console.warn('[Jay CMS] direct GitHub upload failed; retrying through site proxy.', error);
			await githubUploadRequest(`/api/github/${apiPath}`, githubToken, payload);
		}

		return `/uploads/${filename}`;
	};

	const fileFromDataUrl = async (source, name = 'pasted-image') => {
		const response = await fetch(source);
		const blob = await response.blob();
		return new File([blob], name, { type: blob.type || 'image/png' });
	};

	const fileFromImageUrl = async (source, name = 'pasted-image') => {
		const response = await fetch(source, { mode: 'cors' });
		if (!response.ok) throw new Error(`image source fetch failed: ${response.status}`);
		const blob = await response.blob();
		if (!blob.type.startsWith('image/')) throw new Error('source is not an image');
		return new File([blob], name, { type: blob.type });
	};

	const extractImageSourcesFromHtml = (html) => {
		if (!html) return [];
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return [...doc.querySelectorAll('img[src]')]
			.map((image) => image.getAttribute('src')?.trim())
			.filter(Boolean);
	};

	const snapshotClipboardData = (clipboardData) => {
		const files = [];
		for (const file of [...(clipboardData?.files || [])]) {
			files.push(file);
		}

		for (const item of [...(clipboardData?.items || [])]) {
			if (item.kind !== 'file') continue;
			const file = item.getAsFile();
			if (file) files.push(file);
		}

		return {
			files,
			html: clipboardData?.getData('text/html') || '',
			uriList: clipboardData?.getData('text/uri-list') || '',
			text: clipboardData?.getData('text/plain') || '',
		};
	};

	const extractClipboardTextSources = (snapshot) => {
		const sources = [];
		for (const value of [snapshot?.uriList, snapshot?.text]) {
			if (!value) continue;

			for (const line of value.split(/\r?\n/u)) {
				const source = line.trim();
				if (!source || source.startsWith('#')) continue;
				sources.push(source);
			}
		}
		return sources;
	};

	const extractClipboardImageSources = (snapshot) => {
		const sources = [
			...extractImageSourcesFromHtml(snapshot?.html),
			...extractClipboardTextSources(snapshot),
		];
		return [...new Set(sources.filter(Boolean))];
	};

	const isLocalImageReference = (source) => LOCAL_IMAGE_REFERENCE_PATTERN.test(source);

	const isFetchableImageSource = (source) =>
		DATA_IMAGE_SOURCE_PATTERN.test(source) || FETCHABLE_IMAGE_SOURCE_PATTERN.test(source);

	const isLikelyImageSource = (source) => {
		if (DATA_IMAGE_SOURCE_PATTERN.test(source) || /^blob:/iu.test(source)) return true;
		try {
			const pathname = new URL(source, window.location.origin).pathname;
			return IMAGE_FILE_EXTENSION_PATTERN.test(pathname);
		} catch {
			return IMAGE_FILE_EXTENSION_PATTERN.test(source);
		}
	};

	const isProbableImageFile = (file) =>
		Boolean(
			file &&
				(file.type?.toLowerCase?.().startsWith('image/') ||
					IMAGE_FILE_EXTENSION_PATTERN.test(file.name || '')),
		);

	const sniffImageType = async (file) => {
		const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
		const ascii = String.fromCharCode(...bytes);
		if (bytes[0] === 0x89 && ascii.slice(1, 4) === 'PNG') return 'image/png';
		if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
		if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'image/gif';
		if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
		if (ascii.startsWith('BM')) return 'image/bmp';
		if (
			(bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0) ||
			(bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0 && bytes[3] === 0x2a)
		) {
			return 'image/tiff';
		}
		if (ascii.slice(4, 8) === 'ftyp' && /avi[fx]/u.test(ascii.slice(8))) return 'image/avif';
		return null;
	};

	const normalizeClipboardFileMetadata = async (file, index = 0) => {
		if (isProbableImageFile(file)) return file;
		const detectedType = await sniffImageType(file);
		if (!detectedType) return null;
		const extension = IMAGE_EXTENSION_BY_TYPE.get(detectedType) || 'png';
		return new File([file], `clipboard-image-${index + 1}.${extension}`, {
			type: detectedType,
		});
	};

	const addUniqueImageFile = (files, seen, file) => {
		if (!isProbableImageFile(file) || file.size === 0) return;
		const key = `${file.name || 'clipboard-image'}:${file.size}:${file.type}`;
		if (seen.has(key)) return;
		seen.add(key);
		files.push(file);
	};

	const readNavigatorClipboardImageFiles = async () => {
		if (!navigator.clipboard?.read) return [];

		try {
			const clipboardItems = await navigator.clipboard.read();
			const files = [];
			for (const [itemIndex, item] of clipboardItems.entries()) {
				const imageTypes = item.types.filter((type) => type.startsWith('image/'));
				for (const [typeIndex, type] of imageTypes.entries()) {
					const blob = await item.getType(type);
					const extension = IMAGE_EXTENSION_BY_TYPE.get(type) || type.split('/').pop() || 'png';
					files.push(
						new File([blob], `clipboard-image-${itemIndex + 1}-${typeIndex + 1}.${extension}`, {
							type,
						}),
					);
				}
			}
			return files;
		} catch (error) {
			console.warn('[Jay CMS] navigator.clipboard.read unavailable for images.', error);
			return [];
		}
	};

	const extractClipboardImageFiles = async (snapshot) => {
		const files = [];
		const seen = new Set();

		for (const [index, file] of (snapshot?.files || []).entries()) {
			addUniqueImageFile(files, seen, await normalizeClipboardFileMetadata(file, index));
		}

		// Binary clipboard data is authoritative. HTML/text fallbacks often point to the same
		// image and would otherwise upload a duplicate or a short-lived blob URL.
		if (files.length === 0) {
			const htmlSources = new Set(extractImageSourcesFromHtml(snapshot?.html));
			const imageSources = extractClipboardImageSources(snapshot);
			for (const [index, source] of imageSources.entries()) {
				if (DATA_IMAGE_SOURCE_PATTERN.test(source)) {
					addUniqueImageFile(
						files,
						seen,
						await fileFromDataUrl(source, `pasted-html-image-${index + 1}`),
					);
					continue;
				}

				if (
					isFetchableImageSource(source) &&
					!isLocalImageReference(source) &&
					(htmlSources.has(source) || isLikelyImageSource(source))
				) {
					try {
						addUniqueImageFile(
							files,
							seen,
							await fileFromImageUrl(source, `pasted-remote-image-${index + 1}`),
						);
					} catch (error) {
						console.warn('[Jay CMS] cannot fetch pasted image source.', error);
					}
				}
			}
		}

		if (files.length === 0) {
			for (const file of await readNavigatorClipboardImageFiles()) {
				addUniqueImageFile(files, seen, file);
			}
		}

		return files;
	};

	const normalizeMarkdownDataImages = async (body) => {
		if (typeof body !== 'string' || !body.includes('data:image/')) return body;

		MARKDOWN_DATA_IMAGE_PATTERN.lastIndex = 0;
		const matches = [...body.matchAll(MARKDOWN_DATA_IMAGE_PATTERN)];
		if (matches.length === 0) return body;

		const uploadedByDataUrl = new Map();
		let normalizedBody = '';
		let cursor = 0;

		for (const [index, match] of matches.entries()) {
			const [rawMarkdown, rawAlt, dataUrl] = match;
			const start = match.index ?? 0;
			const end = start + rawMarkdown.length;
			const alt = rawAlt?.trim() || `粘贴图片 ${index + 1} | lg | center`;

			normalizedBody += body.slice(cursor, start);

			let uploadedUrl = uploadedByDataUrl.get(dataUrl);
			if (!uploadedUrl) {
				const extension = dataUrl.split(';')[0].split('/').pop() || 'png';
				const file = await fileFromDataUrl(
					dataUrl,
					`${sanitizeFilenamePart(alt)}.${extension}`,
				);
				uploadedUrl = await uploadImageToGithub(file, index);
				uploadedByDataUrl.set(dataUrl, uploadedUrl);
			}

			normalizedBody += `![${alt}](${uploadedUrl})`;
			cursor = end;
		}

		normalizedBody += body.slice(cursor);
		return normalizedBody;
	};

	const getEntryData = (entry) => entry?.get?.('data');

	const readEntryDataField = (data, field) => {
		if (!data) return undefined;
		if (typeof data.get === 'function') return data.get(field);
		return data[field];
	};

	const setEntryDataField = (data, field, value) => {
		if (!data) return data;
		if (typeof data.set === 'function') return data.set(field, value);
		return { ...data, [field]: value };
	};

	const normalizeEmbeddedImagesBeforeSave = async ({ entry }) => {
		const data = getEntryData(entry);
		const body = readEntryDataField(data, 'body');
		if (typeof body !== 'string') return data;
		if (MARKDOWN_TRANSIENT_IMAGE_PATTERN.test(body)) {
			showStatus('正文里仍有临时坏图，请删除该图片后重新粘贴。', 'error', 9000);
			throw new Error('transient_image_reference');
		}
		if (!body.includes('data:image/')) return data;

		showStatus('检测到正文里有内嵌图片，正在转成站内图片...', 'pending');
		const normalizedBody = await normalizeMarkdownDataImages(body);
		if (normalizedBody === body) return data;

		showStatus('已把内嵌图片转成站内图片，正在继续保存...', 'success', 4200);
		return setEntryDataField(data, 'body', normalizedBody);
	};

	const clipboardContainsOnlyLocalImageReferences = (clipboardData) => {
		const imageSources = extractClipboardImageSources(clipboardData);
		return imageSources.some((source) => isLocalImageReference(source));
	};

	const writeClipboardText = async (value) => {
		try {
			await navigator.clipboard?.writeText(value);
			return true;
		} catch {
			return false;
		}
	};

	const insertTextIntoTextarea = (textarea, value) => {
		textarea.focus();
		const start = textarea.selectionStart ?? textarea.value.length;
		const end = textarea.selectionEnd ?? start;
		textarea.setRangeText(value, start, end, 'end');
		textarea.dispatchEvent(
			new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }),
		);
		textarea.dispatchEvent(new Event('change', { bubbles: true }));
	};

	const isTextEditingTarget = (target) =>
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLInputElement ||
		(target instanceof HTMLElement && Boolean(target.closest('[contenteditable="true"]')));

	const escapeHtmlAttribute = (value) =>
		String(value)
			.replaceAll('&', '&amp;')
			.replaceAll('"', '&quot;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');

	const captureRichEditorSelection = (target) => {
		if (!(target instanceof HTMLElement)) return null;
		const editor = target.closest('[contenteditable="true"][data-slate-editor="true"]');
		if (!(editor instanceof HTMLElement)) return null;

		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
		return { editor, range };
	};

	const restoreRichEditorSelection = ({ editor, range }) => {
		editor.focus();
		if (!range || !editor.contains(range.commonAncestorContainer)) return;
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	const insertImagesIntoRichEditor = async (selectionSnapshot, urls) => {
		if (!selectionSnapshot?.editor?.isConnected) return false;
		restoreRichEditorSelection(selectionSnapshot);

		const html = urls
			.map(
				(url, index) =>
					`<p><img src="${escapeHtmlAttribute(url)}" alt="粘贴图片 ${index + 1} | lg | center"></p>`,
			)
			.join('');
		const markdown = urls
			.map((url, index) => `![粘贴图片 ${index + 1} | lg | center](${url})`)
			.join('\n\n');
		const clipboard = new DataTransfer();
		clipboard.setData('text/html', html);
		clipboard.setData('text/plain', markdown);
		const pasteEvent = new ClipboardEvent('paste', {
			bubbles: true,
			cancelable: true,
			clipboardData: clipboard,
		});
		replayedPasteEvents.add(pasteEvent);
		selectionSnapshot.editor.dispatchEvent(pasteEvent);

		for (let attempt = 0; attempt < 20; attempt += 1) {
			await new Promise((resolve) => window.setTimeout(resolve, 50));
			const insertedSources = [...selectionSnapshot.editor.querySelectorAll('img[src]')].flatMap(
				(image) => [image.getAttribute('src'), image.dataset.jayCmsPreviewSource],
			);
			if (urls.every((url) => insertedSources.includes(url))) return true;
		}
		return false;
	};

	const handleImagePaste = async (event) => {
		if (replayedPasteEvents.has(event)) return;
		if (!isTextEditingTarget(event.target)) return;

		const clipboardSnapshot = snapshotClipboardData(event.clipboardData);
		const richEditorSelection = captureRichEditorSelection(event.target);
		const hasImageFile = clipboardSnapshot.files.length > 0;
		const htmlImageSources = extractImageSourcesFromHtml(clipboardSnapshot.html);
		const imageSources = extractClipboardImageSources(clipboardSnapshot);
		const hasSupportedImageSource = imageSources.some(
			(source) =>
				isFetchableImageSource(source) &&
				!isLocalImageReference(source) &&
				(htmlImageSources.includes(source) || isLikelyImageSource(source)),
		);
		const hasLocalImageReference = clipboardContainsOnlyLocalImageReferences(clipboardSnapshot);

		if (!hasImageFile && !hasSupportedImageSource && !hasLocalImageReference) return;
		event.preventDefault();
		event.stopImmediatePropagation();

		showStatus('正在上传粘贴的图片...', 'pending');

		try {
			const files = await extractClipboardImageFiles(clipboardSnapshot);
			if (files.length === 0) {
				throw new Error(
					hasLocalImageReference ? 'local_clipboard_path_only' : 'clipboard_image_unavailable',
				);
			}

			const urls = [];
			for (const [index, file] of files.entries()) {
				const preparedFile = await prepareClipboardImage(file, index);
				urls.push(await uploadImageToGithub(preparedFile, index));
			}

			const markdown = urls
				.map((url, index) => `![粘贴图片 ${index + 1} | lg | center](${url})`)
				.join('\n\n');
			const textarea = event.target instanceof HTMLTextAreaElement ? event.target : null;

			if (textarea) {
				insertTextIntoTextarea(textarea, `\n\n${markdown}\n\n`);
				showStatus(`已上传并插入 ${urls.length} 张图片。`, 'success', 5200);
				return;
			}

			if (richEditorSelection && (await insertImagesIntoRichEditor(richEditorSelection, urls))) {
				showStatus(`已上传并插入 ${urls.length} 张图片。`, 'success', 5200);
				return;
			}

			const copied = await writeClipboardText(markdown);
			showStatus(
				copied
					? `已上传 ${urls.length} 张图片，并把图片 Markdown 复制到剪贴板。请切到正文 Markdown 模式后粘贴。`
					: `已上传 ${urls.length} 张图片：${urls.join(' ')}`,
				'success',
				9000,
			);
		} catch (error) {
			console.error('[Jay CMS] pasted image upload failed.', error);
			const message =
				error?.message === 'local_preview_upload_unavailable'
					? '本地预览模式不支持自动上传粘贴图片，请在线上后台使用，或手动选择图片。'
					: error?.message === 'missing_github_token'
						? '没有找到 GitHub 登录令牌，请刷新后台并重新登录后再粘贴图片。'
						: error?.message === 'local_clipboard_path_only'
							? '这次粘贴只包含本地临时图片路径，浏览器无法读取。请先截图复制，或用后台“选择图片”上传原图。'
							: error?.message === 'empty_clipboard_image'
								? '剪贴板里的图片数据为空，请重新截图或重新复制后再粘贴。'
								: `粘贴图片上传失败：${error?.message || '未知错误'}。请重新登录后台后再试。`;
			showStatus(message, 'error', 9000);
		}
	};

	const buildUploadPreviewSources = (value) => {
		if (typeof value !== 'string' || !value.trim()) return null;

		let pathname;
		try {
			pathname = new URL(value, window.location.origin).pathname;
		} catch {
			return null;
		}

		let decodedPathname;
		try {
			decodedPathname = decodeURIComponent(pathname);
		} catch {
			decodedPathname = pathname;
		}

		if (!decodedPathname.startsWith('/uploads/')) return null;

		const { repo, branch } = getGithubRepoInfo();
		const encodedRepo = encodePathPreservingSlashes(repo);
		const encodedFilePath = encodePathPreservingSlashes(`public${decodedPathname}`);
		const apiUrl = new URL(
			`/api/github/repos/${encodedRepo}/contents/${encodedFilePath}`,
			window.location.origin,
		);
		apiUrl.searchParams.set('ref', branch);
		apiUrl.searchParams.set('raw', '1');

		const rawUrl = `https://raw.githubusercontent.com/${encodedRepo}/${encodeURIComponent(branch)}/${encodedFilePath}`;
		return {
			sourceKey: decodedPathname,
			apiUrl: apiUrl.toString(),
			rawUrl,
		};
	};

	const loadPreviewImage = async (image, { sourceKey, apiUrl, rawUrl }) => {
		const currentKey = sourceKey;
		image.dataset.jayCmsPreviewKey = currentKey;

		const githubToken = getGithubAccessToken();
		if (!githubToken) {
			image.src = rawUrl;
			return;
		}

		try {
			const response = await fetch(apiUrl, {
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: 'application/vnd.github.raw',
				},
				cache: 'no-store',
			});

			if (!response.ok) {
				throw new Error(`preview fetch failed: ${response.status}`);
			}

			const blob = await response.blob();
			if (image.dataset.jayCmsPreviewKey !== currentKey) return;

			const lastObjectUrl = image.dataset.jayCmsObjectUrl;
			if (lastObjectUrl) {
				URL.revokeObjectURL(lastObjectUrl);
			}

			const objectUrl = URL.createObjectURL(blob);
			image.dataset.jayCmsObjectUrl = objectUrl;
			image.src = objectUrl;
		} catch (error) {
			console.warn('[Jay CMS] image preview fallback to raw GitHub URL.', error);
			if (image.dataset.jayCmsPreviewKey !== currentKey) return;
			image.src = rawUrl;
		}
	};

	const rewritePreviewImage = (image) => {
		const source = image.getAttribute('src');
		const previewSources = buildUploadPreviewSources(source);
		if (!previewSources || image.dataset.jayCmsPreviewSource === previewSources.sourceKey) return;
		image.dataset.jayCmsPreviewSource = previewSources.sourceKey;
		void loadPreviewImage(image, previewSources);
	};

	const hydratePreviewImages = (root = document) => {
		if (root instanceof HTMLImageElement) {
			rewritePreviewImage(root);
			return;
		}

		if (typeof root.querySelectorAll !== 'function') return;
		root.querySelectorAll('img[src]').forEach((image) => rewritePreviewImage(image));
	};

	const handleNetworkFailure = (reason) => {
		const message =
			typeof reason === 'string'
				? reason
				: reason instanceof Error
					? reason.message
					: '';

		if (!/failed to fetch/i.test(message)) return;

		console.error('[Jay CMS] network request failed.', reason);
		showStatus(
			'后台请求失败。通常是 GitHub 登录状态失效，或当前网络没能完成提交。请刷新后台后重新登录，再重试上传或发布。',
			'error',
			9000,
		);
	};

	const ensureStatusNotice = () => {
		let notice = document.querySelector('[data-jay-cms-status]');
		if (notice) return notice;

		if (!document.getElementById('jay-cms-status-style')) {
			const style = document.createElement('style');
			style.id = 'jay-cms-status-style';
			style.textContent = `
				[data-jay-cms-status] {
					position: fixed;
					left: 16px;
					bottom: 16px;
					z-index: 9999;
					max-width: min(420px, calc(100vw - 32px));
					display: grid;
					grid-template-columns: minmax(0, 1fr) auto;
					align-items: flex-start;
					gap: 10px;
					padding: 12px 12px 12px 14px;
					border: 1px solid rgba(24, 33, 43, 0.08);
					border-radius: 16px;
					background: rgba(255, 255, 255, 0.92);
					box-shadow: 0 20px 50px rgba(45, 67, 87, 0.14);
					color: #18212b;
					font: 13px/1.6 "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
					backdrop-filter: blur(14px);
				}

				[data-jay-cms-status][hidden] {
					display: none;
				}

				[data-jay-cms-status-message] {
					min-width: 0;
				}

				[data-jay-cms-status-close] {
					width: 28px;
					height: 28px;
					padding: 0;
					border: 0;
					border-radius: 999px;
					background: transparent;
					color: rgba(24, 33, 43, 0.56);
					font: inherit;
					font-size: 18px;
					line-height: 1;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					transition:
						background 180ms ease,
						color 180ms ease,
						transform 180ms ease;
				}

				[data-jay-cms-status-close]:hover {
					background: rgba(24, 33, 43, 0.08);
					color: rgba(24, 33, 43, 0.84);
					transform: scale(1.02);
				}

				[data-jay-cms-status][data-tone='info'] {
					border-color: rgba(55, 109, 123, 0.18);
				}

				[data-jay-cms-status][data-tone='pending'] {
					border-color: rgba(208, 151, 79, 0.28);
					background: rgba(255, 249, 239, 0.94);
				}

				[data-jay-cms-status][data-tone='success'] {
					border-color: rgba(95, 150, 118, 0.24);
					background: rgba(244, 250, 246, 0.94);
				}

				[data-jay-cms-status][data-tone='error'] {
					border-color: rgba(176, 84, 84, 0.24);
					background: rgba(252, 245, 245, 0.95);
				}

				figure.prose-media {
					margin: 1.4rem 0;
				}

				figure.prose-media > img.prose-image,
				img.prose-image {
					display: block;
					width: min(100%, var(--prose-media-width, 42rem));
					max-width: 100%;
					height: auto;
					margin-inline: auto;
					border-radius: 16px;
					box-shadow: 0 16px 38px rgba(45, 67, 87, 0.14);
				}

				figure.prose-media--xs > img.prose-image,
				img.prose-image--xs {
					--prose-media-width: 15rem;
				}

				figure.prose-media--sm > img.prose-image,
				img.prose-image--sm {
					--prose-media-width: 22rem;
				}

				figure.prose-media--md > img.prose-image,
				img.prose-image--md {
					--prose-media-width: 32rem;
				}

				figure.prose-media--lg > img.prose-image,
				img.prose-image--lg {
					--prose-media-width: 42rem;
				}

				figure.prose-media--full > img.prose-image,
				img.prose-image--full {
					--prose-media-width: 100%;
				}

				figure.prose-media--left > img.prose-image,
				img.prose-image--left {
					margin-left: 0;
					margin-right: auto;
				}

				figure.prose-media--center > img.prose-image,
				img.prose-image--center {
					margin-inline: auto;
				}

				figure.prose-media--right > img.prose-image,
				img.prose-image--right {
					margin-left: auto;
					margin-right: 0;
				}
			`;
			document.head.append(style);
		}

		notice = document.createElement('div');
		notice.dataset.jayCmsStatus = 'true';
		notice.hidden = true;

		const message = document.createElement('div');
		message.dataset.jayCmsStatusMessage = 'true';
		notice.append(message);

		const closeButton = document.createElement('button');
		closeButton.type = 'button';
		closeButton.dataset.jayCmsStatusClose = 'true';
		closeButton.setAttribute('aria-label', '关闭提示');
		closeButton.textContent = '×';
		closeButton.addEventListener('click', () => {
			window.clearTimeout(statusTimer);
			window.clearTimeout(idleTimer);
			notice.hidden = true;
		});
		notice.append(closeButton);

		document.body.append(notice);
		return notice;
	};

	const idleMessage = () =>
		isLocalPreview
			? '本地模式：保存后会自动刷新预览内容。'
			: '线上模式：保存后先提交到 GitHub，再由 Cloudflare Pages 发布，前台通常 1 到 3 分钟更新。';

	const hideStatus = () => {
		const notice = document.querySelector('[data-jay-cms-status]');
		if (!notice) return;
		window.clearTimeout(statusTimer);
		window.clearTimeout(idleTimer);
		notice.hidden = true;
	};

	const showStatus = (message, tone = 'info', duration = 0) => {
		const notice = ensureStatusNotice();
		const messageElement = notice.querySelector('[data-jay-cms-status-message]');
		if (!messageElement) return;
		notice.hidden = false;
		messageElement.textContent = message;
		notice.dataset.tone = tone;
		window.clearTimeout(statusTimer);
		window.clearTimeout(idleTimer);
		if (duration > 0) {
			statusTimer = window.setTimeout(hideStatus, duration);
		}
	};

	const showIdleStatus = (duration = 9600) => {
		showStatus(idleMessage(), 'info', duration);
	};

	const syncLocalContent = async () => {
		const response = await fetch('/__content-sync', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			throw new Error(`content sync failed: ${response.status}`);
		}
	};

	const broadcastLocalPreviewUpdate = (collection) => {
		const payload = { collection, updatedAt: Date.now() };
		localStorage.setItem('jay-content-updated', JSON.stringify(payload));
		syncChannel?.postMessage(payload);
	};

	const scheduleAdminReload = (delay = 900) => {
		window.clearTimeout(reloadTimer);
		reloadTimer = window.setTimeout(() => window.location.reload(), delay);
	};

	const shouldReloadAdminOptions = (collection) => collection === 'tag_settings';

	const collectionLabel = (collection) =>
		(
			{
				posts: '文章',
				checkins: '每日打卡',
				tag_settings: '标签',
				site_settings: '站点设置',
			}[collection] ?? '内容'
		);

	const handleContentUpdate = ({ entry }) => {
		const collection = entry?.get?.('collection') || 'unknown';
		const label = collectionLabel(collection);
		const reloadAdminOptions = shouldReloadAdminOptions(collection);

		window.clearTimeout(syncTimer);
		showStatus(`正在保存${label}...`, 'pending', 1600);

		syncTimer = window.setTimeout(async () => {
			try {
				if (isLocalPreview) {
					await syncLocalContent();
					broadcastLocalPreviewUpdate(collection);
				}

				if (reloadAdminOptions) {
					showStatus(
						isLocalPreview
							? `${label}已保存，正在刷新后台标签选项...`
							: `${label}已提交到 GitHub，正在刷新后台标签选项...`,
						'success',
						2600,
					);
					scheduleAdminReload(isLocalPreview ? 700 : 1200);
					return;
				}

				if (isLocalPreview) {
					showStatus(`${label}已保存，本地预览已同步。`, 'success', 3200);
					return;
				}

				showStatus(
					`${label}已提交到 GitHub。Cloudflare Pages 通常会在 1 到 3 分钟内更新前台。`,
					'info',
					6400,
				);
			} catch (error) {
				console.error('[Jay CMS] content sync failed.', error);
				showStatus(
					isLocalPreview
						? `${label}已保存，但本地预览刷新失败，请手动刷新前台检查。`
						: `${label}已保存到仓库，但后台刷新失败，请手动刷新当前页面后再继续编辑。`,
					'error',
					7600,
				);
			}
		}, 420);
	};

	idleTimer = window.setTimeout(() => showIdleStatus(), 280);
	hydratePreviewImages();
	previewObserver.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['src'],
	});

	window.addEventListener('unhandledrejection', (event) => {
		handleNetworkFailure(event.reason);
	});

	document.addEventListener(
		'paste',
		(event) => {
			void handleImagePaste(event);
		},
		true,
	);

	window.CMS.registerEventListener({
		name: 'preSave',
		handler: normalizeEmbeddedImagesBeforeSave,
	});

	['postSave', 'postPublish', 'postUnpublish'].forEach((name) => {
		window.CMS.registerEventListener({ name, handler: handleContentUpdate });
	});
}
