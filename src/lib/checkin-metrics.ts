export type LegacyHabitCategory = 'english' | 'exercise' | 'other';

export interface CheckinMetricSource {
	id: string;
	data: {
		date: Date;
		day?: string;
		title: string;
		summary?: string;
		habit?: string;
		category?: LegacyHabitCategory;
		duration?: number;
		activity?: string;
		tags?: string[];
	};
	body?: string;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ENGLISH_PATTERN = /英语|英文|听力|口语|背词|单词|english/iu;
const EXERCISE_PATTERN = /运动|锻炼|跑步|快走|力量|健身|拉伸|球类|健康打卡/iu;

const pad = (value: number) => String(value).padStart(2, '0');

export const formatLocalDayKey = (date: Date) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatShanghaiDayKey = (date = new Date()) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Shanghai',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${value.year}-${value.month}-${value.day}`;
};

export const getCheckinDayKey = (checkin: CheckinMetricSource) =>
	checkin.data.day && DAY_PATTERN.test(checkin.data.day)
		? checkin.data.day
		: formatLocalDayKey(checkin.data.date);

export const getCheckinHabitId = (checkin: CheckinMetricSource) => {
	const configuredHabit = checkin.data.habit?.trim().toLowerCase();
	if (configuredHabit) return configuredHabit;

	if (checkin.data.category === 'english' || checkin.data.category === 'exercise') {
		return checkin.data.category;
	}

	const searchable = [
		checkin.data.title,
		checkin.data.summary,
		checkin.data.activity,
		...(checkin.data.tags ?? []),
	]
		.filter(Boolean)
		.join(' ');
	if (ENGLISH_PATTERN.test(searchable)) return 'english';
	if (EXERCISE_PATTERN.test(searchable)) return 'exercise';
	return 'other';
};

const findDurationValues = (text: string, pattern: RegExp) =>
	[...text.matchAll(pattern)]
		.map((match) => Number(match[1]))
		.filter((value) => Number.isFinite(value) && value > 0);

export const getCheckinDurationMinutes = (checkin: CheckinMetricSource) => {
	const explicitDuration = Number(checkin.data.duration ?? 0);
	if (Number.isFinite(explicitDuration) && explicitDuration > 0) return explicitDuration;

	const searchable = [
		checkin.data.summary,
		checkin.data.activity,
		checkin.body,
	]
		.filter(Boolean)
		.join(' ');
	const hours = findDurationValues(
		searchable,
		/(\d+(?:\.\d+)?)\s*(?:小时|hours?|hrs?|h)(?![a-z])/giu,
	);
	const minutes = findDurationValues(
		searchable,
		/(\d+(?:\.\d+)?)\s*(?:分钟|minutes?|mins?|min)(?![a-z])/giu,
	);
	return Math.round(
		hours.reduce((total, value) => total + value * 60, 0)
		+ minutes.reduce((total, value) => total + value, 0),
	);
};

export const parseDayKey = (dayKey: string) => {
	const [year, month, day] = dayKey.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
};

export const addDays = (dayKey: string, amount: number) => {
	const date = parseDayKey(dayKey);
	date.setUTCDate(date.getUTCDate() + amount);
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export const getWeekStart = (dayKey: string) => {
	const date = parseDayKey(dayKey);
	const mondayOffset = (date.getUTCDay() + 6) % 7;
	return addDays(dayKey, -mondayOffset);
};

export const getMonthCalendar = (monthKey: string) => {
	const [year, month] = monthKey.split('-').map(Number);
	const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const leadingEmptyDays = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
	return {
		year,
		month,
		leadingEmptyDays,
		days: Array.from({ length: totalDays }, (_, index) => {
			const day = index + 1;
			return `${year}-${pad(month)}-${pad(day)}`;
		}),
	};
};
