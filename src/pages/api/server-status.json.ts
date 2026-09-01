import { getCollection } from "astro:content";

export const prerender = true;

const publicPosts = await getCollection("posts", ({ data }) => !data.draft);
const branch = process.env.CF_PAGES_BRANCH || "main";
const commit = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) || "main";

export function GET(): Response {
	const payload = {
		ok: true,
		timestamp: new Date().toISOString(),
		service: { status: "online", name: "Cloudflare Pages", network: "全球边缘网络" },
		deployment: { branch, commit, mode: "GitHub 自动部署" },
		content: { posts: publicPosts.length, mode: "Astro 静态生成" },
		repository: { provider: "GitHub", branch: "main", history: "版本可恢复" },
	};

	return new Response(JSON.stringify(payload), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=60",
		},
	});
}
