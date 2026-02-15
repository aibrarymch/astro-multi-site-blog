import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).nonempty(),
    publishedAt: z.date(),
    updatedAt: z.date(),
    excerpt: z.string().max(160),
    thumbnail: z.string().optional(),
    draft: z.boolean().default(false),
    ageRestricted: z.boolean().default(false),
    hideIntroToc: z.boolean().default(false)
  })
});

const scraps = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).nonempty(),
    publishedAt: z.date(),
    updatedAt: z.date(),
    excerpt: z.string().max(160),
    thumbnail: z.string().optional(),
    draft: z.boolean().default(false),
    ageRestricted: z.boolean().default(false),
    closed: z.boolean().default(false)
  })
});

const _samples = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).nonempty(),
    publishedAt: z.date(),
    updatedAt: z.date(),
    excerpt: z.string().max(160),
    thumbnail: z.string().optional(),
    draft: z.boolean().default(false),
    ageRestricted: z.boolean().default(false),
    closed: z.boolean().default(false),
    hideIntroToc: z.boolean().default(false)
  })
});

export const collections = { blog, scraps, '_samples': _samples };
