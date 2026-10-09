// Accessibility audit for the built site (WCAG 2.2 AA checks we can automate).
// Usage: npm run build && npm run preview (in another terminal), then
//   npm run audit:a11y            (defaults to http://localhost:4321)
//   BASE_URL=https://... npm run audit:a11y
// Needs Chrome installed; set CHROME_PATH if it is not in the default place.
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = (process.env.PAGES ?? '/,/about,/case-studies/spunk,/this-page-does-not-exist').split(',');
const VIEWPORTS = { desktop: [1440, 900], tablet: [768, 1024], mobile: [393, 852] };
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const problems = [];
const report = (msg) => {
  problems.push(msg);
  console.log(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

async function open(path, [w, h], opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  if (opts.reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  return page;
}

async function axe(page, label) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const result = await page.evaluate(async (tags) => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) }));
  }, AXE_TAGS);
  if (result.length === 0) ok(`axe: no violations (${label})`);
  for (const v of result) report(`axe ${v.impact} ${v.id} (${label}): ${v.help} -> ${v.nodes.join(' | ')}`);
}

async function keyboard(page, label) {
  // Start from the top, as if the page had just loaded.
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  const stops = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      return {
        key: el.outerHTML.slice(0, 80),
        name: `${el.tagName.toLowerCase()} "${name}"`,
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
        visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.left < innerWidth,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    if (!info) break;
    if (stops.length && info.key === stops[0].key) break; // wrapped around
    stops.push(info);
  }
  const bad = stops.filter((s) => !s.ring || !s.visible);
  if (stops[0]?.name.includes('Skip to content') && stops[0].visible) ok(`skip link is the first stop and visible (${label})`);
  else report(`first Tab stop is not a visible "Skip to content" link (${label}): ${stops[0]?.name}`);
  if (bad.length === 0) ok(`${stops.length} Tab stops, all with a visible 2px focus ring (${label})`);
  for (const s of bad) report(`Tab stop without visible focus ring (${label}): ${s.name}`);
  console.log(`    order: ${stops.map((s) => s.name).join(' -> ')}`);
}

async function targets(page, label) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
      .map((el) => {
        const r = el.getBoundingClientRect();
        // Include pseudo-element hit areas (BackToTop small, avatar pause).
        const before = getComputedStyle(el, '::before');
        const inset = before.content !== 'none' && before.position === 'absolute' ? -parseFloat(before.top || '0') : 0;
        return { name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), w: r.width + 2 * inset, h: r.height + 2 * inset, inline: getComputedStyle(el).display === 'inline' };
      })
      .filter((t) => !t.inline && (t.w < 24 || t.h < 24)),
  );
  if (small.length === 0) ok(`all targets at least 24x24 (WCAG 2.5.8) (${label})`);
  for (const t of small) report(`small target (${label}): "${t.name}" ${Math.round(t.w)}x${Math.round(t.h)}`);
}

async function menu(page, label) {
  const toggle = await page.$('[data-menu-toggle]');
  await toggle.focus();
  await page.keyboard.press('Enter');
  const open = await page.evaluate(() => ({
    expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
    label: document.querySelector('[data-menu-toggle]').getAttribute('aria-label'),
    controls: !!document.getElementById(document.querySelector('[data-menu-toggle]').getAttribute('aria-controls')),
    inert: document.getElementById('main').inert,
  }));
  await page.keyboard.press('Tab');
  const firstInDrawer = await page.evaluate(() => document.activeElement.closest('#menu-drawer') !== null);
  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({
    expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
    label: document.querySelector('[data-menu-toggle]').getAttribute('aria-label'),
    focusOnToggle: document.activeElement === document.querySelector('[data-menu-toggle]'),
    inert: document.getElementById('main').inert,
  }));
  const pass =
    open.expanded === 'true' && open.label === 'Close menu' && open.controls && open.inert && firstInDrawer &&
    closed.expanded === 'false' && closed.label === 'Open menu' && closed.focusOnToggle && !closed.inert;
  if (pass) ok(`menu: Enter opens (aria-expanded, "Close menu", page inert), Tab goes into drawer, Esc closes and returns focus (${label})`);
  else report(`menu keyboard behaviour (${label}): ${JSON.stringify({ open, firstInDrawer, closed })}`);
}

async function reflow(path) {
  for (const [w, h] of [[1280, 800], [320, 700]]) {
    const page = await open(path, [w, h]);
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await new Promise((r) => setTimeout(r, 200));
    const res = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      wide: [...document.querySelectorAll('main *, header *')]
        .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && el.offsetParent !== null)
        .map((el) => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'))
        .slice(0, 5),
    }));
    if (res.sw <= res.cw && res.wide.length === 0) ok(`200% text at ${w}px: no horizontal scroll`);
    else report(`200% text at ${w}px (${path}): scrollWidth ${res.sw} > ${res.cw}; ${res.wide.join(', ')}`);
    await page.close();
  }
  const page = await open(path, [320, 700]);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw <= 320) ok('320px wide: no horizontal scroll');
  else report(`320px (${path}): scrollWidth ${sw}`);
  await page.close();
}

async function reducedMotion(path) {
  const page = await open(path, [1440, 900], { reducedMotion: true });
  const longest = await page.evaluate(() =>
    Math.max(
      0,
      ...[...document.querySelectorAll('*')].flatMap((el) =>
        getComputedStyle(el).transitionDuration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000)),
      ),
    ),
  );
  const videoPlaying = await page.evaluate(() => [...document.querySelectorAll('video')].some((v) => !v.paused));
  if (longest <= 1 && !videoPlaying) ok('reduced motion: transitions off, no video playing');
  else report(`reduced motion (${path}): longest transition ${longest}ms, video playing ${videoPlaying}`);
  await page.close();
}

async function structure(page, label) {
  const s = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
    landmarks: ['header', 'nav', 'main', 'footer'].map((t) => [t, [...document.querySelectorAll(t)].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'sticky' || getComputedStyle(e).position === 'fixed').length]),
    current: [...document.querySelectorAll('[aria-current="page"]')].filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim()),
    imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length,
  }));
  if (s.lang === 'en' && s.h1.length === 1 && s.imgsNoAlt === 0) ok(`lang="en", one H1 "${s.h1[0]}", every img has alt (${label})`);
  else report(`structure (${label}): ${JSON.stringify(s)}`);
  console.log(`    landmarks: ${s.landmarks.map(([t, n]) => `${t}:${n}`).join(' ')}; aria-current: ${s.current.join(',') || 'none'}`);
}

for (const path of PAGES) {
  console.log(`\n${path}`);
  for (const [name, size] of Object.entries(VIEWPORTS)) {
    const page = await open(path, size);
    await structure(page, name);
    await axe(page, name);
    await keyboard(page, name);
    await targets(page, name);
    if (name !== 'desktop') await menu(page, name);
    await page.close();
  }
  await reflow(path);
  await reducedMotion(path);
}

await browser.close();
console.log(`\n${problems.length === 0 ? 'All checks passed.' : `${problems.length} problem(s) found.`}`);
process.exit(problems.length === 0 ? 0 : 1);
