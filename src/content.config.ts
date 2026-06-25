import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		excerpt: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		sortOrder: z.coerce.number().int().default(0),
		section: z.enum(['study', 'research', 'life']),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

const checkins = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/checkins' }),
	schema: z.object({
		date: z.coerce.date(),
		title: z.string(),
		summary: z.string().default(''),
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
