import type { ImageMetadata } from 'astro';

// Images live in public/ (see CLAUDE.md) but are imported here at build time so
// Astro's <Image> can resize them and output AVIF/WebP with intrinsic width/height.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/public/**/*.{png,jpg,jpeg,webp}',
  { eager: true },
);

/** Resolve a public URL path such as "/case-studies/life/hero.png" to image metadata. */
export function resolveImage(path: string): ImageMetadata {
  const file = files[`/public${path}`];
  if (!file) {
    throw new Error(`Image not found: public${path}. Check the file name in the frontmatter.`);
  }
  return file.default;
}
