type SeriesPost = {
	id: string;
	data: {
		series?: string;
		seriesOrder?: number;
		published: Date;
		draft: boolean;
	};
};

export function getSeriesPosts<T extends SeriesPost>(posts: T[], series: string): T[] {
	const name = series.trim();
	if (!name) return [];
	return posts.filter((post) => !post.data.draft && post.data.series?.trim() === name)
		.sort((a, b) => {
			const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
			const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
			return orderA - orderB || a.data.published.getTime() - b.data.published.getTime() || a.id.localeCompare(b.id);
		});
}
