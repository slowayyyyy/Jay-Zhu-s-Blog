const CAPTION_MAX_LENGTH = 240;

const escapeHtmlAttribute = (value) =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');

const escapeMarkdownTitle = (value) =>
	String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const normalizeCaption = (value) =>
	String(value ?? '')
		.replace(/\s+/gu, ' ')
		.trim()
		.slice(0, CAPTION_MAX_LENGTH);

export const createPastedImageMarkup = (urls, captions = []) => {
	const normalizedCaptions = urls.map((_, index) => normalizeCaption(captions[index]));
	return {
		html: urls
			.map((url, index) => {
				const caption = normalizedCaptions[index];
				const title = caption ? ` title="${escapeHtmlAttribute(caption)}"` : '';
				return `<p><img src="${escapeHtmlAttribute(url)}" alt="粘贴图片 ${index + 1} | lg | center"${title}></p>`;
			})
			.join(''),
		markdown: urls
			.map((url, index) => {
				const caption = normalizedCaptions[index];
				const title = caption ? ` "${escapeMarkdownTitle(caption)}"` : '';
				return `![粘贴图片 ${index + 1} | lg | center](${url}${title})`;
			})
			.join('\n\n'),
	};
};

const ensureCaptionDialogStyles = () => {
	if (document.getElementById('jay-paste-caption-style')) return;
	const style = document.createElement('style');
	style.id = 'jay-paste-caption-style';
	style.textContent = `
		[data-jay-paste-caption-dialog] {
			width: min(34rem, calc(100vw - 2rem));
			max-height: min(42rem, calc(100dvh - 2rem));
			padding: 0;
			border: 1px solid rgba(31, 51, 69, 0.12);
			border-radius: 16px;
			background: #f7f9fb;
			box-shadow: 0 24px 70px rgba(24, 33, 43, 0.2);
			color: #18212b;
			font-family: "Avenir Next", "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
		}

		[data-jay-paste-caption-dialog]::backdrop {
			background: color-mix(in srgb, #111111 48%, transparent);
		}

		[data-jay-paste-caption-form] {
			display: grid;
			max-height: inherit;
		}

		.jay-paste-caption-head,
		.jay-paste-caption-actions {
			padding: 1.1rem 1.25rem;
		}

		.jay-paste-caption-head {
			border-bottom: 1px solid rgba(31, 51, 69, 0.1);
		}

		.jay-paste-caption-head h2 {
			margin: 0;
			font-family: "Newsreader Variable", "ZCOOL XiaoWei", "Source Han Serif SC", serif;
			font-size: 1.35rem;
			line-height: 1.18;
			letter-spacing: -0.025em;
		}

		.jay-paste-caption-head p {
			margin: 0.35rem 0 0;
			color: rgba(24, 33, 43, 0.68);
			font-size: 0.78rem;
			line-height: 1.55;
		}

		.jay-paste-caption-list {
			display: grid;
			gap: 1rem;
			overflow-y: auto;
			padding: 1.25rem;
		}

		.jay-paste-caption-item {
			display: grid;
			grid-template-columns: 5.5rem minmax(0, 1fr);
			align-items: center;
			gap: 1rem;
		}

		.jay-paste-caption-thumb {
			display: block;
			width: 5.5rem;
			height: 4rem;
			border: 1px solid rgba(31, 51, 69, 0.1);
			border-radius: 12px;
			background: #fff;
			object-fit: cover;
		}

		.jay-paste-caption-field {
			display: grid;
			gap: 0.4rem;
			min-width: 0;
			color: rgba(24, 33, 43, 0.68);
			font-size: 0.78rem;
			font-weight: 600;
		}

		.jay-paste-caption-field input {
			box-sizing: border-box;
			width: 100%;
			min-height: 2.75rem;
			padding: 0.7rem 0.8rem;
			border: 1px solid rgba(31, 51, 69, 0.16);
			border-radius: 12px;
			background: #fff;
			color: #18212b;
			font: inherit;
			font-size: 1rem;
			font-weight: 400;
			outline: none;
		}

		.jay-paste-caption-field input:focus-visible {
			border-color: #376d7b;
			box-shadow: 0 0 0 3px rgba(217, 137, 73, 0.24);
		}

		.jay-paste-caption-actions {
			display: flex;
			justify-content: flex-end;
			gap: 0.7rem;
			border-top: 1px solid rgba(31, 51, 69, 0.1);
		}

		.jay-paste-caption-actions button {
			min-height: 2.75rem;
			padding: 0.65rem 1rem;
			border: 1px solid rgba(31, 51, 69, 0.14);
			border-radius: 12px;
			background: transparent;
			color: #18212b;
			font: inherit;
			font-weight: 650;
			cursor: pointer;
		}

		.jay-paste-caption-actions button[type='submit'] {
			border-color: #376d7b;
			background: #376d7b;
			color: #fff;
		}

		.jay-paste-caption-actions button:hover {
			transform: translateY(-1px);
		}

		.jay-paste-caption-actions button:focus-visible {
			outline: 3px solid rgba(217, 137, 73, 0.4);
			outline-offset: 2px;
		}

		@media (max-width: 520px) {
			.jay-paste-caption-item {
				grid-template-columns: 4.5rem minmax(0, 1fr);
				gap: 0.75rem;
			}

			.jay-paste-caption-thumb {
				width: 4.5rem;
				height: 3.5rem;
			}

			.jay-paste-caption-actions {
				display: grid;
				grid-template-columns: 1fr 1fr;
			}
		}
	`;
	document.head.append(style);
};

