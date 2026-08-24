const { chromium } = require('playwright-core');

const baseUrl = process.env.QUICK_CHECKIN_TEST_URL || 'http://localhost:4321';

async function run() {
	const browser = await chromium.launch({ channel: 'msedge', headless: true });
	try {
		const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
		await page.goto(`${baseUrl}/404.html`, { waitUntil: 'domcontentloaded' });
		await page.evaluate(async () => {
			const module = await import('/src/scripts/admin-quick-checkin.js');
			module.setupQuickCheckin({
				isLocalPreview: false,
				getGithubAccessToken: () => 'test-token',
				getGithubRepoInfo: () => ({ repo: 'owner/repo', branch: 'main' }),
				encodePathPreservingSlashes: (value) => value,
				blobToBase64: (blob) => new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.addEventListener('load', () => resolve(String(reader.result).split(',')[1]));
					reader.addEventListener('error', () => reject(reader.error));
					reader.readAsDataURL(blob);
				}),
				githubApiRequest: async (path, options) => {
					window.__quickCheckinRequest = { path, options };
					return { ok: true };
				},
				readGithubJsonFile: async () => ({
					checkinSettings: {
						habits: [{
							id: 'reading',
							name: { zh: '阅读', en: 'Reading' },
							code: 'RE',
							color: '#1684c7',
							weeklyGoal: 3,
							minimumMinutes: 10,
							durations: [10, 20, 30],
							activities: ['读论文'],
							enabled: true,
						}],
					},
				}),
				showStatus: () => {},
			});
		});

		await page.click('[data-quick-checkin-launcher]');
		await page.fill('input[name="customDuration"]', '25');
		await page.fill('input[name="dateTime"]', '2026-08-25T08:30');
		await page.click('.quick-checkin-submit');
		await page.waitForFunction(() =>
			document.querySelector('[data-quick-checkin-feedback]')?.dataset.tone === 'success');

		const result = await page.evaluate(() => {
			const requestBody = JSON.parse(window.__quickCheckinRequest.options.body);
			return {
				message: requestBody.message,
				markdown: new TextDecoder().decode(
					Uint8Array.from(atob(requestBody.content), (character) => character.charCodeAt(0)),
				),
			};
		});
		if (!result.markdown.includes('duration: 25')) {
			throw new Error('Custom duration was not serialized as 25 minutes.');
		}
		if (!result.markdown.includes('读论文 · 25 分钟')) {
			throw new Error('Custom duration was not reflected in the check-in summary.');
		}
		console.log(`Quick check-in UI verification passed: ${result.message}`);
	} finally {
		await browser.close();
	}
}

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
