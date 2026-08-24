import bundledSiteSettings from '../data/site-settings.json';

const DEFAULT_HABITS = [
	{
		id: 'english',
		name: { zh: '英语学习', en: 'English' },
		code: 'EN',
		color: '#e3a34f',
		weeklyGoal: 5,
		minimumMinutes: 5,
		durations: [5, 10, 20, 30, 45, 60],
		activities: ['听力', '阅读', '口语', '背词', '写作', '其他'],
		enabled: true,
	},
	{
		id: 'exercise',
		name: { zh: '运动锻炼', en: 'Exercise' },
		code: 'MOVE',
		color: '#4d9b91',
		weeklyGoal: 3,
		minimumMinutes: 10,
		durations: [10, 20, 30, 40, 60, 90],
		activities: ['快走', '跑步', '力量训练', '拉伸', '球类', '其他'],
		enabled: true,
	},
];

const isValidColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value ?? ''));
const toPositiveNumbers = (values, fallback) => {
	const normalized = Array.isArray(values)
		? [...new Set(values.map(Number).filter((value) => Number.isFinite(value) && value > 0))]
		: [];
	return normalized.length > 0 ? normalized.sort((a, b) => a - b) : fallback;
};

export const normalizeQuickCheckinHabits = (settings = bundledSiteSettings) => {
	const source = Array.isArray(settings?.checkinSettings?.habits)
		? settings.checkinSettings.habits
		: DEFAULT_HABITS;
	const seen = new Set();
	const habits = source.flatMap((item, index) => {
		const id = String(item?.id ?? '').trim().toLowerCase();
		const zh = String(item?.name?.zh ?? '').trim();
		if (!id || !zh || item?.enabled === false || seen.has(id)) return [];
		seen.add(id);
		const fallback = DEFAULT_HABITS.find((habit) => habit.id === id) ?? DEFAULT_HABITS[index % DEFAULT_HABITS.length];
		const activities = Array.isArray(item.activities)
			? item.activities.map((value) => String(value).trim()).filter(Boolean)
			: [];
		const minimumMinutes = Math.max(1, Number(item?.minimumMinutes) || fallback.minimumMinutes);
		const durations = toPositiveNumbers(item?.durations, fallback.durations);
		return [{
			id,
			name: {
				zh,
				en: String(item?.name?.en ?? '').trim() || zh,
			},
			code: String(item?.code ?? '').trim().slice(0, 8).toUpperCase() || id.slice(0, 4).toUpperCase(),
			color: isValidColor(item?.color) ? item.color : fallback.color,
			weeklyGoal: Math.min(7, Math.max(1, Number(item?.weeklyGoal) || fallback.weeklyGoal)),
			minimumMinutes,
			durations: [...new Set([minimumMinutes, ...durations])].sort((a, b) => a - b),
			activities: activities.length > 0 ? activities : ['完成一次'],
			enabled: true,
		}];
	});
	return habits.length > 0 ? habits : DEFAULT_HABITS;
};

const withOtherHabit = (habits) => {
	const options = [...habits];
	if (!options.some(({ id }) => id === 'other')) {
		options.push({
			id: 'other',
			name: { zh: '其他记录', en: 'Other' },
			code: 'OTHER',
			color: '#82919a',
			weeklyGoal: 1,
			minimumMinutes: 1,
			durations: [5, 10, 20, 30, 60],
			activities: ['其他'],
			enabled: true,
		});
	}
	return options;
};

