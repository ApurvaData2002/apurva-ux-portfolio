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
| `sections[].link?` | `{ href, label }`, an optional link out of a section. Always opens in a new tab, with "(opens in new tab)" added to its accessible name |
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
  frames named "LIFE · …" / "SPUNK · …" in the "… mockups (auto)" sections. Export hero,
  stacked and gallery at **2x** (2016x1136 and 640x640) and the **4:3 split frames at 3x**
  (1608x1200). Split images are 3x because from 90em a split section's image is about
  616 CSS px wide at 1440 and more on wider screens, so 2x would be short.
- Frontmatter uses public URL paths ("/case-studies/life/hero.png"). `src/lib/images.ts`
  glob-imports `public/` so Astro's `<Image>` / `getImage` can output AVIF/WebP. Always go
  through `resolveImage()` and `CaseImage.astro`; never use raw `<img src="/...">` for content.
- Image boxes have fixed aspect ratios from the Figma frames and `overflow: hidden`, so
  there is no layout shift. Below-the-fold images are lazy; the hero and first tiles are eager.
- `sizes` is a viewport formula with no fixed cap (`src/lib/image-sizes.ts`, ProjectTile, the
  About poster), because the content column grows past 1440. If the container padding, the
  sidebar width or a grid gap changes, update those formulas too or wide screens get a file
  that is too small and the image looks soft. The 2x exports are the ceiling.
- Alt text describes what the screens show. Decorative images use `alt=""`. Images with
  words in them (the About poster) repeat those words in the alt text.
