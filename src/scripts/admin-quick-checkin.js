const HABITS = {
	english: {
		label: '英语学习',
		icon: 'EN',
		minimum: 5,
		durations: [5, 10, 20, 30, 45, 60],
		activities: ['听力', '阅读', '口语', '背词', '写作', '其他'],
		tag: '英语',
	},
	exercise: {
		label: '运动锻炼',
		icon: 'MOVE',
		minimum: 10,
		durations: [10, 20, 30, 40, 60, 90],
		activities: ['快走', '跑步', '力量训练', '拉伸', '球类', '其他'],
		tag: '运动',
	},
};

const localDateTimeValue = (date = new Date()) => {
	const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return localTime.toISOString().slice(0, 16);
};

const yamlString = (value) => JSON.stringify(String(value ?? ''));

export const createCheckinMarkdown = ({ category, duration, activity, note, dateTime }) => {
	const habit = HABITS[category];
	const day = dateTime.slice(0, 10);
	const displayDateTime = dateTime.replace('T', ' ');
	const title = `${habit.label} · ${activity}`;
	const summary = `${activity} · ${duration} 分钟`;
	const body = note.trim();

	return `---
date: ${yamlString(displayDateTime)}
day: ${yamlString(day)}
title: ${yamlString(title)}
summary: ${yamlString(summary)}
category: ${category}
duration: ${duration}
activity: ${yamlString(activity)}
sortOrder: 0
items: []
tags:
  - ${yamlString(habit.tag)}
draft: false
---
${body}
`;
};

export const createCheckinPath = ({ category, dateTime }) => {
	const day = dateTime.slice(0, 10);
	const time = dateTime.slice(11, 16).replace(':', '');
	const suffix =
		globalThis.crypto?.randomUUID?.().slice(0, 8) ||
		Math.random().toString(36).slice(2, 10);
	return `src/content/checkins/${day}-${time}-${category}-${suffix}.md`;
};

