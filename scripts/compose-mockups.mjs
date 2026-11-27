// Builds case-study mockup images from raw portrait phone screenshots.
//
// Usage:  node scripts/compose-mockups.mjs <screenshot-folder> <slug>
//
// Case studies normally get their images from a Figma "<App> mockups (auto)"
// section, exported at 2x. Laterloft had no such section, only raw 1080x2392
// phone screenshots, which fit none of the ratios the layout needs. This
// reproduces the Figma treatment instead: the same ratios (16:9 hero and
// stacked sections, 4:3 split sections, 1:1 gallery), a dark bezel, and a
// gradient of the app's brand colour running darker at the top left.
//
// The scenes at the bottom name the screenshots by file name (without .png),
// so re-run it after replacing or adding a screenshot.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const [SRC, SLUG = 'laterloft'] = process.argv.slice(2);
if (!SRC) {
  console.error('Usage: node scripts/compose-mockups.mjs <screenshot-folder> <slug>');
  process.exit(1);
}
const OUT = path.join(process.cwd(), 'public', 'case-studies', SLUG);

// Laterloft's brand green (Warm Attic). Every existing hero uses its own app's
// colour this way, darker top-left to lighter bottom-right.
const G1 = '#27614A';
const G2 = '#4C8F6D';
const BEZEL = '#16181B';

const shot = (name) => path.join(SRC, `${name}.png`);

// Regions blurred out of a screenshot before it is used, in that screenshot's
// own pixels. The Android share sheet puts real contacts, their photos and
// their names in its top row, and none of that belongs on a public site.
// Coordinates are for the 1080x2392 captures.
const REDACT = {
  'share screen': [{ left: 20, top: 1755, width: 610, height: 260 }],
};

// A screenshot with its redactions applied, blurred hard enough that nothing
// survives. Cached: the same screenshot is used in several scenes.
const sourceCache = new Map();
async function source(name) {
  if (sourceCache.has(name)) return sourceCache.get(name);
  let buf = await sharp(shot(name)).png().toBuffer();
  for (const area of REDACT[name] ?? []) {
    const patch = await sharp(buf).extract(area).blur(24).png().toBuffer();
    buf = await sharp(buf)
      .composite([{ input: patch, left: area.left, top: area.top }])
      .png()
      .toBuffer();
  }
  sourceCache.set(name, buf);
  return buf;
}

function background(w, h) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="${G1}"/><stop offset="1" stop-color="${G2}"/>
       </linearGradient></defs>
       <rect width="${w}" height="${h}" fill="url(#g)"/>
     </svg>`,
  );
}

// One phone: screenshot cropped from the top into a rounded screen, sat inside a
// dark bezel. Returns the composited PNG plus its size.
async function phone(name, innerW) {
  const bz = Math.round(innerW * 0.033); // bezel thickness, from the Figma frames
  // Screen ratio taken from the phones in the existing heroes (~0.475).
  const innerH = Math.round(innerW / 0.475);
  const rIn = Math.round(innerW * 0.105);
  const outerW = innerW + bz * 2;
  const outerH = innerH + bz * 2;
  const rOut = rIn + bz;

  const screen = await sharp(await source(name))
    .resize(innerW, innerH, { fit: 'cover', position: 'top' })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${innerW}" height="${innerH}"><rect width="${innerW}" height="${innerH}" rx="${rIn}" ry="${rIn}" fill="#fff"/></svg>`,
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  const body = Buffer.from(
    `<svg width="${outerW}" height="${outerH}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${outerW}" height="${outerH}" rx="${rOut}" ry="${rOut}" fill="${BEZEL}"/>
     </svg>`,
  );

  const img = await sharp(body)
    .composite([{ input: screen, left: bz, top: bz }])
    .png()
    .toBuffer();

  return { img, w: outerW, h: outerH };
}

