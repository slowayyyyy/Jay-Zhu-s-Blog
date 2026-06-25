import { buildStateCookie, createState, getSiteOrigin, htmlResponse } from './_cms-auth.js';

export async function onRequestGet(context) {
	const clientId = context.env.GITHUB_OAUTH_CLIENT_ID;
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
	const scope = context.env.GITHUB_OAUTH_SCOPE?.trim() || 'repo';
	const redirectUri = `${origin}/api/callback`;
	const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

	authorizeUrl.searchParams.set('client_id', clientId);
	authorizeUrl.searchParams.set('redirect_uri', redirectUri);
	authorizeUrl.searchParams.set('scope', scope);
	authorizeUrl.searchParams.set('state', state);

	return new Response(null, {
		status: 302,
		headers: {
			Location: authorizeUrl.toString(),
			'Set-Cookie': buildStateCookie(state),
			'cache-control': 'no-store',
		},
	});
}