export const requestPastedImageCaptions = (urls, { hydratePreviewImage } = {}) => {
	if (!Array.isArray(urls) || urls.length === 0) return Promise.resolve([]);
	ensureCaptionDialogStyles();

	const dialog = document.createElement('dialog');
	dialog.dataset.jayPasteCaptionDialog = 'true';
	dialog.setAttribute('aria-labelledby', 'jay-paste-caption-title');

	const form = document.createElement('form');
	form.dataset.jayPasteCaptionForm = 'true';
	form.method = 'dialog';

	const head = document.createElement('header');
	head.className = 'jay-paste-caption-head';
	const title = document.createElement('h2');
	title.id = 'jay-paste-caption-title';
	title.textContent = urls.length === 1 ? '为图片添加说明' : `为 ${urls.length} 张图片添加说明`;
	const description = document.createElement('p');
	description.textContent = '选填。写下图名、序号或一句解释；留空会直接插入图片。';
	head.append(title, description);

	const list = document.createElement('div');
	list.className = 'jay-paste-caption-list';
	const inputs = urls.map((url, index) => {
		const item = document.createElement('div');
		item.className = 'jay-paste-caption-item';
		const thumbnail = document.createElement('img');
		thumbnail.className = 'jay-paste-caption-thumb';
		thumbnail.src = url;
		thumbnail.alt = '';
		const field = document.createElement('label');
		field.className = 'jay-paste-caption-field';
		field.append(`图片 ${index + 1} 的说明（选填）`);
		const input = document.createElement('input');
		input.type = 'text';
		input.maxLength = CAPTION_MAX_LENGTH;
		input.placeholder = `例如：图 ${index + 1} · 模型整体结构`;
		input.autocomplete = 'off';
		field.append(input);
		item.append(thumbnail, field);
		list.append(item);
		hydratePreviewImage?.(thumbnail);
		return input;
	});

	const actions = document.createElement('footer');
	actions.className = 'jay-paste-caption-actions';
	const skipButton = document.createElement('button');
	skipButton.type = 'button';
	skipButton.textContent = '直接插入';
	const confirmButton = document.createElement('button');
	confirmButton.type = 'submit';
	confirmButton.textContent = '插入图片';
	actions.append(skipButton, confirmButton);

	form.append(head, list, actions);
	dialog.append(form);
	document.body.append(dialog);

	return new Promise((resolve) => {
		let settled = false;
		const finish = (captions) => {
			if (settled) return;
			settled = true;
			if (dialog.open) dialog.close();
			dialog.remove();
			resolve(captions);
		};

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			finish(inputs.map((input) => normalizeCaption(input.value)));
		});
		skipButton.addEventListener('click', () => finish(urls.map(() => '')));
		dialog.addEventListener('cancel', (event) => {
			event.preventDefault();
			finish(urls.map(() => ''));
		});

		dialog.showModal();
		inputs[0]?.focus();
	});
};
