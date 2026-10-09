import type { AstroIntegration } from 'astro';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** House style: no em dashes anywhere in the site copy. Fails the build if one slips in. */
export default function copyGuard(): AstroIntegration {
  return {
    name: 'copy-guard',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const entries = await readdir(outDir, { withFileTypes: true, recursive: true });
        const hits: string[] = [];
        for (const e of entries) {
          if (!e.isFile() || !e.name.endsWith('.html')) continue;
          const file = path.join(e.parentPath, e.name);
          const html = await readFile(file, 'utf8');
          if (/—|&mdash;|&#8212;|&#x2014;/i.test(html)) hits.push(path.relative(outDir, file));
        }
        if (hits.length) {
          throw new Error(`Em dash found in: ${hits.join(', ')}. Use a comma, colon or full stop instead.`);
        }
      },
    },
  };
}
