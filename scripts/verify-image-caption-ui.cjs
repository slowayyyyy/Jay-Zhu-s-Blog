const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright-core');

const baseUrl = process.env.IMAGE_CAPTION_TEST_URL || 'http://localhost:4321';

async function run() {
	const browser = await chromium.launch({ channel: 'msedge', headless: true });
	try {
		const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
		await page.goto(`${baseUrl}/404.html`, { waitUntil: 'domcontentloaded' });
		await page.evaluate(async () => {
			window.captionModule = await import('/src/scripts/admin-image-caption.js');
			window.captionPromise = window.captionModule.requestPastedImageCaptions(['/favicon.svg']);
		});
		await page.waitForSelector('[data-jay-paste-caption-dialog][open]');
		await page.fill('.jay-paste-caption-field input', '\u56fe 1 \u00b7 \u6a21\u578b\u7684"\u6574\u4f53\u7ed3\u6784"');
		await page.screenshot({ path: path.join(os.tmpdir(), 'jay-paste-caption-dialog-desktop.png') });
		await page.click('.jay-paste-caption-actions button[type="submit"]');

		const confirmed = await page.evaluate(async () => {
			const captions = await window.captionPromise;
			return {
				captions,
				markup: window.captionModule.createPastedImageMarkup(['/uploads/test.png'], captions),
			};
		});
		if (!confirmed.markup.markdown.includes('\\"\u6574\u4f53\u7ed3\u6784\\"')) {
			throw new Error(`Caption was not escaped in Markdown: ${confirmed.markup.markdown}`);
		}
		if (!confirmed.markup.html.includes('&quot;\u6574\u4f53\u7ed3\u6784&quot;')) {
			throw new Error(`Caption was not escaped in HTML: ${confirmed.markup.html}`);
		}

		await page.evaluate(() => {
			window.skipPromise = window.captionModule.requestPastedImageCaptions(['/favicon.svg']);
		});
		await page.waitForSelector('[data-jay-paste-caption-dialog][open]');
		await page.keyboard.press('Escape');
		const skipped = await page.evaluate(async () => {
			const captions = await window.skipPromise;
			return window.captionModule.createPastedImageMarkup(['/uploads/test.png'], captions);
		});
		if (skipped.markdown.includes(' "')) {
			throw new Error('Escape should insert the image without a caption.');
		}

		await page.setViewportSize({ width: 390, height: 844 });
		await page.evaluate(() => {
			window.mobilePromise = window.captionModule.requestPastedImageCaptions([
				'/favicon.svg',
				'/favicon.svg',
			]);
		});
		await page.waitForSelector('[data-jay-paste-caption-dialog][open]');
		const mobile = await page.evaluate(() => ({
			inputCount: document.querySelectorAll('.jay-paste-caption-field input').length,
			overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
		}));
		await page.screenshot({ path: path.join(os.tmpdir(), 'jay-paste-caption-dialog-mobile.png') });
		await page.keyboard.press('Escape');
		await page.evaluate(() => window.mobilePromise);
		if (mobile.inputCount !== 2 || mobile.overflow) {
			throw new Error(`Mobile multi-image dialog failed: ${JSON.stringify(mobile)}`);
		}

		console.log('Image caption UI verification passed: confirm, Escape, multi-image, mobile.');
	} finally {
		await browser.close();
	}
}

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
