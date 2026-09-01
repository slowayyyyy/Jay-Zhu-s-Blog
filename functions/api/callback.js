import {
	clearStateCookie,
	getCookie,
	getSiteOrigin,
	popupMessageResponse,
} from './_cms-auth.js';

const exchangeCodeForToken = async ({ clientId, clientSecret, code, redirectUri }) => {
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': "Jay-Zhu-s-Blog CMS OAuth",
		},
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		}).toString(),
	});

	const payload = await response.json().catch(() => ({}));
	return { response, payload };
};

export async function onRequestGet(context) {
	const origin = getSiteOrigin(context.request, context.env);
	const requestUrl = new URL(context.request.url);
	const error = requestUrl.searchParams.get('error');
	const errorDescription = requestUrl.searchParams.get('error_description');

	if (error) {
		return popupMessageResponse({
			origin,
			type: 'error',
			payload: {
				error,
				error_description: errorDescription ?? 'GitHub 授权被取消或失败。',
			},
			status: 400,
			headers: {
				'Set-Cookie': clearStateCookie(),
			},
			title: 'GitHub 授权未完成',
			description: errorDescription ?? '请关闭此窗口后返回后台重试。',
		});
	}

	const code = requestUrl.searchParams.get('code');
	const state = requestUrl.searchParams.get('state');
	const expectedState = getCookie(context.request, 'jay_cms_oauth_state');

	if (!code || !state || !expectedState || state !== expectedState) {
		return popupMessageResponse({
			origin,
			type: 'error',
			payload: {
				error: 'invalid_state',
				error_description: 'OAuth 状态校验失败，请重新发起登录。',
			},
			status: 400,
			headers: {
				'Set-Cookie': clearStateCookie(),
			},
			title: '授权状态已失效',
			description: '本次登录请求已过期或校验失败，请关闭窗口后重新登录。',
		});
	}

	const clientId = context.env.GITHUB_OAUTH_CLIENT_ID;
	const clientSecret = context.env.GITHUB_OAUTH_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return popupMessageResponse({
			origin,
			type: 'error',
			payload: {
				error: 'missing_oauth_config',
				error_description:
					'Cloudflare 中缺少 GITHUB_OAUTH_CLIENT_ID 或 GITHUB_OAUTH_CLIENT_SECRET。',
			},
			status: 503,
			headers: {
				'Set-Cookie': clearStateCookie(),
			},
			title: '后台登录尚未配置完成',
			description: '请先在 Cloudflare 中补全 GitHub OAuth 环境变量。',
		});
	}

	const redirectUri = `${origin}/api/callback`;
	const { response, payload } = await exchangeCodeForToken({
		clientId,
		clientSecret,
		code,
		redirectUri,
	});

	if (!response.ok || payload.error || !payload.access_token) {
		return popupMessageResponse({
			origin,
			type: 'error',
			payload: {
				error: payload.error || 'token_exchange_failed',
				error_description:
					payload.error_description || 'GitHub access token 交换失败，请稍后重试。',
			},
			status: 502,
			headers: {
				'Set-Cookie': clearStateCookie(),
			},
			title: 'GitHub 登录失败',
			description: payload.error_description || 'Access token 获取失败，请关闭窗口后重试。',
		});
	}

	return popupMessageResponse({
		origin,
		type: 'success',
		payload: {
			token: payload.access_token,
			provider: 'github',
		},
		headers: {
			'Set-Cookie': clearStateCookie(),
		},
		title: '授权完成',
		description: '登录结果已发送回后台，窗口会自动关闭。',
	});
}
