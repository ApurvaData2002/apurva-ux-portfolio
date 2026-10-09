# Apurva Singh · UX portfolio

The code behind **https://apurva-singh-ux.vercel.app**, built from the Figma file
"personal-portfolio" with [Astro](https://astro.build) and hosted on Vercel.

This guide is for Apurva: how to update the site without touching the design code.

---

## Where things live

| You want to change… | Edit this |
|---|---|
| A case study's text, images, order or visibility | `src/content/case-studies/<name>.mdx` |
| Case-study images | `public/case-studies/<name>/` |
| About page text, resume, poster | `src/data/about.ts` and `public/about/poster.png` |
| Your name, role, email, LinkedIn | `src/data/site.ts` |
| Your avatar photo | `public/avatar.jpg` (square, 480x480) |

Everything else (components, layouts, styles) is the design. You shouldn't need to touch it to update content.

---

## The one rule: change → pull request → check → merge

The live site updates whenever `main` changes, and `main` only accepts changes through a **pull request (PR)**. Every change goes like this:

1. Make your change on a new **branch** (a safe copy).
2. Open a **pull request**. Within about a minute Vercel adds a comment with a **preview link**: your change on a private copy of the site.
3. Open the preview (sign in to Vercel if asked) and check it.
4. Happy? Click **Squash and merge** on the PR. The live site updates within about a minute.

You can do this in three ways:

**A. Ask Claude Code (easiest).** Open the project in Claude Code and describe the change, e.g.
*"Add a new case study called Food Delivery from the files in Downloads/food-delivery, as a draft"*
or *"Change the Spunk summary to: …"*. Claude follows `CLAUDE.md`, works on a branch and opens the PR for you.

**B. On the GitHub website (no setup).** Open the file on GitHub, click the pencil icon, edit, then click **Commit changes…** and choose **Create a new branch for this commit and start a pull request**. To add images, open the folder and use **Add file → Upload files**.

**C. On your computer.** See "Run the site on your computer" at the end.

---

## Add a new case study

1. **Export the images from Figma** at **2x** (select the frame → Export → 2x → PNG):
   - Hero: a 16:9 frame (1008x568 in Figma).
   - Split sections: a 4:3 frame (536x400) **and** a 16:9 "wide" version for phones.
   - Full-width sections: a 16:9 frame.
   - Gallery: square frames (320x320), usually six.
2. **Name them** like this and put them in a new folder `public/case-studies/your-slug/`
   (the slug is a short lowercase name with hyphens, e.g. `food-delivery`):
   - `hero.png`
   - `section-02.png`, `section-03.png`… (the number is the section number)
   - `section-02-wide.png` (the phone version of a split section)
   - `gallery-01.png` … `gallery-06.png`
3. **Copy the template.** Duplicate `src/content/case-studies/_template.mdx` and rename the copy `your-slug.mdx`.
   The template explains every field. Fill them in. Keep `draft: true` until it's ready.
4. **Write alt text** for every image: describe what the screens show, as if to someone who can't see them.
   Example: *"Three Life app screens: date picker, canteen menu with allergens shown, and the signed allergy sheet."*
5. Open a PR, check the preview, set `draft: false` when you're happy, and merge.

The homepage tile, the page itself and the "Next project" links are created automatically. You can have any number of sections.

---

## Edit text

- **Case study:** open its `.mdx` file. Text is between quotes, e.g. `summary: "…"`.
  Keep the quotes; inside them, write normally. Section paragraphs are the lines starting with `- "`.
- **About page:** `src/data/about.ts`. Each bio paragraph is one line in quotes, in order.
- **Name, role, email, LinkedIn:** `src/data/site.ts`. They update everywhere on the site.

House style: **no em dashes (—)**. Use a comma, colon or full stop. The site refuses to build if one sneaks in (en dashes in dates, like "Jun 2025 – Jun 2026", are fine).

---

## Swap an image

Export the new version from Figma at 2x and upload it with **exactly the same file name**, replacing the old one.
If the image shows something different, update its `alt:` text in the `.mdx` file too.

---

## Hide or show a case study

In the case study's `.mdx` file:

- `draft: true` → hidden **everywhere** on the live site (no page, no tile, no link, no images).
- `draft: false` → published.

Note: the repository itself is public, so drafts (text and images) can be seen by anyone who browses the code on GitHub, even though they're not on the site.

---

## Reorder the homepage

Each case study has an `order:` number. `1` is first (top left), `2` next, and so on.
Change the numbers so they don't clash.

---

## Check before publishing

- **Vercel preview:** the link Vercel posts on your PR. Click through Home, the case study you changed, About, and a made-up address (to see the 404).
- **Things to look at:** images load and look sharp, text has no typos, nothing overlaps on a phone (narrow your browser window), and the menu opens on small screens.
- **Automatic checks** on the PR must be green before GitHub lets you merge. If the "Vercel" check fails, open its details and look at the last lines of the build log; it usually names the field or image that's wrong (for example a missing image file or alt text).

---

## Publish

Click **Squash and merge** on the PR. That's it: the live site updates within a minute.

For bigger updates (a new case study, a redesign), also add a line to `CHANGELOG.md` in the same PR and ask Claude to tag the release (`v1.1.0`, `v1.2.0`…). Small fixes get patch numbers (`v1.0.2`).

**Undo a release:** in Vercel go to **Deployments**, open the previous good one, and click **Promote to Production**. Or, on GitHub, open the merged PR and click **Revert**.

---

## Add the waving avatar video

Put `avatar-wave.mp4` (and, if you have it, `avatar-wave.webm`) in the `public/` folder.
That's all: the avatar starts using it automatically.

- Square, short, muted (no sound needed), under about 1 MB.
- Your photo still shows while it loads, and for anyone who has "reduce motion" turned on.
- Because it loops, a small pause button appears on the avatar automatically.

---

## Run the site on your computer (optional)

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:4321. Changes appear as you save.

Before opening a PR you can also run the same checks the site was built with:

```bash
npm run check
npm run build
npm run preview
npm run audit:a11y
npm run audit:lighthouse
```

(`audit:a11y` and `audit:lighthouse` need `npm run preview` running in another terminal.)
