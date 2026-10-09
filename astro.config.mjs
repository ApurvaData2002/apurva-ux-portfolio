// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import draftGuard from './src/integrations/draft-guard.ts';

// Domain-agnostic: the site URL comes from the environment, never from code.
// SITE_URL wins (set it in Vercel when a custom domain is added); otherwise
// Vercel's production domain is used; locally there is none.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx(), draftGuard()],
});