export function setupQuickCheckin({
	isLocalPreview,
	getGithubAccessToken,
	getGithubRepoInfo,
	encodePathPreservingSlashes,
	blobToBase64,
	githubApiRequest,
	showStatus,
}) {
	if (document.querySelector('[data-quick-checkin-launcher]')) return;

	const style = document.createElement('style');
	style.textContent = `
		[data-quick-checkin-launcher] {
			position: fixed;
			right: 18px;
			bottom: 18px;
			z-index: 9997;
			display: inline-flex;
			align-items: center;
			gap: 9px;
			padding: 12px 17px;
			border: 0;
			border-radius: 999px;
			background: linear-gradient(135deg, #315f69, #d18b58);
			color: #fff;
			box-shadow: 0 18px 42px rgba(28, 54, 63, 0.28);
			font: 600 14px/1.2 "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
			transition: transform 180ms ease, box-shadow 180ms ease;
		}

		[data-quick-checkin-launcher]:hover {
			transform: translateY(-2px);
			box-shadow: 0 22px 52px rgba(28, 54, 63, 0.34);
		}

		[data-quick-checkin-launcher] span:first-child {
			display: grid;
			place-items: center;
			width: 23px;
			height: 23px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.18);
			font-size: 12px;
		}

		[data-quick-checkin-modal] {
			position: fixed;
			inset: 0;
			z-index: 10020;
			display: grid;
			place-items: center;
			padding: 18px;
			background: rgba(15, 24, 29, 0.52);
			backdrop-filter: blur(10px);
			font-family: "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
		}

		[data-quick-checkin-modal][hidden] {
			display: none;
		}

		.quick-checkin-card {
			width: min(560px, 100%);
			max-height: calc(100vh - 36px);
			overflow: auto;
			padding: 24px;
			border: 1px solid rgba(49, 95, 105, 0.13);
			border-radius: 26px;
			background:
				radial-gradient(circle at 88% 0%, rgba(209, 139, 88, 0.16), transparent 32%),
				#fbfcfc;
			box-shadow: 0 32px 90px rgba(10, 28, 35, 0.3);
			color: #172329;
		}

		.quick-checkin-head {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 20px;
			margin-bottom: 20px;
		}

		.quick-checkin-kicker {
			margin-bottom: 5px;
			color: #52747b;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.18em;
		}

		.quick-checkin-head h2 {
			margin: 0;
			font-family: "Iowan Old Style", "Palatino Linotype", "Noto Serif SC", serif;
			font-size: 28px;
			line-height: 1.15;
		}

		.quick-checkin-close {
			display: grid;
			place-items: center;
			flex: 0 0 auto;
			width: 36px;
			height: 36px;
			padding: 0;
			border: 1px solid rgba(23, 35, 41, 0.1);
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.74);
			color: #52636a;
			font-size: 20px;
		}

		.quick-checkin-field {
			display: grid;
			gap: 9px;
			margin-top: 17px;
		}

		.quick-checkin-field > span,
		.quick-checkin-label {
			color: #566a71;
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.08em;
		}

		.quick-checkin-types {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 10px;
		}

		.quick-checkin-type,
		.quick-checkin-duration {
			border: 1px solid rgba(23, 35, 41, 0.1);
			background: rgba(255, 255, 255, 0.74);
			color: #2b3b42;
			transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
		}

		.quick-checkin-type {
			display: grid;
			grid-template-columns: auto 1fr;
			align-items: center;
			gap: 11px;
			padding: 13px;
			border-radius: 16px;
			text-align: left;
		}

		.quick-checkin-type strong {
			font-size: 14px;
		}

		.quick-checkin-type small {
			display: block;
			margin-top: 2px;
			color: #74848a;
		}

		.quick-checkin-type-mark {
			display: grid;
			place-items: center;
			width: 42px;
			height: 42px;
			border-radius: 50%;
			background: #edf2f2;
			color: #426971;
			font-size: 10px;
			font-weight: 800;
		}

		.quick-checkin-type.is-active {
			border-color: rgba(49, 95, 105, 0.54);
			background: rgba(226, 239, 238, 0.82);
			transform: translateY(-1px);
		}

		.quick-checkin-card button:focus {
			outline: none;
		}

		.quick-checkin-card button:focus-visible {
			box-shadow: 0 0 0 3px rgba(49, 95, 105, 0.18);
		}

		.quick-checkin-type[data-category="exercise"].is-active {
			border-color: rgba(190, 119, 68, 0.5);
			background: rgba(250, 235, 222, 0.86);
		}

		.quick-checkin-duration-list {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}

		.quick-checkin-duration {
			padding: 8px 12px;
			border-radius: 999px;
			font-size: 13px;
		}

		.quick-checkin-duration.is-active {
			border-color: #3f6f78;
			background: #3f6f78;
			color: #fff;
		}

		.quick-checkin-card :is(input, select, textarea) {
			width: 100%;
			box-sizing: border-box;
			border: 1px solid rgba(23, 35, 41, 0.12);
			border-radius: 13px;
			background: rgba(255, 255, 255, 0.86);
			color: #172329;
			font: inherit;
			outline: none;
		}

		.quick-checkin-card :is(input, select) {
			min-height: 44px;
			padding: 9px 12px;
		}

		.quick-checkin-card textarea {
			min-height: 86px;
			padding: 11px 12px;
			resize: vertical;
		}

		.quick-checkin-card :is(input, select, textarea):focus {
			border-color: rgba(49, 95, 105, 0.62);
			box-shadow: 0 0 0 3px rgba(49, 95, 105, 0.09);
		}

		.quick-checkin-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;
		}

		.quick-checkin-submit {
			width: 100%;
			margin-top: 21px;
			padding: 13px 18px;
			border: 0;
			border-radius: 999px;
			background: linear-gradient(135deg, #315f69, #d18b58);
			color: #fff;
			font: 700 14px/1.2 inherit;
			box-shadow: 0 14px 28px rgba(49, 95, 105, 0.2);
		}

		.quick-checkin-submit:disabled {
			cursor: wait;
			opacity: 0.58;
		}

		.quick-checkin-feedback {
			min-height: 20px;
			margin: 12px 0 0;
			color: #61747b;
			font-size: 13px;
			text-align: center;
		}

		.quick-checkin-feedback[data-tone="error"] {
			color: #a04c4c;
		}

		.quick-checkin-feedback[data-tone="success"] {
			color: #397055;
		}

		@media (max-width: 560px) {
			[data-quick-checkin-launcher] {
				right: 12px;
				bottom: 12px;
			}

			.quick-checkin-card {
				padding: 20px 16px;
				border-radius: 22px;
			}

			.quick-checkin-types,
			.quick-checkin-row {
				grid-template-columns: 1fr;
			}
		}
	`;
	document.head.append(style);

	const launcher = document.createElement('button');
	launcher.type = 'button';
	launcher.dataset.quickCheckinLauncher = 'true';
	launcher.innerHTML = '<span aria-hidden="true">灯</span><span>快速打卡</span>';
	document.body.append(launcher);

	const modal = document.createElement('div');
	modal.dataset.quickCheckinModal = 'true';
	modal.hidden = true;
	modal.innerHTML = `
		<div class="quick-checkin-card" role="dialog" aria-modal="true" aria-labelledby="quick-checkin-title">
			<div class="quick-checkin-head">
				<div>
					<div class="quick-checkin-kicker">LIGHT TODAY</div>
					<h2 id="quick-checkin-title">点亮今天</h2>
				</div>
				<button class="quick-checkin-close" type="button" aria-label="关闭">×</button>
			</div>
			<form data-quick-checkin-form>
				<div class="quick-checkin-label">选择今天完成的事情</div>
				<div class="quick-checkin-types">
					<button class="quick-checkin-type is-active" type="button" data-category="english">
						<span class="quick-checkin-type-mark">EN</span>
						<span><strong>英语学习</strong><small>最低 5 分钟也算完成</small></span>
					</button>
					<button class="quick-checkin-type" type="button" data-category="exercise">
						<span class="quick-checkin-type-mark">MOVE</span>
						<span><strong>运动锻炼</strong><small>最低 10 分钟也算完成</small></span>
					</button>
				</div>
				<label class="quick-checkin-field">
					<span>完成时长</span>
					<div class="quick-checkin-duration-list" data-duration-list></div>
				</label>
				<div class="quick-checkin-row">
					<label class="quick-checkin-field">
						<span>具体活动</span>
						<select name="activity" required></select>
					</label>
					<label class="quick-checkin-field">
						<span>完成时间</span>
						<input name="dateTime" type="datetime-local" required />
					</label>
				</div>
				<label class="quick-checkin-field">
					<span>留下一句话（可选）</span>
					<textarea name="note" maxlength="500" placeholder="今天完成了什么，感觉如何？"></textarea>
				</label>
				<button class="quick-checkin-submit" type="submit">点亮这盏灯</button>
				<p class="quick-checkin-feedback" data-quick-checkin-feedback></p>
			</form>
		</div>
	`;
	document.body.append(modal);

	const form = modal.querySelector('[data-quick-checkin-form]');
	const feedback = modal.querySelector('[data-quick-checkin-feedback]');
	const durationList = modal.querySelector('[data-duration-list]');
	const activitySelect = form.elements.activity;
	const dateTimeInput = form.elements.dateTime;
	const submitButton = form.querySelector('.quick-checkin-submit');
	let selectedCategory = 'english';
	let selectedDuration = HABITS.english.minimum;

	const setFeedback = (message = '', tone = 'info') => {
		feedback.textContent = message;
		feedback.dataset.tone = tone;
	};

	const renderHabitOptions = () => {
		const habit = HABITS[selectedCategory];
		modal.querySelectorAll('[data-category]').forEach((button) => {
			button.classList.toggle('is-active', button.dataset.category === selectedCategory);
		});

		activitySelect.replaceChildren(
			...habit.activities.map((activity) => {
				const option = document.createElement('option');
				option.value = activity;
				option.textContent = activity;
				return option;
			}),
		);

		durationList.replaceChildren(
			...habit.durations.map((duration) => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'quick-checkin-duration';
				button.classList.toggle('is-active', duration === selectedDuration);
				button.dataset.duration = String(duration);
				button.textContent = `${duration} 分钟`;
				return button;
			}),
		);
	};

	const openModal = (category = 'english') => {
		if (!isLocalPreview && !getGithubAccessToken()) {
			showStatus('请先使用 GitHub 登录后台，登录完成后点击右下角“快速打卡”。', 'info', 7600);
			return;
		}

		selectedCategory = HABITS[category] ? category : 'english';
		selectedDuration = HABITS[selectedCategory].minimum;
		dateTimeInput.value = localDateTimeValue();
		setFeedback(
			isLocalPreview
				? '本地预览暂不支持快速提交，请在线上后台使用。'
				: '保存后会提交到 GitHub，前台通常在 1 到 3 分钟内点亮。',
		);
		renderHabitOptions();
		modal.hidden = false;
		document.body.style.overflow = 'hidden';
		modal.querySelector(`[data-category="${selectedCategory}"]`)?.focus();
	};

	const closeModal = () => {
		if (submitButton.disabled) return;
		modal.hidden = true;
		document.body.style.overflow = '';
		launcher.focus();
	};

	launcher.addEventListener('click', () => openModal());
	modal.querySelector('.quick-checkin-close').addEventListener('click', closeModal);
	modal.addEventListener('click', (event) => {
		if (event.target === modal) closeModal();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modal.hidden) closeModal();
	});

	modal.querySelectorAll('[data-category]').forEach((button) => {
		button.addEventListener('click', () => {
			selectedCategory = button.dataset.category;
			selectedDuration = HABITS[selectedCategory].minimum;
			renderHabitOptions();
		});
	});

	durationList.addEventListener('click', (event) => {
		const button = event.target.closest('[data-duration]');
		if (!button) return;
		selectedDuration = Number(button.dataset.duration);
		renderHabitOptions();
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (isLocalPreview) {
			setFeedback('请打开线上管理后台后再使用快速打卡。', 'error');
			return;
		}
		if (!getGithubAccessToken()) {
			setFeedback('请先完成 GitHub 登录，再提交快速打卡。', 'error');
			return;
		}

		const dateTime = String(dateTimeInput.value || '');
		const activity = String(activitySelect.value || '').trim();
		const note = String(form.elements.note.value || '');
		if (!dateTime || !activity || selectedDuration <= 0) {
			setFeedback('请补全打卡类型、时长和完成时间。', 'error');
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = '正在点亮...';
		setFeedback('正在创建打卡记录并提交到 GitHub...');

		try {
			const repoFilePath = createCheckinPath({
				category: selectedCategory,
				dateTime,
			});
			const markdown = createCheckinMarkdown({
				category: selectedCategory,
				duration: selectedDuration,
				activity,
				note,
				dateTime,
			});
			const { repo, branch } = getGithubRepoInfo();
			const apiPath = encodePathPreservingSlashes(
				`repos/${repo}/contents/${repoFilePath}`,
			);
			const response = await githubApiRequest(apiPath, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: `Create quick check-in ${dateTime.slice(0, 10)} ${HABITS[selectedCategory].label}`,
					content: await blobToBase64(
						new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
					),
					branch,
				}),
			});
			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body.message || `GitHub 提交失败：${response.status}`);
			}

			setFeedback('已经点亮并提交。Cloudflare 正在更新前台。', 'success');
			showStatus(
				`${HABITS[selectedCategory].label}打卡已提交到 GitHub，前台通常在 1 到 3 分钟内更新。`,
				'success',
				7200,
			);
			form.elements.note.value = '';
			window.setTimeout(() => {
				submitButton.disabled = false;
				submitButton.textContent = '点亮这盏灯';
				closeModal();
			}, 1300);
		} catch (error) {
			console.error('[Jay CMS] quick check-in failed.', error);
			setFeedback(
				`提交失败：${error?.message || '未知错误'}。请刷新后台并重新登录后再试。`,
				'error',
			);
			submitButton.disabled = false;
			submitButton.textContent = '点亮这盏灯';
		}
	});

	const requestedCategory = new URL(window.location.href).searchParams.get('quick-checkin');
	if (requestedCategory) {
		window.setTimeout(() => openModal(requestedCategory), 520);
	}
}
