const AUDIO_OBJECT_PREFIX = 'audio/';
const DEFAULT_OWNER_LOGIN = 'slowayyyyy';
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const AUDIO_EXTENSION_PATTERN = /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)$/iu;
const ALLOWED_AUDIO_TYPES = new Set([
	'application/octet-stream',
	'audio/aac',
	'audio/flac',
	'audio/m4a',
	'audio/mp4',
	'audio/mpeg',
	'audio/ogg',
	'audio/opus',
	'audio/wav',
	'audio/x-m4a',
	'audio/x-wav',
]);

const jsonResponse = (payload, status = 200, extraHeaders = {}) =>
	Response.json(payload, {
		status,
		headers: {
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff',
			...extraHeaders,
		},
	});

const getPath = (params) => {
	const value = params?.path;
	const path = Array.isArray(value) ? value.join('/') : String(value || '');
	let segments;
	try {
		segments = path
			.split('/')
			.filter(Boolean)
			.map((segment) => decodeURIComponent(segment));
	} catch {
		return null;
	}
	if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
		return null;
	}
	return segments.join('/');
};

const getAccessToken = (request) => {
	const authorization = request.headers.get('authorization') || '';
	const match = /^(?:Bearer|token)\s+(.+)$/iu.exec(authorization.trim());
	return match?.[1]?.trim() || null;
};

const authorizeOwner = async (request, env) => {
	const token = getAccessToken(request);
	if (!token) return { ok: false, status: 401, message: 'Missing GitHub authorization' };

	const response = await fetch('https://api.github.com/user', {
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'User-Agent': 'Jay-Zhu-s-Blog R2 Media Admin',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});
	if (!response.ok) {
		return { ok: false, status: 401, message: 'GitHub authorization expired' };
	}

	const profile = await response.json();
	const expectedLogin = (env.CMS_GITHUB_LOGIN || DEFAULT_OWNER_LOGIN).trim().toLowerCase();
	if (String(profile.login || '').toLowerCase() !== expectedLogin) {
		return {
			ok: false,
			status: 403,
			message: 'Only the blog owner can manage audio',
		};
	}
	return { ok: true };
};

const isSameOriginRequest = (request) => {
	const origin = request.headers.get('origin');
	return !origin || origin === new URL(request.url).origin;
};

export async function onRequest(context) {
	const { request, env, params } = context;
	const method = request.method.toUpperCase();
	if (method !== 'PUT') {
		return jsonResponse({ error: 'Method not allowed' }, 405, { allow: 'PUT' });
	}
	if (!isSameOriginRequest(request)) {
		return jsonResponse({ error: 'Cross-origin request blocked' }, 403);
	}
	if (!env.BLOG_MEDIA) {
		return jsonResponse({ error: 'BLOG_MEDIA binding is not configured' }, 503);
	}

	const authorization = await authorizeOwner(request, env);
	if (!authorization.ok) {
		return jsonResponse({ error: authorization.message }, authorization.status);
	}

	const path = getPath(params);
	if (!path || !AUDIO_EXTENSION_PATTERN.test(path)) {
		return jsonResponse({ error: 'Unsupported or invalid audio filename' }, 400);
	}
	const objectKey = `${AUDIO_OBJECT_PREFIX}${path}`;

	const contentLength = Number(request.headers.get('content-length') || 0);
	if (contentLength <= 0 || contentLength > MAX_AUDIO_BYTES) {
		return jsonResponse({ error: 'Audio file must be between 1 byte and 50 MB' }, 413);
	}
	const contentType = (request.headers.get('content-type') || 'application/octet-stream')
		.split(';')[0]
		.trim()
		.toLowerCase();
	if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
		return jsonResponse({ error: `Unsupported audio type: ${contentType}` }, 415);
	}
	if (!request.body) return jsonResponse({ error: 'Audio body is missing' }, 400);

	let originalName = path.split('/').at(-1) || path;
	try {
		originalName = decodeURIComponent(request.headers.get('x-original-filename') || originalName);
	} catch {
		// Keep the sanitized URL filename when the optional display name is malformed.
	}
	originalName = originalName.slice(0, 240);
	const object = await env.BLOG_MEDIA.put(objectKey, request.body, {
		httpMetadata: {
			contentType,
			contentDisposition: 'inline',
		},
		customMetadata: {
			originalName,
			uploadedBy: DEFAULT_OWNER_LOGIN,
		},
	});
	if (!object) return jsonResponse({ error: 'R2 upload did not complete' }, 502);

	return jsonResponse(
		{
			path: `/media/audio/${path}`,
			size: object.size,
			etag: object.httpEtag,
		},
		201,
	);
}
