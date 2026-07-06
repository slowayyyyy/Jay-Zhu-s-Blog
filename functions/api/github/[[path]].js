const GITHUB_API_ROOT = 'https://api.github.com';
const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'content-length',
	'cookie',
	'cf-connecting-ip',
	'cf-ipcountry',
	'cf-ray',
	'cf-visitor',
	'host',
	'origin',
	'referer',
	'transfer-encoding',
	'x-forwarded-for',
	'x-forwarded-host',
	'x-forwarded-proto',
	'x-real-ip',
]);

const buildTargetUrl = (requestUrl, paramsPath) => {
	const pathSegments = Array.isArray(paramsPath)
		? paramsPath
		: paramsPath
			? [paramsPath]
			: [];
	const pathname = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
	const targetUrl = new URL(`${GITHUB_API_ROOT}/${pathname}`);
	targetUrl.search = requestUrl.search;
	targetUrl.searchParams.delete('raw');
	return targetUrl;
};

const buildForwardHeaders = (requestHeaders, rawDownload = false) => {
	const headers = new Headers();

	for (const [key, value] of requestHeaders.entries()) {
		if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
		headers.set(key, value);
	}

	headers.set(
		'Accept',
		rawDownload
			? 'application/vnd.github.raw'
			: requestHeaders.get('Accept') || 'application/vnd.github+json',
	);
	headers.set('User-Agent', 'Jay-Zhu-s-Blog CMS Proxy');

	return headers;
};

const rewriteHeaderUrls = (value, proxyRoot) =>
	value.replaceAll(GITHUB_API_ROOT, proxyRoot);

const buildResponseHeaders = (githubHeaders, proxyRoot) => {
	const headers = new Headers();

	for (const [key, value] of githubHeaders.entries()) {
		const lowerKey = key.toLowerCase();
		if (lowerKey === 'content-length' || lowerKey === 'transfer-encoding') continue;

		if (lowerKey === 'link' || lowerKey === 'location') {
			headers.set(key, rewriteHeaderUrls(value, proxyRoot));
			continue;
		}

		headers.set(key, value);
	}

	headers.set('Cache-Control', 'no-store');
	return headers;
};

export async function onRequest(context) {
	const request = context.request;
	const requestUrl = new URL(request.url);
	const rawDownload = requestUrl.searchParams.get('raw') === '1';
	const targetUrl = buildTargetUrl(requestUrl, context.params.path);
	const proxyRoot = `${requestUrl.origin}/api/github`;
	const method = request.method.toUpperCase();
	const init = {
		method,
		headers: buildForwardHeaders(request.headers, rawDownload),
		redirect: 'manual',
	};

	if (method !== 'GET' && method !== 'HEAD') {
		init.body = await request.arrayBuffer();
	}

	const response = await fetch(targetUrl, init);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: buildResponseHeaders(response.headers, proxyRoot),
	});
}
