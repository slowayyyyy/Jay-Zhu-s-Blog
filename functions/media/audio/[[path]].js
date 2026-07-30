const AUDIO_OBJECT_PREFIX = 'audio/';
const ALLOWED_FETCH_SITES = new Set(['same-origin', 'same-site']);
const MAX_LEGACY_AUDIO_BYTES = 50 * 1024 * 1024;

const errorResponse = (message, status, extraHeaders = {}) =>
	new Response(message, {
		status,
		headers: {
			'cache-control': 'no-store',
			'content-type': 'text/plain; charset=utf-8',
			'x-content-type-options': 'nosniff',
			...extraHeaders,
		},
	});

const getPath = (params) => {
	const value = params?.path;
	const path = Array.isArray(value) ? value.join('/') : String(value || '');
	const segments = path.split('/').filter(Boolean);
	if (
		segments.length === 0 ||
		segments.some((segment) => segment === '.' || segment === '..')
	) {
		return null;
	}
	return segments.join('/');
};

const isSameSiteAudioRequest = (request) => {
	const requestUrl = new URL(request.url);
	const fetchSite = request.headers.get('sec-fetch-site');
	const fetchDest = request.headers.get('sec-fetch-dest');
	const referer = request.headers.get('referer');

	if (fetchSite) return ALLOWED_FETCH_SITES.has(fetchSite);
	if (referer) {
		try {
			return new URL(referer).origin === requestUrl.origin;
		} catch {
			return false;
		}
	}

	return fetchDest === 'audio';
};

const parseRange = (rangeHeader) => {
	if (!rangeHeader) return undefined;
	const match = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader.trim());
	if (!match || (!match[1] && !match[2])) return null;

	if (!match[1]) {
		const suffix = Number(match[2]);
		return Number.isSafeInteger(suffix) && suffix > 0 ? { suffix } : null;
	}

	const offset = Number(match[1]);
	if (!Number.isSafeInteger(offset) || offset < 0) return null;
	if (!match[2]) return { offset };

	const end = Number(match[2]);
	if (!Number.isSafeInteger(end) || end < offset) return null;
	return { offset, length: end - offset + 1 };
};

const buildObjectHeaders = (object, isRange) => {
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('accept-ranges', 'bytes');
	headers.set('cache-control', 'private, max-age=3600');
	headers.set('content-disposition', 'inline');
	headers.set('content-type', object.httpMetadata?.contentType || 'audio/mpeg');
	headers.set('cross-origin-resource-policy', 'same-origin');
	headers.set('etag', object.httpEtag);
	headers.set('last-modified', object.uploaded.toUTCString());
	headers.set('x-content-type-options', 'nosniff');

	if (isRange && object.range) {
		const suffix = Number.isFinite(object.range.suffix) ? object.range.suffix : 0;
		const offset = Number.isFinite(object.range.offset)
			? object.range.offset
			: Math.max(0, object.size - suffix);
		const length = Number.isFinite(object.range.length) ? object.range.length : suffix;
		headers.set('content-length', String(length));
		headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
	} else {
		headers.set('content-length', String(object.size));
	}

	return headers;
};

const encodePath = (path) =>
	path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

const migrateLegacyAudio = async ({ request, bucket, path, objectKey }) => {
	const legacyUrl = new URL(`/audio/${encodePath(path)}`, request.url);
	const response = await fetch(legacyUrl, {
		headers: {
			Accept: 'audio/*',
			'User-Agent': 'Jay-Zhu-s-Blog R2 Audio Migration',
		},
	});
	if (!response.ok || !response.body) return false;

	const contentLength = Number(response.headers.get('content-length') || 0);
	if (contentLength <= 0 || contentLength > MAX_LEGACY_AUDIO_BYTES) return false;
	const contentType = response.headers.get('content-type') || 'audio/mpeg';
	if (!contentType.toLowerCase().startsWith('audio/')) return false;

	const object = await bucket.put(objectKey, response.body, {
		httpMetadata: {
			contentType,
			contentDisposition: 'inline',
		},
		customMetadata: {
			migratedFrom: legacyUrl.pathname,
		},
	});
	return Boolean(object);
};

export async function onRequest(context) {
	const { request, env, params } = context;
	const method = request.method.toUpperCase();

	if (method !== 'GET' && method !== 'HEAD') {
		return errorResponse('Method not allowed', 405, { allow: 'GET, HEAD' });
	}
	if (!isSameSiteAudioRequest(request)) {
		return errorResponse('Cross-site media request blocked', 403);
	}
	if (!env.BLOG_MEDIA) {
		return errorResponse('BLOG_MEDIA binding is not configured', 503);
	}

	const path = getPath(params);
	if (!path) return errorResponse('Invalid audio path', 400);
	const objectKey = `${AUDIO_OBJECT_PREFIX}${path}`;

	if (env.MEDIA_RATE_LIMITER) {
		const clientKey = request.headers.get('cf-connecting-ip') || 'unknown';
		const { success } = await env.MEDIA_RATE_LIMITER.limit({ key: `audio:${clientKey}` });
		if (!success) {
			return errorResponse('Too many media requests', 429, { 'retry-after': '60' });
		}
	}

	let metadata = await env.BLOG_MEDIA.head(objectKey);
	if (!metadata) {
		const migrated = await migrateLegacyAudio({
			request,
			bucket: env.BLOG_MEDIA,
			path,
			objectKey,
		});
		if (migrated) metadata = await env.BLOG_MEDIA.head(objectKey);
	}

	if (method === 'HEAD') {
		if (!metadata) return errorResponse('Audio not found', 404);
		return new Response(null, { headers: buildObjectHeaders(metadata, false) });
	}

	const rangeHeader = request.headers.get('range');
	const range = parseRange(rangeHeader);
	if (rangeHeader && !range) {
		return errorResponse('Invalid byte range', 416, { 'content-range': 'bytes */*' });
	}

	try {
		const object = await env.BLOG_MEDIA.get(objectKey, range ? { range } : undefined);
		if (!object?.body) return errorResponse('Audio not found', 404);
		return new Response(object.body, {
			status: range ? 206 : 200,
			headers: buildObjectHeaders(object, Boolean(range)),
		});
	} catch {
		return errorResponse('Requested range is not satisfiable', 416, {
			'content-range': 'bytes */*',
		});
	}
}