export function setupHabitSelectWidget({ isLocalPreview, readGithubJsonFile }) {
	if (window.__jayHabitSelectWidget || !window.CMS) return;
	const createClass = window.createClass;
	const h = window.h;
	if (typeof createClass !== 'function' || typeof h !== 'function') {
		console.error('[Jay CMS] Decap widget helpers are unavailable.');
		return;
	}

	window.__jayHabitSelectWidget = true;
	const fallbackHabits = () => withOtherHabit(normalizeQuickCheckinHabits());
	const HabitSelectControl = createClass({
		getInitialState() {
			return {
				habits: fallbackHabits(),
				loading: !isLocalPreview,
				error: '',
			};
		},

		componentDidMount() {
			this.isMountedControl = true;
			if (!isLocalPreview) void this.loadLatestHabits();
		},

		componentWillUnmount() {
			this.isMountedControl = false;
		},

		async loadLatestHabits() {
			try {
				const settings = await readGithubJsonFile('src/data/site-settings.json');
				if (!this.isMountedControl) return;
				this.setState({
					habits: withOtherHabit(normalizeQuickCheckinHabits(settings)),
					loading: false,
					error: '',
				});
			} catch (error) {
				console.warn('[Jay CMS] could not refresh habit select options.', error);
				if (!this.isMountedControl) return;
				this.setState({
					habits: fallbackHabits(),
					loading: false,
					error: '读取最新模块失败，当前显示上次发布的模块列表。',
				});
			}
		},

		handleChange(event) {
			this.props.onChange(event.target.value);
		},

		render() {
			const value = String(this.props.value || '');
			const habits = [...this.state.habits];
			if (value && !habits.some(({ id }) => id === value)) {
				habits.unshift({
					id: value,
					name: { zh: `${value}（旧模块或已停用）`, en: value },
					color: '#82919a',
				});
			}
			const helperText = this.state.loading
				? '正在读取最新打卡模块...'
				: this.state.error || '选项与“网站与个人资料 → 灯火计划 → 打卡模块”同步。';

			return h(
				'div',
				{},
				h(
					'select',
					{
						id: this.props.forID,
						className: this.props.classNameWrapper,
						value,
						onChange: this.handleChange,
						style: {
							width: '100%',
							minHeight: '42px',
							padding: '8px 12px',
							border: '1px solid #c8d1d5',
							borderRadius: '4px',
							background: '#fff',
							color: '#172329',
							fontSize: '14px',
						},
					},
					h('option', { value: '', disabled: true }, '请选择打卡模块'),
					...habits.map((habit) =>
						h(
							'option',
							{ key: habit.id, value: habit.id },
							`${habit.name.zh} · ${habit.code || habit.id.toUpperCase()}`,
						),
					),
				),
				h(
					'small',
					{
						style: {
							display: 'block',
							marginTop: '6px',
							color: this.state.error ? '#a04c4c' : '#68777d',
							lineHeight: '1.5',
						},
					},
					helperText,
				),
			);
		},
	});

	window.CMS.registerWidget('habit-select', HabitSelectControl);
}

const localDateTimeValue = (date = new Date()) => {
	const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return localTime.toISOString().slice(0, 16);
};

const yamlString = (value) => JSON.stringify(String(value ?? ''));

export const MAX_QUICK_CHECKIN_MINUTES = 1440;

export const parseQuickCheckinDuration = (value) => {
	const duration = Number(value);
	return Number.isInteger(duration) && duration >= 1 && duration <= MAX_QUICK_CHECKIN_MINUTES
		? duration
		: null;
};

export const createCheckinMarkdown = ({ habit, duration, activity, note, dateTime }) => {
	const day = dateTime.slice(0, 10);
	const displayDateTime = dateTime.replace('T', ' ');
	const title = `${habit.name.zh} · ${activity}`;
	const summary = `${activity} · ${duration} 分钟`;
	const body = note.trim();
	const legacyCategory = habit.id === 'english' || habit.id === 'exercise' ? habit.id : 'other';

	return `---
date: ${yamlString(displayDateTime)}
day: ${yamlString(day)}
title: ${yamlString(title)}
summary: ${yamlString(summary)}
entryType: quick
habit: ${yamlString(habit.id)}
category: ${legacyCategory}
duration: ${duration}
activity: ${yamlString(activity)}
sortOrder: 0
items: []
tags: []
draft: false
---
${body}
`;
};

export const createCheckinPath = ({ habitId, dateTime }) => {
	const day = dateTime.slice(0, 10);
	const time = dateTime.slice(11, 16).replace(':', '');
	const suffix =
		globalThis.crypto?.randomUUID?.().slice(0, 8) ||
		Math.random().toString(36).slice(2, 10);
	const safeHabitId = String(habitId).replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-');
	return `src/content/checkins/${day}-${time}-${safeHabitId}-${suffix}.md`;
};

