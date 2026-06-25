const STATE_COOKIE_NAME = 'jay_cms_oauth_state';
const STATE_TTL_SECONDS = 60 * 10;

const defaultHeaders = {
	'cache-control': 'no-store',
};

export const getSiteOrigin = (request, env) => {
	const configuredSiteUrl = env.PUBLIC_SITE_URL?.trim();
	if (configuredSiteUrl) {
		return configuredSiteUrl.replace(/\/+$/, '');
	}

	return new URL(request.url).origin;
};

export const getCookie = (request, name) => {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) return null;

	for (const chunk of cookieHeader.split(';')) {
		const [rawName, ...rawValue] = chunk.trim().split('=');
		if (rawName !== name) continue;
		return decodeURIComponent(rawValue.join('='));
	}

	return null;
};

export const buildStateCookie = (state) =>
	`${STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Max-Age=${STATE_TTL_SECONDS}; Path=/api/callback; HttpOnly; Secure; SameSite=Lax`;

export const clearStateCookie = () =>
	`${STATE_COOKIE_NAME}=; Max-Age=0; Path=/api/callback; HttpOnly; Secure; SameSite=Lax`;

export const createState = () => crypto.randomUUID().replaceAll('-', '');

export const htmlResponse = (body, init = {}) =>
	new Response(
		`<!doctype html>
<html lang="zh-CN">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Jay CMS Auth</title>
		<style>
			:root {
				color-scheme: light;
				font-family: "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
			}

			body {
				margin: 0;
				min-height: 100vh;
				display: grid;
				place-items: center;
				padding: 24px;
				background:
					radial-gradient(circle at top, rgba(55, 109, 123, 0.12), transparent 38%),
					#f7f9fb;
				color: #18212b;
			}

			main {
				width: min(440px, 100%);
				padding: 28px 24px;
				border: 1px solid rgba(31, 51, 69, 0.1);
				border-radius: 24px;
				background: rgba(255, 255, 255, 0.94);
				box-shadow: 0 24px 60px rgba(45, 67, 87, 0.08);
			}

			h1 {
				margin: 0 0 12px;
				font-size: 22px;
				line-height: 1.2;
			}

			p {
				margin: 0;
				line-height: 1.7;
				color: rgba(24, 33, 43, 0.76);
			}
		</style>
	</head>
	<body>
		${body}
	</body>
</html>`,
		{
			status: init.status ?? 200,
			headers: {
				'content-type': 'text/html; charset=utf-8',
				...defaultHeaders,
				...init.headers,
			},
		},
	);

export const popupMessageResponse = ({
	origin,
	provider = 'github',
	type,
	payload,
	status = 200,
	headers = {},
	title,
	description,
}) => {
	const safePayload = JSON.stringify(payload).replaceAll('<', '\\u003c');
	const safeOrigin = JSON.stringify(origin);
	const prefix = JSON.stringify(`authorization:${provider}:${type}:`);
	const fallbackTitle = title ?? (type === 'success' ? '授权完成' : '授权失败');
	const fallbackDescription =
		description ??
		(type === 'success'
			? '已将登录结果发送回内容管理后台。若窗口未自动关闭，可直接关闭。'
			: '请关闭此窗口后返回后台重试。');

	return htmlResponse(
		`<main>
			<h1>${fallbackTitle}</h1>
			<p>${fallbackDescription}</p>
		</main>
		<script>
			const payload = ${safePayload};
			const message = ${prefix} + JSON.stringify(payload);
			const targetOrigin = ${safeOrigin};

			if (window.opener) {
				window.opener.postMessage(message, targetOrigin);
			}

			window.close();
		</script>`,
		{
			status,
			headers,
		},
	);
};
