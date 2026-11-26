# Changelog

A short note for each release of the live site. Newest first.
Versions are git tags (`v1.0.0`), so any release can be found and rolled back.

## v1.5.0 (2026-11-26)

- The menu on tablet and phone now slides and fades open instead of snapping, and closes a little quicker than it opens.
- The "Next project" link at the end of a case study responds when you point at it or tab to it: the arrow moves and the title underlines. The sidebar nav links got the same treatment.
- The Projects page arrives in order: the skill pills, then the heading, then the cards, about half a second in total.
- Case-study sections fade up as you reach them, and a thin bar across the top of the page shows how far through you are.
- All of it is off for anyone whose system is set to reduce motion, and the pages read exactly as before with JavaScript turned off.

## v1.4.3 (2026-11-26)

- The project card titles on the Projects page now read as titles: larger and in the heading weight, instead of sitting at almost the same size and weight as the "Mobile app · 2026" line beside them. On very narrow phones that line now drops below the title rather than squashing it.

## v1.4.2 (2026-11-15)

- The email and LinkedIn icons in the desktop sidebar are half again as large, with the same spacing between them. Their size elsewhere is unchanged.

## v1.4.1 (2026-11-15)

- New contact address: apurva.singh.ux@gmail.com, used by the sidebar copy button, the contact row and the About page.

## v1.4.0 (2026-11-15)

- On tablet and phone, where the sidebar is replaced by the menu button, every page now ends with a "Get in touch" row: the email address and a LinkedIn link. Before this, a visitor had to open the menu to find any way to make contact.

## v1.3.1 (2026-11-15)

- On screens wider than 1440 the content now fills the width instead of leaving empty space on the right, so the project cards and case-study images get bigger. Images are served at the larger sizes, so they stay sharp.

## v1.3.0 (2026-11-15)

- The Projects page opens with a row of skill pills, a heading and a short intro, above the project cards.

## v1.2.0 (2026-10-16)

- The email icon (sidebar and mobile menu) now copies the email address and shows "Copied!".
  Screen readers hear it too. If copying isn't possible, it opens the mail app instead.

## v1.1.0 (2026-10-16)

- New case studies: Event Management (admin dashboard) and Website redesign (NYAF school registration for BriBooks).
- Life: refreshed mockups from Figma, updated section 04 text, and a new gallery: item sheets, cart and order.
- Projects page: four tiles (Spunk, Life, Event Management, Website redesign); Back to top now shows.
- Next project links run Spunk → Life → Event Management → Website redesign → Spunk.

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
