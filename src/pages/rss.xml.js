import rss from '@astrojs/rss';
import { siteConfig } from '../data/site';
import { getAllPosts, getPostSlug } from '../lib/content';

export async function GET(context) {
	const posts = await getAllPosts();

	return rss({
		title: siteConfig.name,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			link: `/posts/${getPostSlug(post)}/`,
			pubDate: post.data.publishDate,
		})),
	});
}
