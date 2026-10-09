# CLAUDE.md

Project conventions for Claude Code sessions on Apurva Singh's UX portfolio.
Live site: https://apurva-singh-ux.vercel.app (Vercel project `apurva-singh-ux`).
Repo: https://github.com/ApurvaData2002/apurva-ux-portfolio (public).

## Golden rules

1. **Content changes touch content files only.** Never change shared components, layouts,
   styles or tokens when only content needs to change (text, images, order, drafts).
   Content lives in `src/content/case-studies/*.mdx`, `src/data/*.ts` and `public/`.
2. **Every change goes through a branch and a pull request.** `main` is protected
   (PR required, Vercel check must pass, applies to admins). Workflow below.
3. **Accessibility is non-negotiable** (WCAG 2.2 AA). See the checklist below and run
   the audits before opening a PR that changes markup or styles.
4. **Match the Figma design.** Don't invent new visual styles. Use the tokens.
5. **No em dashes** in site copy. The build fails if one appears in a built page
   (`src/integrations/copy-guard.ts`). En dashes in date ranges are fine.

## Stack and commands

Astro 7 (static output) + MDX content collections, plain CSS with custom properties,
no CSS framework. Node 22.12+.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321 (start it in the background: `npx astro dev --background`; manage with `astro dev stop/status/logs`) |
| `npm run build` | Production build to `dist/` (runs the draft and em dash guards) |
| `npm run preview` | Serve `dist/` locally |
| `npm run check` | Type check (`astro check`), must report 0 errors |
| `npm run audit:a11y` | axe WCAG 2.2 AA + keyboard, focus, menu, target size, 200% text, 320px reflow, reduced motion, on every page at 1440/768/393. Needs `npm run preview` running. `BASE_URL=` and `PAGES=/a,/b` to target others |
| `npm run audit:lighthouse` | Lighthouse perf/a11y/best-practices/SEO, mobile + desktop. Targets: perf 90+, a11y 95+ (currently 100 everywhere) |

On Windows Git Bash, prefix paths in env vars with `MSYS_NO_PATHCONV=1` (e.g. `PAGES=/404`).

## Folder structure

```
src/
  content/case-studies/   one .mdx per case study (frontmatter only); _template.mdx is ignored
  content.config.ts       zod schema for case studies
  data/site.ts            name, role, email, LinkedIn, nav items, avatar (+ optional video)
  data/about.ts           About page text, poster, resume columns
  pages/                  index (grid), about, 404, case-studies/[slug]
  layouts/BaseLayout.astro  shell: skip link, NavSidebar / SiteHeader+MenuDrawer, main, footer
  components/             one per Figma component (names match Figma)
  lib/                    case-studies.ts (published-only helpers), images.ts, image-sizes.ts
  styles/tokens.css       all design tokens (from Figma variables + text styles)
  styles/global.css       reset, text-style classes (.t-h1, .t-body...), focus ring, .sr-only
  integrations/           draft-guard.ts, copy-guard.ts (build-time checks)
public/
  case-studies/<slug>/    case-study images
  about/poster.png        About poster
  avatar.jpg              480x480 avatar (optional avatar-wave.mp4/.webm next to it)
scripts/                  a11y-audit.mjs, lighthouse.mjs
CHANGELOG.md              one entry per release
```

## Case studies

One file per case study: `src/content/case-studies/<slug>.mdx`. To add one, copy
`_template.mdx` (it documents every field). The homepage grid, case-study routes and
"Next project" links are all generated from the collection; never hard-code them.

Schema (`src/content.config.ts`):

| Field | Notes |
|---|---|
| `title` | H1 on the page |
| `cardTitle?` | Shorter title for the tile and Next project link |
| `slug` | lowercase-hyphens; equals the file name and the image folder |
| `summary` | Lead paragraph under the H1 |
| `meta` | Tile meta, e.g. "Mobile app · 2026" |
| `order` | Homepage position, 1 first |
| `draft` | `true` hides it everywhere (see Drafts) |
| `hero`, `heroAlt` | 16:9 hero + alt |
| `thumbnail` | Tile image (usually the hero) |
| `roles[]` | `{ label, text }`, the meta row under the hero |
| `sections[]` | `{ eyebrow, heading, paragraphs[], layout: stacked \| split, image?, imageMobile?, alt? }` |
| `galleryHeading?`, `gallery[]` | `{ src, alt }` square images |
| `next?` | Slug of the next case study (drafts skipped automatically) |

- The number of sections varies (Life 7, Spunk 6). Always render from the array.
- `eyebrow` is the label only ("Problem"); the "01 · " number is added from the position.
  The gallery eyebrow is the next number + " · Process".
- A section with `image` must have `alt` (schema enforces it). Every image path must be
  inside that case study's own `public/case-studies/<slug>/` folder (build enforces it).
- Always read the collection through `getPublishedCaseStudies()` in `src/lib/case-studies.ts`,
  never `getCollection` directly, so drafts can't leak.

## Images

- Location: `public/case-studies/<slug>/`. Names: `hero.png`, `section-NN.png` (NN = section
  number), `section-NN-wide.png` (16:9 mobile version of a split section),
  `gallery-01.png` … `gallery-06.png`.
- Source: Figma file `personal-portfolio` (key `xspfhLJkxnzcJ65ZUJTrtk`), page **pictures**,
  frames named "LIFE · …" / "SPUNK · …" in the "… mockups (auto)" sections. Export at **2x**
  (hero/stacked 2016x1136, split 1072x800, gallery 640x640).
