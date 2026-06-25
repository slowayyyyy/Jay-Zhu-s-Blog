const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @returns {import('astro').AstroIntegration} */
export function devContentSync() {
	return {
		name: 'jay-dev-content-sync',
		hooks: {
			/** @param {import('astro').HookParameters<'astro:server:setup'>} options */
			'astro:server:setup': (options) => {
				const { server, refreshContent, logger } = options;
				if (!refreshContent) return;

				server.middlewares.use('/__content-sync', async (req, res) => {
					if (req.method !== 'POST') {
						res.statusCode = 405;
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
						return;
					}

					try {
						// Decap CMS may emit its save event slightly before the file watcher settles.
						for (const delay of [80, 180, 320]) {
							await wait(delay);
							await refreshContent({});
						}

						res.statusCode = 200;
						res.setHeader('Cache-Control', 'no-store');
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						res.end(JSON.stringify({ ok: true, refreshedAt: Date.now() }));
					} catch (error) {
						logger.error(`content sync failed: ${error instanceof Error ? error.message : String(error)}`);
						res.statusCode = 500;
						res.setHeader('Cache-Control', 'no-store');
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						res.end(JSON.stringify({ ok: false, error: 'content_sync_failed' }));
					}
				});
			},
		},
	};
}
