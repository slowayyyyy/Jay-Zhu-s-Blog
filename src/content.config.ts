import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const checkinDaySchema = z.preprocess((value) => {
	if (value == null || value === '') return undefined;
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	const day = String(value).trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
	return day ?? value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: z.preprocess(
			(value) => (value === '' || value == null ? undefined : value),
			z.coerce.date().optional(),
		),
		sortOrder: z.coerce.number().int().default(0),
		section: z.enum(['study', 'research', 'life']),
		tags: z.array(z.string()).default([]),
		references: z
			.array(
				z.object({
					key: z.string(),
					authors: z.string(),
					title: z.string(),
					venue: z.string().optional(),
					year: z.coerce.number().int().optional(),
					doi: z.string().optional(),
					url: z.url().optional(),
				}),
			)
			.default([]),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

const checkins = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/checkins' }),
	schema: z.object({
		date: z.coerce.date(),
		day: checkinDaySchema,
		title: z.string(),
		summary: z.string().default(''),
		entryType: z.enum(['quick', 'standard']).optional(),
		habit: z.string().default(''),
		category: z.enum(['english', 'exercise', 'other']).default('other'),
		duration: z.coerce.number().int().min(0).default(0),
		activity: z.string().default(''),
		sortOrder: z.coerce.number().int().default(0),
		items: z
			.array(
				z.object({
					label: z.string(),
					value: z.string(),
					href: z.string().optional(),
				}),
			)
			.default([]),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

const tags = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/tags' }),
	schema: z.object({
		name: z.string(),
		description: z.string().optional(),
	}),
});

export const collections = { posts, checkins, tags };