- Frontmatter uses public URL paths ("/case-studies/life/hero.png"). `src/lib/images.ts`
  glob-imports `public/` so Astro's `<Image>` / `getImage` can output AVIF/WebP. Always go
  through `resolveImage()` and `CaseImage.astro`; never use raw `<img src="/...">` for content.
- Image boxes have fixed aspect ratios from the Figma frames and `overflow: hidden`, so
  there is no layout shift. Below-the-fold images are lazy; the hero and first tiles are eager.
- Alt text describes what the screens show. Decorative images use `alt=""`. Images with
  words in them (the About poster) repeat those words in the alt text.

## Drafts

`draft: true` means the case study must not appear anywhere on the built site:
no page, no tile, no Next project link, no images. `getPublishedCaseStudies()` filters it,
and `src/integrations/draft-guard.ts` deletes its image folder and any byte-identical copies
Vite emitted in `_astro/`, then fails the build if any HTML links to it.

## Design tokens and Figma

- Figma file `personal-portfolio`, page **with claude**: frames named by route and breakpoint
  (`/case-studies/life | desktop-1440`, `/ | mobile-393 | menu-open`). Components, variables
  and text styles are on **📚 Library**. The "02 Case study template" section is Figma-only.
- `src/styles/tokens.css` mirrors the Figma variables (`surface/page` → `--surface-page`).
  Use tokens; don't hard-code colours, spacing or type sizes. Spacing is on an 8px grid.
- Breakpoints: mobile < 768px (default), tablet ≥ 48em, desktop ≥ 64em (sidebar appears).
- Components match Figma names: NavSidebar, SiteHeader, MenuDrawer, ProjectTile, CaseHero,
  MetaRow, CaseSection, Gallery, NextProject, BackToTop, Button, CursorView, AvatarWave,
  Error404, Divider, Icon (renders Icon/* as inline SVG with currentColor).

## Accessibility requirements (WCAG 2.2 AA)

- Visible focus on everything interactive: `outline: 2px solid var(--focus-ring)`,
  `outline-offset: 2px` (global `:focus-visible`). Never remove outlines without this.
- `<html lang="en">`; landmarks header, nav, main, footer; "Skip to content" link first,
  targeting `<main id="main">`.
- One H1 per page. Home: visually hidden "Projects" (`.sr-only`). About: "Hello there, I'm
  Apurva Singh." then H2s. Case study: title H1, sections H2. 404: "Page not found".
- Active nav item has `aria-current="page"`.
- Menu toggle: `<button>` with `aria-expanded`, `aria-controls`, label "Open menu"/"Close menu";
  Esc closes and returns focus to the toggle; the page behind is `inert` while open.
- Project tile: one `<a>`, accessible name = the title (meta and View pill are aria-hidden,
  meta is the `aria-describedby` description). CursorView is pointer-only and aria-hidden.
- Icon links and the menu toggle have 44x44 hit areas via padding; icons stay their Figma size.
  Link names: "Email Apurva", "Apurva on LinkedIn (opens in new tab)".
- 404 "4 [avatar] 4" wrapper: `role="img" aria-label="404"`, children aria-hidden. Morse
  bubbles are aria-hidden and decorative (not focusable).
- Avatar: `alt=""`. Video (if added) never plays with reduced motion and has a pause control.
- Reflow at 320px with no horizontal scroll; text resizes to 200% without breaking.
- Don't name `<section>`s with aria-labelledby (avoids landmark clutter); headings do the job.
- Definition of done for a PR that changes UI: `npm run check`, `npm run audit:a11y` and
  `npm run audit:lighthouse` pass; keyboard-only pass; NVDA/VoiceOver pass for Home and one
  case study before merging.

## Workflow: edit on a branch, open a PR, check the preview, merge

1. `git switch main && git pull`, then `git switch -c <type>/<short-name>`
   (types: `feat`, `fix`, `content`, `docs`, `chore`).
2. Make the change. Run `npm run check` and `npm run build`; for UI changes also the audits.
3. Commit with a conventional message (`feat: …`, `fix: …`, `content: …`, `docs: …`).
4. Push and open a PR to `main` (`gh pr create`). Vercel posts a preview link on the PR
   (behind Vercel login by default).
5. The owner checks the preview, then merges (squash). `main` deploys to production.
6. For a release: add a short entry to `CHANGELOG.md` in the PR, and after merging tag it
   (`git tag -a vX.Y.Z <merge-commit> -m "..."`, `git push origin vX.Y.Z`).
   Patch = fixes/content tweaks, minor = new case study or feature.

Rollback: Vercel dashboard → Deployments → previous deployment → "Promote to Production",
or revert the PR on GitHub.

## Domain

Keep everything domain-agnostic. The site URL comes from `SITE_URL` (set it in Vercel if a
custom domain is added) or Vercel's `VERCEL_PROJECT_PRODUCTION_URL`; see `astro.config.mjs`.
`vercel.json` sets `trailingSlash: false`, and canonical URLs have no trailing slash.

## Don'ts

- Don't commit secrets, tokens or `.env` files.
- Don't push to `main` or force-push.
- Don't add Tailwind or another CSS framework.
- Don't change Figma-derived token values to fix a one-off; fix the component or ask.
- Don't hide focus outlines, add `tabindex` > 0, or use `aria-label` that drops visible text.
