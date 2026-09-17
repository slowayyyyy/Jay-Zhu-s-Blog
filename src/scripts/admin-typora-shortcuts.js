const COMMANDS = [
	{ id: 'bold', label: '加粗', short: 'B', keys: '⌘/Ctrl+B' },
	{ id: 'italic', label: '斜体', short: 'I', keys: '⌘/Ctrl+I' },
	{ id: 'strike', label: '删除线', short: 'S', keys: 'Windows Alt+Shift+5 / Mac Ctrl+Shift+`' },
	{ id: 'code', label: '行内代码', short: '</>', keys: '⌘/Ctrl+Shift+`' },
	{ id: 'link', label: '链接', short: '链接', keys: '⌘/Ctrl+K' },
	{ id: 'heading2', label: '二级标题', short: 'H2', keys: '⌘/Ctrl+2' },
	{ id: 'quote', label: '引用', short: '❝', keys: 'Windows Ctrl+Shift+Q / Mac ⌘+⌥+Q' },
	{ id: 'bullet', label: '列表', short: '列表', keys: 'Windows Ctrl+Shift+] / Mac ⌘+⌥+U' },
	{ id: 'task', label: '任务列表', short: '任务', keys: '工具栏' },
	{ id: 'table', label: '表格', short: '表格', keys: 'Windows Ctrl+T / Mac ⌘+⌥+T' },
	{ id: 'fence', label: '代码块', short: '代码块', keys: 'Windows Ctrl+Shift+K / Mac ⌘+⌥+C' },
	{ id: 'math', label: '公式块', short: '公式', keys: 'Windows Ctrl+Shift+M / Mac ⌘+⌥+B' },
	{ id: 'mark', label: '高亮', short: '高亮', keys: '工具栏' },
	{ id: 'sub', label: '下标', short: '下标', keys: '工具栏' },
	{ id: 'sup', label: '上标', short: '上标', keys: '工具栏' },
];

const wrap = (value, start, end, before, after = before, placeholder = '文字') => {
	const selected = value.slice(start, end) || placeholder;
	return { value: `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`,
		start: start + before.length, end: start + before.length + selected.length };
};

const lines = (value, start, end, prefix) => {
	const from = value.lastIndexOf('\n', start - 1) + 1;
	const to = value.indexOf('\n', end);
	const limit = to === -1 ? value.length : to;
	const section = value.slice(from, limit).split('\n').map((line, index) => prefix(line, index)).join('\n');
	return { value: value.slice(0, from) + section + value.slice(limit), start: from, end: from + section.length };
};

