# Changelog

A short note for each release of the live site. Newest first.
Versions are git tags (`v1.0.0`), so any release can be found and rolled back.

## v1.0.2 (2026-10-10)

- Home: Back to top only appears when there are more than 3 projects.
- About: each Experience line (company, role, dates in brackets) stays on one line on desktop;
  Education entries get the same gap as Experience. Between 1024 and 1199px the resume
  uses the 2x2 layout so lines never wrap.

## v1.0.1 (2026-10-10)

- Each page has one address: `/about/` now redirects to `/about`, and the canonical tag matches.
- The 404 page is kept out of search results.

## v1.0.0 (2026-10-10)

First live version at https://apurva-singh-ux.vercel.app

- Homepage project grid generated from the case studies.
- Case studies: Spunk (dating app) and Life (school canteen, uniform and supplies).
- About page and a 404 page with a Morse easter egg.
- WCAG 2.2 AA accessibility pass; Lighthouse 100 on every page.
