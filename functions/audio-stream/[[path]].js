const AUDIO_REPOSITORY_ROOT =
	'https://raw.githubusercontent.com/slowayyyyy/Jay-Zhu-s-Blog/main/public/audio';

const AUDIO_CONTENT_TYPES = new Map([
	['mp3', 'audio/mpeg'],
	['m4a', 'audio/mp4'],
	['aac', 'audio/aac'],
	['ogg', 'audio/ogg'],
	['wav', 'audio/wav'],
	['flac', 'audio/flac'],
]);

const decodePathSegment = (value) => {
	let decoded = value;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			const nextValue = decodeURIComponent(decoded);
			if (nextValue === decoded) break;
			decoded = nextValue;
		} catch {
			break;
		}
	}
	return decoded;
};

const encodeAudioPath = (value) =>
	String(value || '')
		.split('/')
		.filter((segment) => segment && segment !== '.' && segment !== '..')
		.map((segment) => encodeURIComponent(decodePathSegment(segment)))
		.join('/');

export async function onRequest({ request, params }) {
	const method = request.method.toUpperCase();
	if (method !== 'GET' && method !== 'HEAD') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: { Allow: 'GET, HEAD' },
		});
	}

	const requestPath = new URL(request.url).pathname.replace(/^\/audio-stream\/?/u, '');
	const path = requestPath || (Array.isArray(params.path) ? params.path.join('/') : params.path);
	const encodedPath = encodeAudioPath(path);
	if (!encodedPath) return new Response('Audio not found', { status: 404 });

	const headers = new Headers();
	for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}

	const upstream = await fetch(`${AUDIO_REPOSITORY_ROOT}/${encodedPath}`, {
		method,
		headers,
		redirect: 'follow',
	});
	const responseHeaders = new Headers(upstream.headers);
	const extension = encodedPath.match(/\.([a-z0-9]+)$/iu)?.[1]?.toLowerCase();
	responseHeaders.set(
		'Content-Type',
		AUDIO_CONTENT_TYPES.get(extension) || upstream.headers.get('Content-Type') || 'audio/mpeg',
	);
	responseHeaders.set('Accept-Ranges', 'bytes');
	responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

	return new Response(method === 'HEAD' ? null : upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}
