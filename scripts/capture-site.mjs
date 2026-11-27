// Screenshots laterloft.com for its case-study images.
//
// Usage:  node scripts/capture-site.mjs <output-folder> [url]
//
// Writes the desktop viewport, each desktop section, and six mobile views.
// Feed the folder to scripts/compose-mockups.mjs with the slug laterloft-site.
// The site is live, so re-run this to pick up a redesign rather than editing
// the composed images by hand.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const [OUT, SITE_URL = 'https://laterloft.com'] = process.argv.slice(2);
if (!OUT) {
  console.error('Usage: node scripts/capture-site.mjs <output-folder> [url]');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

// Scroll the whole page first: the site animates sections in and lazy-loads
// the carousel, so a screenshot taken straight after load misses most of it.
const settle = async (page, step) => {
  await page.evaluate(async (s) => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += s) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1200));
  }, step);
};

const headingTop = (page, text) =>
  page.evaluate((t) => {
    const h = [...document.querySelectorAll('h2')].find((e) => e.innerText.trim().startsWith(t));
    if (!h) return null;
    const sec = h.closest('section') || h.parentElement;
    const r = sec.getBoundingClientRect();
    return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
  }, text);

// ---- Desktop ----
const desk = await browser.newPage();
await desk.setViewport({ width: 1440, height: 900 });
await desk.goto(SITE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
await settle(desk, 600);
await desk.screenshot({ path: path.join(OUT, 'desktop-hero.png') });

const full = await desk.screenshot({ fullPage: true });
const meta = await sharp(full).metadata();
const SECTIONS = {
  compare: 'You saved it',
  how: 'How it works',
  action: 'See it in action',
  privacy: 'Your library stays',
};
for (const [name, text] of Object.entries(SECTIONS)) {
  const box = await headingTop(desk, text);
  if (!box) {
    console.warn(`  skipped ${name}: no section headed "${text}"`);
    continue;
  }
  const top = Math.max(0, box.top);
  await sharp(full)
    .extract({ left: 0, top, width: 1440, height: Math.min(box.height, meta.height - top) })
    .png()
    .toFile(path.join(OUT, `sec-${name}.png`));
  console.log(`  sec-${name}.png  1440x${box.height}`);
}

// ---- Mobile, one view per section ----
const mob = await browser.newPage();
await mob.setViewport({ width: 393, height: 850, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
await mob.goto(SITE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
// On a narrow screen the hero demo opens over the page on every load ("Tap
// anywhere to skip"). Dismiss it, or every section shot is just the demo.
await new Promise((r) => setTimeout(r, 1500));
await mob.mouse.click(196, 420).catch(() => {});
await new Promise((r) => setTimeout(r, 600));
await settle(mob, 400);
for (const [name, text] of Object.entries({ hero: null, ...SECTIONS, questions: 'Questions' })) {
  const y = text === null ? { top: 0 } : await headingTop(mob, text);
  if (!y) {
    console.warn(`  skipped m-${name}`);
    continue;
  }
  await mob.evaluate((v) => window.scrollTo(0, Math.max(0, v - 24)), y.top);
  await new Promise((r) => setTimeout(r, 700));
  await mob.screenshot({ path: path.join(OUT, `m-${name}.png`) });
  console.log(`  m-${name}.png`);
}

await browser.close();
console.log('done');