export function applyTyporaCommand(value, start, end, command) {
	switch (command) {
		case 'bold': return wrap(value, start, end, '**');
		case 'italic': return wrap(value, start, end, '*');
		case 'strike': return wrap(value, start, end, '~~');
		case 'code': return wrap(value, start, end, '`', '`', 'code');
		case 'mark': return wrap(value, start, end, '==');
		case 'sub': return wrap(value, start, end, '~');
		case 'sup': return wrap(value, start, end, '^');
		case 'link': return wrap(value, start, end, '[', '](https://)', '链接文字');
		case 'heading0': return lines(value, start, end, (line) => line.replace(/^\s{0,3}#{1,6}\s*/u, ''));
		case 'quote': return lines(value, start, end, (line) => `> ${line}`);
		case 'bullet': return lines(value, start, end, (line) => `- ${line}`);
		case 'ordered': return lines(value, start, end, (line, index) => `${index + 1}. ${line}`);
		case 'task': return lines(value, start, end, (line) => `- [ ] ${line}`);
		case 'table': return wrap(value, start, end, '| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |', '', '');
		case 'fence': return wrap(value, start, end, '```text\n', '\n```', '在这里粘贴代码');
		case 'math': return wrap(value, start, end, '$$\n', '\n$$', 'E = mc^2');
		default:
			if (/^heading[1-6]$/u.test(command)) return lines(value, start, end,
				(line) => `${'#'.repeat(Number(command.at(-1)))} ${line.replace(/^\s{0,3}#{1,6}\s*/u, '')}`);
			return null;
	}
}

export function typoraCommandForKey(event, isMac = /Mac|iPhone|iPad/u.test(navigator.platform)) {
	const primary = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
	const plainPrimary = primary && !event.altKey && !event.shiftKey;
	if (plainPrimary && /^[0-6]$/u.test(event.key)) return `heading${event.key}`;
	if (plainPrimary && event.key.toLowerCase() === 'b') return 'bold';
	if (plainPrimary && event.key.toLowerCase() === 'i') return 'italic';
	if (plainPrimary && event.key.toLowerCase() === 'k') return 'link';
	if (isMac && event.ctrlKey && event.shiftKey && event.code === 'Backquote') return 'strike';
	if (!isMac && event.altKey && event.shiftKey && event.code === 'Digit5') return 'strike';
	if (primary && event.shiftKey && !event.altKey && event.code === 'Backquote') return 'code';
	if (!isMac && primary && event.shiftKey && event.key.toLowerCase() === 'q') return 'quote';
	if (!isMac && primary && event.shiftKey && event.code === 'BracketRight') return 'bullet';
	if (!isMac && primary && event.shiftKey && event.code === 'BracketLeft') return 'ordered';
	if (!isMac && primary && event.shiftKey && event.key.toLowerCase() === 'k') return 'fence';
	if (!isMac && primary && event.shiftKey && event.key.toLowerCase() === 'm') return 'math';
	if (!isMac && primary && !event.shiftKey && event.key.toLowerCase() === 't') return 'table';
	if (isMac && primary && event.altKey && !event.shiftKey) {
		if (event.key.toLowerCase() === 'q') return 'quote';
		if (event.key.toLowerCase() === 'u') return 'bullet';
		if (event.key.toLowerCase() === 'o') return 'ordered';
		if (event.key.toLowerCase() === 'c') return 'fence';
		if (event.key.toLowerCase() === 'b') return 'math';
		if (event.key.toLowerCase() === 't') return 'table';
	}
	return null;
}

const isPostMarkdownTextarea = (target) => {
	if (!(target instanceof HTMLTextAreaElement)) return false;
	if (!/^#\/collections\/posts\/(?:new|entries\/)/u.test(location.hash)) return false;
	if (target.closest('[data-field-name="body"], [data-testid="field-body"]')) return true;
	const label = `${target.getAttribute('aria-label') || ''} ${target.getAttribute('placeholder') || ''}`;
	if (/正文|markdown|source/iu.test(label)) return true;
	const box = target.getBoundingClientRect();
	return box.height >= 180 && box.width >= 280;
};

export function setupTyporaShortcuts() {
	if (window.__jayTyporaShortcuts) return;
	window.__jayTyporaShortcuts = true;
	let editor = null;
	const toolbar = document.createElement('div');
	toolbar.className = 'jay-markdown-toolbar';
	toolbar.setAttribute('role', 'toolbar');
	toolbar.setAttribute('aria-label', 'Markdown 快捷格式');
	for (const command of COMMANDS) {
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = command.short;
		button.title = `${command.label} · ${command.keys}`;
		button.setAttribute('aria-label', `${command.label}，${command.keys}`);
		button.addEventListener('mousedown', (event) => event.preventDefault());
		button.addEventListener('click', () => apply(command.id));
		toolbar.append(button);
	}
	document.body.append(toolbar);

	const apply = (command) => {
		if (!editor?.isConnected) return;
		const { selectionStart, selectionEnd, value } = editor;
		const result = applyTyporaCommand(value, selectionStart, selectionEnd, command);
		if (!result) return;
		editor.focus();
		editor.setRangeText(result.value, 0, value.length, 'end');
		editor.setSelectionRange(result.start, result.end);
		editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: result.value }));
		editor.dispatchEvent(new Event('change', { bubbles: true }));
	};

	document.addEventListener('focusin', (event) => {
		editor = isPostMarkdownTextarea(event.target) ? event.target : null;
		toolbar.classList.toggle('is-visible', Boolean(editor));
	});
	document.addEventListener('keydown', (event) => {
		if (!isPostMarkdownTextarea(event.target) || event.isComposing) return;
		editor = event.target;
		const command = typoraCommandForKey(event);
		if (!command) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		apply(command);
	}, true);
	window.addEventListener('hashchange', () => {
		if (!/^#\/collections\/posts\/(?:new|entries\/)/u.test(location.hash)) {
			editor = null;
			toolbar.classList.remove('is-visible');
		}
	});
}
