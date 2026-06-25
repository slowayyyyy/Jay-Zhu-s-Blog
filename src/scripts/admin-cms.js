import { remarkTightInlineFormatting } from '../lib/remark-tight-inline-formatting.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function setupAdminCms() {
	if (!window.CMS || window.__jayCmsSetup) return;
	window.__jayCmsSetup = true;

	window.CMS.registerRemarkPlugin(remarkTightInlineFormatting);

	let syncTimer;
	let statusTimer;
	let reloadTimer;
	const isLocalPreview = LOCAL_HOSTS.has(window.location.hostname);
	const syncChannel =
		'BroadcastChannel' in window ? new BroadcastChannel('jay-content-sync') : null;

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
					padding: 12px 14px;
					border: 1px solid rgba(24, 33, 43, 0.08);
					border-radius: 16px;
					background: rgba(255, 255, 255, 0.92);
					box-shadow: 0 20px 50px rgba(45, 67, 87, 0.14);
					color: #18212b;
					font: 13px/1.6 "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
					backdrop-filter: blur(14px);
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
			`;
			document.head.append(style);
		}

		notice = document.createElement('div');
		notice.dataset.jayCmsStatus = 'true';
		document.body.append(notice);
		return notice;
	};

	const idleMessage = () =>
		isLocalPreview
			? '本地模式：保存后会自动刷新预览内容。'
			: '线上模式：保存后先提交到 GitHub，再由 Cloudflare Pages 发布，前台通常 1 到 3 分钟更新。';

	const showStatus = (message, tone = 'info', duration = 0) => {
		const notice = ensureStatusNotice();
		notice.textContent = message;
		notice.dataset.tone = tone;
		window.clearTimeout(statusTimer);
		if (duration > 0) {
			statusTimer = window.setTimeout(() => showStatus(idleMessage(), 'info'), duration);
		}
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
						3600,
					);
					scheduleAdminReload(isLocalPreview ? 700 : 1200);
					return;
				}

				if (isLocalPreview) {
					showStatus(`${label}已保存，本地预览已同步。`, 'success', 3400);
					return;
				}

				showStatus(
					`${label}已提交到 GitHub。Cloudflare Pages 通常会在 1 到 3 分钟内更新前台。`,
					'info',
					7200,
				);
			} catch (error) {
				console.error('[Jay CMS] content sync failed.', error);
				showStatus(
					isLocalPreview
						? `${label}已保存，但本地预览刷新失败，请手动刷新前台检查。`
						: `${label}已保存到仓库，但后台刷新失败，请手动刷新当前页面后再继续编辑。`,
					'error',
					7800,
				);
			}
		}, 420);
	};

	showStatus(idleMessage(), 'info');

	['postSave', 'postPublish', 'postUnpublish'].forEach((name) => {
		window.CMS.registerEventListener({ name, handler: handleContentUpdate });
	});
}
