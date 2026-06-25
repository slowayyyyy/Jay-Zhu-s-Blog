import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { sectionMeta, type Locale, type SectionKey } from '../data/site';

export type PostEntry = CollectionEntry<'posts'>;
export type TagEntry = CollectionEntry<'tags'>;

const normalizeTagId = (tag: string) => tag.replace(/\.json$/, '').toLocaleLowerCase('en-US');

const collectionFileExists = (entry: { filePath?: string }) =>
	!entry.filePath || existsSync(resolve(process.cwd(), entry.filePath));

const compareManualOrder = (
	a: { data: { sortOrder?: number } },
	b: { data: { sortOrder?: number } },
) => (b.data.sortOrder ?? 0) - (a.data.sortOrder ?? 0);

const compareIdsDescending = (a: { id: string }, b: { id: string }) =>
	b.id.localeCompare(a.id, 'zh-CN');

export async function getAllPosts() {
	const posts = await getCollection('posts', ({ data }) => !data.draft);
	const knownTags = new Set((await getAllTags()).map((tag) => normalizeTagId(tag.id)));
	return posts
		.filter(collectionFileExists)
		.map((post) => ({
			...post,
			data: { ...post.data, tags: post.data.tags.filter((tag) => knownTags.has(normalizeTagId(tag))) },
		}))
		.sort(
			(a, b) =>
				compareManualOrder(a, b) ||
				b.data.publishDate.getTime() - a.data.publishDate.getTime() ||
				compareIdsDescending(a, b),
		);
}

export async function getAllCheckins() {
	const checkins = await getCollection('checkins', ({ data }) => !data.draft);
	const knownTags = new Set((await getAllTags()).map((tag) => normalizeTagId(tag.id)));
	return checkins
		.filter(collectionFileExists)
		.map((checkin) => ({
			...checkin,
			data: { ...checkin.data, tags: checkin.data.tags.filter((tag) => knownTags.has(normalizeTagId(tag))) },
		}))
		.sort(
			(a, b) =>
				compareManualOrder(a, b) ||
				b.data.date.valueOf() - a.data.date.valueOf() ||
				compareIdsDescending(a, b),
		);
}

export async function getAllTags() {
	const tags = await getCollection('tags');
	return tags
		.filter(collectionFileExists)
		.sort((a, b) => a.data.name.localeCompare(b.data.name, 'zh-CN'));
}

export async function getTagMap() {
	const tags = await getAllTags();
	return new Map(tags.map((tag) => [normalizeTagId(tag.id), tag.data.name]));
}

export function getTagLabel(tag: string, tagMap: ReadonlyMap<string, string>) {
	return tagMap.get(normalizeTagId(tag)) ?? tag;
}

export async function getLifePosts() {
	const posts = await getAllPosts();
	return posts.filter((post) => post.data.section === 'life');
}

export async function getFeaturedPosts() {
	const posts = await getAllPosts();
	return posts.filter((post) => post.data.featured).slice(0, 3);
}

export function formatDate(date: Date, locale: Locale = 'zh') {
	return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

export function getSectionInfo(section: SectionKey) {
	return sectionMeta[section];
}

export function estimateReadingMinutes(post: PostEntry) {
	const plain = stripMarkdown(post.body ?? '');
	const count = plain.replace(/\s+/g, '').length;
	return Math.max(1, Math.round(count / 360));
}

export function getPostSlug(post: PostEntry) {
	return post.id.replace(/\\/g, '/').replace(/\.md$/, '');
}

export function stripMarkdown(markdown: string) {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
		.replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
		.replace(/^>\s?/gm, ' ')
		.replace(/[*_#>-]/g, ' ')
		.replace(/\n+/g, ' ')
		.trim();
}

export async function getTagSummary(posts: PostEntry[]) {
	const tagMap = await getTagMap();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, label: getTagLabel(tag, tagMap), count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));
}

export function getYearSummary(posts: PostEntry[]) {
	const counts = new Map<number, number>();
	for (const post of posts) {
		const year = post.data.publishDate.getFullYear();
		counts.set(year, (counts.get(year) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([year, count]) => ({ year, count }))
		.sort((a, b) => b.year - a.year);
}

export function getSectionSummary(posts: PostEntry[]) {
	const counts = new Map<SectionKey, number>();
	for (const post of posts) {
		counts.set(post.data.section, (counts.get(post.data.section) ?? 0) + 1);
	}

	return Object.entries(sectionMeta).map(([section, meta]) => ({
		section: section as SectionKey,
		count: counts.get(section as SectionKey) ?? 0,
		...meta,
	}));
}
