import { remarkTightInlineFormatting } from '../lib/remark-tight-inline-formatting.mjs';

export function setupAdminCms() {
	if (!window.CMS || window.__jayCmsSetup) return;
	window.__jayCmsSetup = true;

	window.CMS.registerRemarkPlugin(remarkTightInlineFormatting);

	let syncTimer;
	const syncChannel =
		'BroadcastChannel' in window ? new BroadcastChannel('jay-content-sync') : null;

	const broadcastUpdate = (collection) => {
		const payload = { collection, updatedAt: Date.now() };
		localStorage.setItem('jay-content-updated', JSON.stringify(payload));
		syncChannel?.postMessage(payload);
	};

	const syncContent = async (collection) => {
		const needsContentRefresh = ['posts', 'checkins', 'tag_settings'].includes(collection);
		if (needsContentRefresh) {
			const response = await fetch('/__content-sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				throw new Error(`content sync failed: ${response.status}`);
			}
		}

		broadcastUpdate(collection);
	};

	const handleContentUpdate = ({ entry }) => {
		const collection = entry?.get?.('collection') || 'unknown';
		clearTimeout(syncTimer);
		syncTimer = setTimeout(async () => {
			let synced = false;
			try {
				await syncContent(collection);
				synced = true;
			} catch (error) {
				console.error('[Jay CMS] content sync failed, frontend reload skipped.', error);
			}

			if (synced && collection === 'tag_settings') {
				window.location.reload();
			}
		}, 420);
	};

	['postSave', 'postPublish', 'postUnpublish', 'postDelete'].forEach((name) => {
		window.CMS.registerEventListener({ name, handler: handleContentUpdate });
	});
}
