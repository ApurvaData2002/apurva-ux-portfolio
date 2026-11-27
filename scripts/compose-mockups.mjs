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

  const screen = await sharp(shot(name))
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

// Lay phones on a background. Each entry: { name, innerW, x, y } where x/y are
// the top-left of the bezel; y may be negative or run past the canvas so the
// phone bleeds off the edge, as the Figma frames do.
async function scene(file, w, h, phones) {
  const parts = [];
  for (const p of phones) {
    const { img, w: pw, h: ph } = await phone(p.name, p.innerW);
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

// Hero, 16:9. Two phones flanking a larger centre one that bleeds off the
// bottom, mirroring the SPUNK and LIFE heroes.
await scene('hero.png', 2016, 1136, [
  { name: 'library light mode', innerW: 402, x: 283, y: 150 },
  { name: 'save sheet', innerW: 452, x: 770, y: 70 },
  { name: 'player screen', innerW: 402, x: 1305, y: 150 },
]);

// 03 Constraints, split 4:3 + a 16:9 version for phones.
await scene('section-03.png', 1072, 800, [
  { name: 'share screen', innerW: 356, x: 132, y: 60 },
  { name: 'save sheet', innerW: 356, x: 560, y: 60 },
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
await scene('section-05.png', 1072, 800, [
  { name: 'library light mode', innerW: 356, x: 132, y: 60 },
  { name: 'library dark mode', innerW: 356, x: 560, y: 60 },
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
