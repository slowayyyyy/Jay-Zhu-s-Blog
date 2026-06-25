import { buildStateCookie, createState, getSiteOrigin, htmlResponse } from './_cms-auth.js';

export async function onRequestGet(context) {
	const requestUrl = new URL(context.request.url);
	const provider = requestUrl.searchParams.get('provider')?.trim() || 'github';
	const clientId = context.env.GITHUB_OAUTH_CLIENT_ID;

	if (provider !== 'github') {
		return htmlResponse(
			`<main>
				<h1>暂不支持的登录方式</h1>
				<p>当前后台只配置了 GitHub 登录，请返回后台后重新选择 GitHub。</p>
			</main>`,
			{ status: 400 },
		);
	}

	if (!clientId) {
		return htmlResponse(
			`<main>
				<h1>后台登录尚未配置完成</h1>
				<p>Cloudflare 中缺少 <code>GITHUB_OAUTH_CLIENT_ID</code> 环境变量，请先完成部署配置。</p>
			</main>`,
			{ status: 503 },
		);
	}

	const origin = getSiteOrigin(context.request, context.env);
	const state = createState();
	const scope =
		requestUrl.searchParams.get('scope')?.trim() ||
		context.env.GITHUB_OAUTH_SCOPE?.trim() ||
		'repo';
	const redirectUri = `${origin}/api/callback`;
	const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

	authorizeUrl.searchParams.set('client_id', clientId);
	authorizeUrl.searchParams.set('redirect_uri', redirectUri);
	authorizeUrl.searchParams.set('scope', scope);
	authorizeUrl.searchParams.set('state', state);

	return htmlResponse(
		`<main>
			<h1>正在连接 GitHub</h1>
			<p>后台登录窗口正在与主页面建立连接，随后会自动跳转到 GitHub 授权页。</p>
		</main>
		<script>
			const provider = ${JSON.stringify(provider)};
			const targetOrigin = ${JSON.stringify(origin)};
			const authorizeUrl = ${JSON.stringify(authorizeUrl.toString())};
			let redirected = false;

			const beginAuthorize = () => {
				if (redirected) return;
				redirected = true;
				window.location.replace(authorizeUrl);
			};

			const handleMessage = (event) => {
				if (event.origin !== targetOrigin) return;
				if (event.data !== 'authorizing:' + provider) return;
				window.removeEventListener('message', handleMessage);
				beginAuthorize();
			};

			window.addEventListener('message', handleMessage);

			if (window.opener) {
				window.opener.postMessage('authorizing:' + provider, targetOrigin);
			}

			window.setTimeout(beginAuthorize, 1200);
		</script>`,
		{
			headers: {
				'Set-Cookie': buildStateCookie(state),
			},
		},
	);
}
