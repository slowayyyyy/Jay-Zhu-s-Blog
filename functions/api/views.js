const headers = {
	'content-type': 'application/json; charset=utf-8',
	'cache-control': 'no-store',
};

const getViews = async (env, id) => {
	if (!env.BLOG_VIEWS) {
		return null;
	}

	const stored = await env.BLOG_VIEWS.get(`views:${id}`);
	return Number(stored ?? '0');
};

export async function onRequestGet(context) {
	const id = new URL(context.request.url).searchParams.get('id');
	if (!id) {
		return new Response(JSON.stringify({ error: 'missing id' }), {
			status: 400,
			headers,
		});
	}

	const views = await getViews(context.env, id);
	if (views === null) {
		return new Response(JSON.stringify({ error: 'BLOG_VIEWS binding missing' }), {
			status: 503,
			headers,
		});
	}

	return new Response(JSON.stringify({ id, views }), { headers });
}

export async function onRequestPost(context) {
	const id = new URL(context.request.url).searchParams.get('id');
	if (!id) {
		return new Response(JSON.stringify({ error: 'missing id' }), {
			status: 400,
			headers,
		});
	}

	if (!context.env.BLOG_VIEWS) {
		return new Response(JSON.stringify({ error: 'BLOG_VIEWS binding missing' }), {
			status: 503,
			headers,
		});
	}

	const current = await getViews(context.env, id);
	const next = (current ?? 0) + 1;
	await context.env.BLOG_VIEWS.put(`views:${id}`, String(next));

	return new Response(JSON.stringify({ id, views: next }), { headers });
}
