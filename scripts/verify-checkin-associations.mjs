import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './verify-helpers.mjs';

const settings = JSON.parse(
	await readFile(join(root, 'src', 'data', 'site-settings.json'), 'utf8'),
);
const html = await readFile(join(root, 'dist', 'checkins', 'index.html'), 'utf8');
const configuredHabits = Array.isArray(settings?.checkinSettings?.habits)
	? settings.checkinSettings.habits
	: [];
const errors = [];
const enabledHabits = [];
const seen = new Set();

for (const habit of configuredHabits) {
	const id = String(habit?.id ?? '').trim().toLowerCase();
	if (!id || habit?.enabled === false || seen.has(id)) continue;
	seen.add(id);
	enabledHabits.push({
		id,
		weeklyGoal: Math.min(7, Math.max(1, Number(habit?.weeklyGoal) || 1)),
		minimumMinutes: Math.max(1, Number(habit?.minimumMinutes) || 1),
	});
}

const stateMatch = html.match(
	/<script[^>]*data-dashboard-state[^>]*>([\s\S]*?)<\/script>/u,
);
if (!stateMatch) {
	errors.push('Check-ins page is missing its dashboard state.');
}

let state;
if (stateMatch) {
	try {
		state = JSON.parse(stateMatch[1]);
	} catch {
		errors.push('Check-ins dashboard state is not valid JSON.');
	}
}

const countAttribute = (name, id) =>
	[...html.matchAll(new RegExp(`${name}="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'gu'))]
		.length;

for (const habit of enabledHabits) {
	const expectedLocations = [
		['today indicator', 'data-today-habit'],
		['quick action', 'data-quick-habit'],
		['weekly card', 'data-weekly-habit'],
		['time card', 'data-time-habit'],
		['calendar legend', 'data-legend-habit'],
	];

	for (const [label, attribute] of expectedLocations) {
		const count = countAttribute(attribute, habit.id);
		if (count !== 1) {
			errors.push(`${habit.id} has ${count} ${label}(s); expected exactly 1.`);
		}
	}

	const renderedState = state?.habits?.find((item) => item.id === habit.id);
	if (!renderedState) {
		errors.push(`${habit.id} is missing from dashboard runtime state.`);
		continue;
	}
	if (renderedState.weeklyGoal !== habit.weeklyGoal) {
		errors.push(
			`${habit.id} weekly goal mismatch: expected ${habit.weeklyGoal}, got ${renderedState.weeklyGoal}.`,
		);
	}
	if (renderedState.minimumMinutes !== habit.minimumMinutes) {
		errors.push(
			`${habit.id} minimum minutes mismatch: expected ${habit.minimumMinutes}, got ${renderedState.minimumMinutes}.`,
		);
	}

	const expectedMonthGoal = habit.weeklyGoal * 4 * habit.minimumMinutes;
	if (!html.includes(`data-weekly-habit="${habit.id}" data-weekly-goal="${habit.weeklyGoal}" data-minimum-minutes="${habit.minimumMinutes}"`)) {
		errors.push(`${habit.id} weekly card does not carry the configured goal values.`);
	}
	if (!html.includes(`data-time-habit="${habit.id}" data-month-goal="${expectedMonthGoal}"`)) {
		errors.push(
			`${habit.id} monthly baseline is not weeklyGoal * 4 * minimumMinutes (${expectedMonthGoal}).`,
		);
	}
}

const renderedHabitIds = Array.isArray(state?.habits)
	? state.habits.map((habit) => habit.id)
	: [];
const expectedHabitIds = enabledHabits.map((habit) => habit.id);
if (renderedHabitIds.join('\n') !== expectedHabitIds.join('\n')) {
	errors.push(
		`Runtime habit order mismatch: expected [${expectedHabitIds.join(', ')}], got [${renderedHabitIds.join(', ')}].`,
	);
}

if (errors.length > 0) {
	throw new Error(`Check-in association verification failed:\n- ${errors.join('\n- ')}`);
}

console.log(
	`Check-in association verification passed: ${enabledHabits.length} enabled habit(s) are fully linked.`,
);
