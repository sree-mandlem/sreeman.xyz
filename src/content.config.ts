import { defineCollection} from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
    loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    subtitle: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()).optional(),
    github: z.string().optional(),
    demo: z.string().optional(),
    date: z.date(),
  }),
});

const experiments = defineCollection({
  loader: glob({ base: './src/content/experiments', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
  }),
});

export const collections = {
  blog,
  projects,
  experiments,
};