// One browser window: a page screenshot under a light toolbar with the three
// dots and an address pill, matching the "browser · …" frames the Event
// Management and Website redesign mockups use in Figma.
async function browserFrame(file, innerW, contentH) {
  const bar = Math.round(innerW * 0.0333);
  const r = Math.round(innerW * 0.012);
  const dot = Math.max(4, Math.round(innerW * 0.0095));
  const pillW = Math.round(innerW * 0.31);
  const pillH = Math.max(6, Math.round(innerW * 0.0167));

  const page = await sharp(file)
    .resize({ width: innerW })
    .extract({ left: 0, top: 0, width: innerW, height: contentH })
    .toBuffer();

  const chrome = Buffer.from(
    `<svg width="${innerW}" height="${bar + contentH}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${innerW}" height="${bar + contentH}" rx="${r}" ry="${r}" fill="#DDDCD6"/>
       <circle cx="${bar * 0.5}" cy="${bar * 0.5}" r="${dot / 2}" fill="#B9B7AE"/>
       <circle cx="${bar * 1.0}" cy="${bar * 0.5}" r="${dot / 2}" fill="#B9B7AE"/>
       <circle cx="${bar * 1.5}" cy="${bar * 0.5}" r="${dot / 2}" fill="#B9B7AE"/>
       <rect x="${(innerW - pillW) / 2}" y="${(bar - pillH) / 2}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#C9C7BF"/>
     </svg>`,
  );

  const img = await sharp(chrome)
    .composite([{ input: page, left: 0, top: bar }])
    .png()
    .toBuffer();

  // Round the bottom corners too, which the page screenshot squares off.
  const mask = Buffer.from(
    `<svg width="${innerW}" height="${bar + contentH}"><rect width="${innerW}" height="${bar + contentH}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
  const out = await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return { img: out, w: innerW, h: bar + contentH };
}

// Lay phones on a background. Each entry: { name, innerW, x, y } where x/y are
// the top-left of the bezel; y may be negative or run past the canvas so the
// phone bleeds off the edge, as the Figma frames do.
async function scene(file, w, h, phones) {
  const parts = [];
  for (const p of phones) {
    const { img, w: pw, h: ph } =
      p.kind === 'browser'
        ? await browserFrame(path.join(SRC, p.file), p.innerW, p.contentH)
        : await phone(p.name, p.innerW);
    // A phone may run past the canvas (the gallery squares show only the top of
    // the screen). sharp refuses to composite anything bigger than the canvas,
    // so cut the phone down to the part that actually lands on it.
    const left = Math.max(0, p.x);
    const top = Math.max(0, p.y);
    const right = Math.min(w, p.x + pw);
    const bottom = Math.min(h, p.y + ph);
    if (right <= left || bottom <= top) continue;
    const needsClip = left !== p.x || top !== p.y || right !== p.x + pw || bottom !== p.y + ph;
    const input = needsClip
      ? await sharp(img)
          .extract({ left: left - p.x, top: top - p.y, width: right - left, height: bottom - top })
          .png()
          .toBuffer()
      : img;
    parts.push({ input, left, top });
  }
  await sharp(background(w, h)).composite(parts).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  const m = await sharp(path.join(OUT, file)).metadata();
  console.log(`  ${file.padEnd(24)} ${m.width}x${m.height}  ratio ${(m.width / m.height).toFixed(2)}`);
}

fs.mkdirSync(OUT, { recursive: true });
console.log(`Case-study images for ${SLUG}:`);

if (SLUG === 'laterloft-site') {
  // The waitlist site: browser windows on the same gradient, the way the
  // Event Management and Website redesign mockups frame a web page. Source
  // screenshots come from scripts/capture-site.mjs.
  await scene('hero.png', 2016, 1136, [
    { kind: 'browser', file: 'desktop-hero.png', innerW: 1230, contentH: 769, x: 190, y: 162 },
    { name: 'm-hero', innerW: 286, x: 1540, y: 258 },
  ]);

  await scene('section-02.png', 1608, 1200, [
    { kind: 'browser', file: 'sec-compare.png', innerW: 1360, contentH: 557, x: 124, y: 279 },
  ]);
  await scene('section-02-wide.png', 2016, 1136, [
    { kind: 'browser', file: 'sec-compare.png', innerW: 1700, contentH: 696, x: 158, y: 191 },
  ]);

  await scene('section-04.png', 2016, 1136, [
    { kind: 'browser', file: 'sec-how.png', innerW: 1700, contentH: 685, x: 158, y: 197 },
  ]);

  await scene('section-05.png', 1608, 1200, [
    { kind: 'browser', file: 'sec-action.png', innerW: 1360, contentH: 811, x: 124, y: 152 },
  ]);
  await scene('section-05-wide.png', 2016, 1136, [
    { kind: 'browser', file: 'sec-action.png', innerW: 1700, contentH: 1013, x: 158, y: 32 },
  ]);

  // Gallery: the same page on a phone, one square per section.
  const views = ['m-hero', 'm-compare', 'm-how', 'm-action', 'm-privacy', 'm-questions'];
  for (const [i, name] of views.entries()) {
    await scene(`gallery-0${i + 1}.png`, 640, 640, [{ name, innerW: 406, x: 104, y: 72 }]);
  }
} else {

  // Hero, 16:9. Two phones flanking a larger centre one that bleeds off the
  // bottom, mirroring the SPUNK and LIFE heroes.
  await scene('hero.png', 2016, 1136, [
    { name: 'library light mode', innerW: 402, x: 283, y: 150 },
    { name: 'save sheet', innerW: 452, x: 770, y: 70 },
    { name: 'player screen', innerW: 402, x: 1305, y: 150 },
  ]);

  // 03 Constraints, split 4:3 + a 16:9 version for phones.
  // 1608x1200, not the 1072x800 the other case studies use: from 90em up a split
  // image is ~760 CSS px wide, so 2x needs about 1520.
  await scene('section-03.png', 1608, 1200, [
    { name: 'share screen', innerW: 534, x: 198, y: 90 },
    { name: 'save sheet', innerW: 534, x: 840, y: 90 },
  ]);
  await scene('section-03-wide.png', 2016, 1136, [
    { name: 'share screen', innerW: 398, x: 552, y: 110 },
    { name: 'save sheet', innerW: 398, x: 1040, y: 110 },
  ]);

  // 04 Decisions, stacked 16:9: the card and the viewer side by side.
  await scene('section-04.png', 2016, 1136, [
    { name: 'category screen', innerW: 398, x: 552, y: 110 },
    { name: 'player screen', innerW: 398, x: 1040, y: 110 },
  ]);

  // 05 Design system, split 4:3 + 16:9: the same screen light and dark.
  await scene('section-05.png', 1608, 1200, [
    { name: 'library light mode', innerW: 534, x: 198, y: 90 },
    { name: 'library dark mode', innerW: 534, x: 840, y: 90 },
  ]);
  await scene('section-05-wide.png', 2016, 1136, [
    { name: 'library light mode', innerW: 398, x: 552, y: 110 },
    { name: 'library dark mode', innerW: 398, x: 1040, y: 110 },
  ]);

  // Gallery, six 1:1 squares. The phone overflows the bottom, as in the Figma
  // gallery frames, so the square shows the top of the screen.
  const gallery = [
    'library light mode',
    'category screen',
    'search',
    'player screen',
    'save sheet',
    'library dark mode',
  ];
  for (const [i, name] of gallery.entries()) {
    await scene(`gallery-0${i + 1}.png`, 640, 640, [{ name, innerW: 406, x: 104, y: 72 }]);
  }
}
