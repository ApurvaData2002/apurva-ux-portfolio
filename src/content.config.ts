import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Image paths are public URLs, e.g. "/case-studies/life/section-02.png".
// The file must exist in public/case-studies/<slug>/ (checked at build time).
const imagePath = z
  .string()
  .regex(
    /^\/case-studies\/[a-z0-9-]+\/[a-z0-9-]+\.(png|jpe?g|webp)$/,
    'Use a path like "/case-studies/<slug>/section-02.png" (lowercase, no spaces).',
  );

const section = z
  .object({
    /** Small label above the heading, e.g. "Problem". The number is added automatically. */
    eyebrow: z.string(),
    heading: z.string(),
    paragraphs: z.array(z.string()).min(1),
    layout: z.enum(['stacked', 'split']),
    /** Split: the 4:3 image. Stacked: the 16:9 image. */
    image: imagePath.optional(),
    /** Split only: the 16:9 "wide" version used on mobile. */
    imageMobile: imagePath.optional(),
    alt: z.string().optional(),
  })
  .refine((s) => !s.image || (s.alt && s.alt.trim().length > 0), {
    message: 'A section with an image needs alt text describing what the screens show.',
    path: ['alt'],
  })
  .refine((s) => !s.imageMobile || s.image, {
    message: 'imageMobile needs an image too.',
    path: ['imageMobile'],
  });

const caseStudies = defineCollection({
  // Files starting with "_" (like _template.mdx) are ignored.
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only.'),
    /** Intro paragraph under the title. */
    summary: z.string(),
    /** Tile meta on the homepage, e.g. "Mobile app · 2026". */
    meta: z.string(),
    /** Homepage position: 1 comes first. */
    order: z.number().int(),
    /** true = hidden everywhere on the built site. */
    draft: z.boolean().default(false),
    hero: imagePath,
    heroAlt: z.string().min(1),
    thumbnail: imagePath,
    /** The meta row under the hero, e.g. My role / Team & context / Tools. */
    roles: z.array(z.object({ label: z.string(), text: z.string() })).min(1),
    sections: z.array(section).min(1),
    galleryHeading: z.string().optional(),
    gallery: z.array(z.object({ src: imagePath, alt: z.string() })).default([]),
    /** Slug of the case study linked at the bottom. Drafts are skipped automatically. */
    next: z.string().optional(),
  }),
});

export const collections = { 'case-studies': caseStudies };
