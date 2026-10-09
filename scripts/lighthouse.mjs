// Lighthouse scores for every page, mobile and desktop.
// Usage: npm run build && npm run preview (in another terminal), then
//   npm run audit:lighthouse      (defaults to http://localhost:4321)
//   BASE_URL=https://... npm run audit:lighthouse
// Targets: performance 90+, accessibility 95+.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
// The 404 page is scored at /404 (status 200): Lighthouse refuses pages that return 404.
const PAGES = (process.env.PAGES ?? '/,/about,/case-studies/spunk,/404').split(',');
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless=new'],
});

let failed = 0;
console.log('page'.padEnd(30), 'form'.padEnd(8), 'perf', 'a11y', 'best', 'seo ', 'LCP', 'CLS');
for (const path of PAGES) {
  for (const formFactor of ['mobile', 'desktop']) {
    const config = formFactor === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const { lhr } = await lighthouse(
      BASE + path,
      { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] },
      config,
    );
    const s = (k) => Math.round(lhr.categories[k].score * 100);
    const perf = s('performance');
    const a11y = s('accessibility');
    if (perf < 90 || a11y < 95) failed++;
    console.log(
      path.padEnd(30),
      formFactor.padEnd(8),
      String(perf).padEnd(4),
      String(a11y).padEnd(4),
      String(s('best-practices')).padEnd(4),
      String(s('seo')).padEnd(4),
      lhr.audits['largest-contentful-paint'].displayValue,
      lhr.audits['cumulative-layout-shift'].displayValue,
    );
    const a11yFails = Object.values(lhr.audits).filter(
      (a) => a.score !== null && a.score < 1 && lhr.categories.accessibility.auditRefs.some((r) => r.id === a.id && r.weight > 0),
    );
    for (const a of a11yFails) console.log(`    a11y: ${a.id} ${a.title}`);
  }
}
await chrome.kill();
console.log(failed === 0 ? '\nAll pages meet perf 90+ / a11y 95+.' : `\n${failed} run(s) below target.`);
process.exit(failed === 0 ? 0 : 1);