- Two case studies are the exception, both built by `scripts/compose-mockups.mjs`
  instead of Figma. It reproduces the Figma treatment (dark bezel or browser chrome on
  a brand-colour gradient, the same ratios) and takes a screenshot folder and a slug:
  - `laterloft`: raw 1080x2392 phone screenshots, which fit none of the ratios above.
    `node scripts/compose-mockups.mjs "<screenshot folder>" laterloft`
  - `laterloft-site`: screenshots of the live laterloft.com, captured by
    `node scripts/capture-site.mjs <folder>` (desktop viewport, each desktop section,
    and six mobile views; it dismisses the mobile demo overlay first, or every shot is
    just the demo). Then `node scripts/compose-mockups.mjs <folder> laterloft-site`.
    Re-run both after a site redesign rather than editing the composed images.
  The scenes near the bottom of compose-mockups.mjs name each screenshot, so edit them
  to add or swap one. `REDACT` there blurs regions out of a screenshot before use (the
  Android share sheet's contact row).

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
- On desktop the content column (`.page` in BaseLayout) fills the space beside the 240px
  sidebar with no max-width. At 1440 that reproduces the 1200px main-content of the Figma
  frames; wider screens grow the images rather than leaving empty space on the right.
  Prose keeps its own caps (stacked case sections 640px, case summary 640px, 404 480px).
- Components match Figma names: NavSidebar, SiteHeader, MenuDrawer, ProjectTile, CaseHero,
  MetaRow, CaseSection, Gallery, NextProject, BackToTop, Button, CursorView, AvatarWave,
  Error404, Divider, Icon (renders Icon/* as inline SVG with currentColor).
- ContactFooter has no Figma counterpart either: a divider, a "Get in touch" label and the
  email and LinkedIn links, shown only below 64em (`contact={false}` turns it off, as the 404
  does). Its email is a plain `mailto:` showing the address, not the sidebar's copy button,
  because tapping an address on a phone is expected to open the mail app.
- SkillPill has no Figma counterpart. It renders one `<li>` pill (fully rounded,
  `--surface-subtle` background, `.t-small` in `--text-muted`) and is not interactive:
  no link, no button, no hover or focus styling. Its 14px inline padding is the one
  deliberate exception to the 8px scale; the vertical padding stays on it.
- ProjectTile's title is a deliberate departure from Figma. The frames give it the
  Label/Tile Caption style (13px regular) against a 12px regular meta: one pixel apart
  and the same weight, so under a 540px image neither read as the heading. It is now
  `--font-heading` at `--size-16` / `--font-weight-medium` / `--leading-24`, which keeps
  the caption bar at the 40px height the Figma tiles have. The caption wraps
  (`flex-wrap`) and the title has `flex: 1 1 10rem`, so below about 360px the meta drops
  to its own line instead of squeezing the title into a four-line column.

## Home page

`src/pages/index.astro` is an intro block then the project grid, in one flex column with
`--page-stack-gap` between them (32px desktop and tablet, 24px mobile):

1. `.home-intro__skills`: a `<ul role="list">` of SkillPill items, flex row, `--space-8` gap,
   wrapping. The labels are the `skills` array at the top of the page.
2. `.home-intro__text`: the H1 and the intro paragraph, `--space-8` apart, using the same
   `.t-h1` and `.t-lead` as CaseHero so the type matches the case-study pages.

`--space-16` separates the two. Neither gets padding of its own: `.page--index` in
BaseLayout already applies the side padding, so the intro lines up with the grid at every
breakpoint. Don't hardcode the desktop 40px here, or it misaligns on tablet and mobile.

## Motion

Motion has no Figma counterpart beyond the tile hover, so everything here is a
deliberate addition. It is restrained on purpose: a visitor decides in well under
a minute, so motion is there to orient them, never to make them wait.

Tokens (`tokens.css`): `--duration-fast` 150ms, `--duration-base` 200ms,
`--duration-tile` 250ms, `--duration-slow` 300ms. `--ease-out` for anything
arriving, `--ease-in` for anything leaving. Nothing animates for longer than
300ms, and entrances are slower than the matching exit (the drawer opens in
200ms and closes in 150ms).

**Animate `transform` and `opacity` only.** Animating layout properties would
cost the CLS 0 and the perfect Lighthouse scores.

**The `data-motion` contract.** An inline script in `BaseLayout` head sets
`data-motion` on `<html>` before the first paint, and only when scripting runs
and the visitor has not asked for reduced motion. Every rule that starts an
element hidden is gated on `html[data-motion]`. This is what keeps the site
safe: the global `prefers-reduced-motion` block in `global.css` kills transitions
with `!important`, so anything written as "start at `opacity: 0`, transition in"
would be **permanently invisible** for those visitors. Gating on the attribute
means the hidden state is never applied to them at all. Toggling reduce-motion
mid-visit removes the attribute and reveals anything still waiting.

Never add a reveal that is hidden by CSS alone. `data-reveal` is set by script
(the case-study page) and the matching CSS lives in `global.css`; with no
JavaScript, with reduced motion, or without IntersectionObserver nothing is
hidden in the first place. Check any new reveal in all three modes.

What moves:

| Where | What | Timing |
|---|---|---|
| ProjectTile | image scales 1.05, View pill follows the cursor (Figma) | 250ms |
| MenuDrawer | fades and slides 8px, `@starting-style` + `allow-discrete` so it can animate out of `display: none` | 200ms in, 150ms out |
| NextProject | arrow moves 4px, title underlines, on hover and focus | 150ms |
| NavLinks | colour to `--text-accent` plus an underline on hover | 150ms |
| Home | skill pills, then heading, then tiles, 40ms apart, fade and rise 8px | 300ms each, all done by 500ms |
| Case sections | fade and rise 12px as they enter view, one shot | 300ms |
| ScrollProgress | 2px bar, scaled straight from scroll position, no transition | per frame |

`ScrollProgress` is case-study only, `aria-hidden` (the scrollbar says the same
thing), and stays on with reduced motion because it follows the visitor's own
scrolling rather than animating by itself. It renders `hidden` until its script
takes over, so no-JS never shows a bar stuck at zero.

Hover effects go inside `@media (hover: hover) and (pointer: fine)`, matching
ProjectTile, so a touch device never gets a stuck hover state.

## Accessibility requirements (WCAG 2.2 AA)

- Visible focus on everything interactive: `outline: 2px solid var(--focus-ring)`,
  `outline-offset: 2px` (global `:focus-visible`). Never remove outlines without this.
- `<html lang="en">`; landmarks header, nav, main, footer; "Skip to content" link first,
  targeting `<main id="main">`. The footer only renders when it has content: the contact
  row, BackToTop (on Home only with more than 3 projects; never on the 404) or a footer slot.
- Below 64em the sidebar is gone and its email and LinkedIn links are shut inside the menu
  drawer, so ContactFooter repeats them at the end of the page. It is hidden from 64em up,
  where the sidebar carries them. Keep a visible contact route at every breakpoint.
- One H1 per page. Home: "I design mobile apps that are easy to use." (visible, in the intro
  block; it replaced an `.sr-only` "Projects" heading). About: "Hello there, I'm Apurva
  Singh." then H2s. Case study: title H1, sections H2. 404: "Page not found".
- Active nav item has `aria-current="page"`.
- Menu toggle: `<button>` with `aria-expanded`, `aria-controls`, label "Open menu"/"Close menu";
  Esc closes and returns focus to the toggle; the page behind is `inert` while open.
- Project tile: one `<a>`, accessible name = the title (meta and View pill are aria-hidden,
  meta is the `aria-describedby` description). CursorView is pointer-only and aria-hidden.
- Icon links and the menu toggle have 44x44 hit areas via padding; icons stay their Figma size.
  The email icon is a `<button>` ("Copy email address, <email>") that copies `site.email`
  and flashes "Copied!" in a `role="status"` live region (falls back to `mailto:` if copying
  fails). LinkedIn link name: "Apurva on LinkedIn (opens in new tab)". The email in the About
  text stays a real `mailto:` link.
- 404 "4 [avatar] 4" wrapper: `role="img" aria-label="404"`, children aria-hidden. Morse
  bubbles are aria-hidden and decorative (not focusable).
- Avatar: `alt=""`. Video (if added) never plays with reduced motion and has a pause control.
- Reflow at 320px with no horizontal scroll; text resizes to 200% without breaking.
- Don't name `<section>`s with aria-labelledby (avoids landmark clutter); headings do the job.

## Case-study section layout

A section with an image keeps the Figma layout: text on the left (440fr), image on
the right (536fr) for split, or capped text with a full-width image under it for
stacked.

A section with **no** image used to be the same capped block of text with the rest of
the content column empty beside it, which got worse as the copy got shorter. From
64em up it is now one row on the same 440/536 grid: eyebrow and heading on the left,
body on the right, so the eyebrow, heading and right-hand edge line up with the
sections that do have images and one grid runs down the page. Below 64em it stacks as
before.

- The grid has a third `1fr` row that nothing is placed in. The body spans all three.
  Without it, a body longer than the heading stretches the two rows it spans and the
  heading drifts into the middle of the section (visible on Spunk and Life, which run
  three paragraphs per section).
- Consecutive image-less sections get a hairline between them (`+` sibling), so a run
  of them reads as one list. Only between two of them, so it never doubles the divider
  under the meta row or hangs under an image.
- These rules must stay after the `max-width` rules above them in the file: same
  specificity, so source order decides.

From 90em up, a split section with an image changes again: the text column narrows to
360fr and the image takes 616fr, so the screens get more room. The image stays inside
the page padding, lining up with the hero and the stacked sections; an earlier version
bled it into the padding to the edge of the viewport and that was rejected as not
looking good. The aspect ratio is unchanged, so the box still has a known height and
CLS stays 0. Held back to 90em because at 1024 the text column would be about 200px.
**`split.sizes` in `src/lib/image-sizes.ts` carries the matching formula**
(`(100vw - 464px) * 0.631`): change one without the other and the browser picks the
wrong file.
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
