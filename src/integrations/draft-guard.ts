import type { AstroIntegration } from 'astro';
import { readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Makes sure a case study with `draft: true` appears nowhere on the built site.
 * Pages already skip drafts; this also
 *  1. deletes the draft's image folder that Astro copies from public/, and
 *  2. fails the build if any built HTML still links to the draft.
 */
export default function draftGuard(): AstroIntegration {
  let root: URL;
  return {
    name: 'draft-guard',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const contentDir = fileURLToPath(new URL('src/content/case-studies/', root));
        const outDir = fileURLToPath(dir);
        const drafts = await findDrafts(contentDir);
        if (drafts.length === 0) return;

        for (const slug of drafts) {
          await rm(path.join(outDir, 'case-studies', slug), { recursive: true, force: true });
        }

        const leaks: string[] = [];
        for (const file of await listFiles(outDir)) {
          if (!/\.(html|xml|txt|json)$/.test(file)) continue;
          const text = await readFile(file, 'utf8');
          for (const slug of drafts) {
            if (text.includes(`/case-studies/${slug}`)) leaks.push(`${path.relative(outDir, file)} -> ${slug}`);
          }
        }
        if (leaks.length) {
          throw new Error(`Draft case studies are linked from the built site:\n  ${leaks.join('\n  ')}`);
        }
        logger.info(`Drafts kept out of the build: ${drafts.join(', ')}`);
      },
    },
  };
}

async function findDrafts(contentDir: string): Promise<string[]> {
  const drafts: string[] = [];
  for (const name of await readdir(contentDir).catch(() => [] as string[])) {
    if (!name.endsWith('.mdx') || name.startsWith('_')) continue;
    const source = await readFile(path.join(contentDir, name), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (!/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const slug = frontmatter.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
    drafts.push(slug ?? name.replace(/\.mdx$/, ''));
  }
  return drafts;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
}