export function setupQuickCheckin({
	isLocalPreview,
	getGithubAccessToken,
	getGithubRepoInfo,
	encodePathPreservingSlashes,
	blobToBase64,
	githubApiRequest,
	readGithubJsonFile,
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
			grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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
			border-color: color-mix(in srgb, var(--quick-habit-color) 62%, transparent);
			background: color-mix(in srgb, var(--quick-habit-color) 14%, white);
			transform: translateY(-1px);
		}

		.quick-checkin-type.is-active .quick-checkin-type-mark {
			background: color-mix(in srgb, var(--quick-habit-color) 18%, white);
			color: color-mix(in srgb, var(--quick-habit-color) 78%, #172329);
		}

		.quick-checkin-card button:focus {
			outline: none;
		}

		.quick-checkin-card button:focus-visible {
			box-shadow: 0 0 0 3px rgba(49, 95, 105, 0.18);
		}

		.quick-checkin-duration-list {
			display: flex;
			flex: 1 1 19rem;
			flex-wrap: wrap;
			gap: 8px;
		}

		.quick-checkin-duration-options {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
		}

		.quick-checkin-duration {
			padding: 8px 12px;
			border-radius: 999px;
			font-size: 13px;
		}

		.quick-checkin-duration.is-active {
			border-color: var(--quick-habit-color, #3f6f78);
			background: var(--quick-habit-color, #3f6f78);
			color: #fff;
		}

		.quick-checkin-custom-duration {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			min-height: 42px;
			padding: 4px 5px 4px 11px;
			border: 1px solid rgba(23, 35, 41, 0.12);
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.76);
			color: #61747b;
			font-size: 12px;
			font-weight: 700;
			transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
		}

		.quick-checkin-custom-duration.is-active,
		.quick-checkin-custom-duration:focus-within {
			border-color: color-mix(in srgb, var(--quick-habit-color, #3f6f78) 68%, transparent);
			background: color-mix(in srgb, var(--quick-habit-color, #3f6f78) 9%, white);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--quick-habit-color, #3f6f78) 10%, transparent);
		}

		.quick-checkin-card .quick-checkin-custom-duration input {
			width: 5.25rem;
			min-height: 32px;
			padding: 5px 7px;
			border: 0;
			border-radius: 999px;
			background: #fff;
			font-variant-numeric: tabular-nums;
			text-align: center;
		}

		.quick-checkin-card .quick-checkin-custom-duration input:focus {
			box-shadow: none;
		}

		.quick-checkin-custom-duration-unit {
			padding-right: 5px;
			font-weight: 500;
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

			.quick-checkin-duration-options,
			.quick-checkin-custom-duration {
				width: 100%;
			}

			.quick-checkin-card .quick-checkin-custom-duration input {
				flex: 1;
				width: auto;
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
				<div class="quick-checkin-types" data-habit-list></div>
				<div class="quick-checkin-field">
					<span>完成时长</span>
					<div class="quick-checkin-duration-options">
						<div class="quick-checkin-duration-list" data-duration-list></div>
						<label class="quick-checkin-custom-duration" data-custom-duration-shell>
							<span>自定义</span>
							<input name="customDuration" type="number" min="1" max="${MAX_QUICK_CHECKIN_MINUTES}" step="1" inputmode="numeric" placeholder="例如 25" aria-label="自定义完成时长（分钟）" />
							<span class="quick-checkin-custom-duration-unit">分钟</span>
						</label>
					</div>
				</div>
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
	const habitList = modal.querySelector('[data-habit-list]');
	const durationList = modal.querySelector('[data-duration-list]');
	const customDurationShell = modal.querySelector('[data-custom-duration-shell]');
	const customDurationInput = form.elements.customDuration;
	const activitySelect = form.elements.activity;
	const dateTimeInput = form.elements.dateTime;
	const submitButton = form.querySelector('.quick-checkin-submit');
	let habits = normalizeQuickCheckinHabits();
	let selectedHabitId = habits[0].id;
	let selectedDuration = habits[0].minimumMinutes;
	let usingCustomDuration = false;

	const setFeedback = (message = '', tone = 'info') => {
		feedback.textContent = message;
		feedback.dataset.tone = tone;
	};

	const updateDurationSelection = () => {
		for (const button of durationList.querySelectorAll('[data-duration]')) {
			button.classList.toggle(
				'is-active',
				!usingCustomDuration && Number(button.dataset.duration) === selectedDuration,
			);
		}
		customDurationShell.classList.toggle(
			'is-active',
			usingCustomDuration && parseQuickCheckinDuration(customDurationInput.value) !== null,
		);
	};

	const renderHabitOptions = () => {
		const habit = habits.find(({ id }) => id === selectedHabitId) ?? habits[0];
		selectedHabitId = habit.id;
		modal.style.setProperty('--quick-habit-color', habit.color);
		habitList.replaceChildren(
			...habits.map((candidate) => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'quick-checkin-type';
				button.classList.toggle('is-active', candidate.id === selectedHabitId);
				button.dataset.habitId = candidate.id;
				button.style.setProperty('--quick-habit-color', candidate.color);
				const mark = document.createElement('span');
				mark.className = 'quick-checkin-type-mark';
				mark.textContent = candidate.code;
				const copy = document.createElement('span');
				const strong = document.createElement('strong');
				strong.textContent = candidate.name.zh;
				const small = document.createElement('small');
				small.textContent = `最低 ${candidate.minimumMinutes} 分钟也算完成`;
				copy.append(strong, small);
				button.append(mark, copy);
				return button;
			}),
		);

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
				button.dataset.duration = String(duration);
				button.textContent = `${duration} 分钟`;
				return button;
			}),
		);
		updateDurationSelection();
	};

	const openModal = async (requestedHabitId = '') => {
		if (!isLocalPreview && !getGithubAccessToken()) {
			showStatus('请先使用 GitHub 登录后台，登录完成后点击右下角“快速打卡”。', 'info', 7600);
			return;
		}

		modal.hidden = false;
		document.body.style.overflow = 'hidden';
		setFeedback('正在读取最新的打卡模块...');
		if (!isLocalPreview && typeof readGithubJsonFile === 'function') {
			try {
				habits = normalizeQuickCheckinHabits(await readGithubJsonFile('src/data/site-settings.json'));
			} catch (error) {
				console.warn('[Jay CMS] could not refresh quick check-in settings.', error);
				habits = normalizeQuickCheckinHabits();
			}
		}
		selectedHabitId = habits.some(({ id }) => id === requestedHabitId)
			? requestedHabitId
			: habits[0].id;
		selectedDuration = habits.find(({ id }) => id === selectedHabitId)?.minimumMinutes ?? 5;
		usingCustomDuration = false;
		customDurationInput.value = '';
		dateTimeInput.value = localDateTimeValue();
		setFeedback(
			isLocalPreview
				? '本地预览暂不支持快速提交，请在线上后台使用。'
				: '保存后会提交到 GitHub，前台通常在 1 到 3 分钟内点亮。',
		);
		renderHabitOptions();
		habitList.querySelector(`[data-habit-id="${CSS.escape(selectedHabitId)}"]`)?.focus();
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

	habitList.addEventListener('click', (event) => {
		const button = event.target.closest('[data-habit-id]');
		if (!button) return;
		selectedHabitId = button.dataset.habitId;
		selectedDuration =
			habits.find(({ id }) => id === selectedHabitId)?.minimumMinutes ?? selectedDuration;
		usingCustomDuration = false;
		customDurationInput.value = '';
		renderHabitOptions();
	});

	durationList.addEventListener('click', (event) => {
		const button = event.target.closest('[data-duration]');
		if (!button) return;
		selectedDuration = Number(button.dataset.duration);
		usingCustomDuration = false;
		customDurationInput.value = '';
		updateDurationSelection();
	});

	customDurationInput.addEventListener('input', () => {
		usingCustomDuration = customDurationInput.value.trim() !== '';
		selectedDuration = parseQuickCheckinDuration(customDurationInput.value) ?? 0;
		updateDurationSelection();
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
		const selectedHabit = habits.find(({ id }) => id === selectedHabitId);
		if (usingCustomDuration && parseQuickCheckinDuration(customDurationInput.value) === null) {
			setFeedback(`自定义时长请输入 1 到 ${MAX_QUICK_CHECKIN_MINUTES} 的整数分钟。`, 'error');
			customDurationInput.focus();
			return;
		}
		if (!dateTime || !activity || selectedDuration <= 0 || !selectedHabit) {
			setFeedback('请补全打卡类型、时长和完成时间。', 'error');
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = '正在点亮...';
		setFeedback('正在创建打卡记录并提交到 GitHub...');

		try {
			const repoFilePath = createCheckinPath({
				habitId: selectedHabit.id,
				dateTime,
			});
			const markdown = createCheckinMarkdown({
				habit: selectedHabit,
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
					message: `Create quick check-in ${dateTime.slice(0, 10)} ${selectedHabit.name.zh}`,
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
				`${selectedHabit.name.zh}打卡已提交到 GitHub，前台通常在 1 到 3 分钟内更新。`,
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

	const requestedHabitId = new URL(window.location.href).searchParams.get('quick-checkin');
	if (requestedHabitId) {
		window.setTimeout(() => openModal(requestedHabitId), 520);
	}
}
