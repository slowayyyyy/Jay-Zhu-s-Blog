export const prerender = true;

export function GET(): Response {
	const payload = {
		ok: true,
		timestamp: new Date().toISOString(),
		cpu: { usage: 0, cores: 0, model: "Cloudflare edge", load1: 0 },
		memory: { totalBytes: 0, availableBytes: 0, usedBytes: 0, usage: 0 },
		disk: { totalBytes: 0, availableBytes: 0, usedBytes: 0, usage: 0 },
		system: {
			name: "Cloudflare Pages",
			kernel: "Edge network",
			arch: "Global",
			uptimeSeconds: 0,
		},
	};

	return new Response(JSON.stringify(payload), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
}
