// Reports how the artwork sits inside every case-study image.
//
//   node scripts/audit-mockup-margins.mjs
//
// It models the background from the four corners (these are flat or linear
// gradients), finds the bounding box of everything that is not background, and
// prints the margin on each side. Uneven margins mean a phone or a browser
// window is not centred in its canvas; a bottom margin of 0 outside the gallery
// means the artwork runs off the edge.
//
// Only `laterloft` and `laterloft-site` can be fixed from here, through
// scripts/compose-mockups.mjs. The other four come from Figma frames, where a
// phone bleeding off the bottom is the intended look.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = new URL('../public/case-studies', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TOL = 26;

async function analyse(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  const S = 400; // analyse a downscale: fast and ignores jpeg-ish noise
  const w = S, h = Math.max(1, Math.round((meta.height / meta.width) * S));
  // These PNGs carry an alpha channel, so the stride is not 3.
  const { data, info } = await img.resize(w, h, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const px = (x, y) => { const i = (y * w + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const c = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  // bilinear background estimate from the corners
  const bg = (x, y) => {
    const u = x / (w - 1), v = y / (h - 1);
    return [0, 1, 2].map((k) =>
      c[0][k] * (1 - u) * (1 - v) + c[1][k] * u * (1 - v) + c[2][k] * (1 - u) * v + c[3][k] * u * v);
  };
  let top = null, bottom = null, left = null, right = null;
  const rowHas = new Array(h).fill(false), colHas = new Array(w).fill(false);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = px(x, y), b = bg(x, y);
      if (Math.abs(p[0] - b[0]) > TOL || Math.abs(p[1] - b[1]) > TOL || Math.abs(p[2] - b[2]) > TOL) {
        rowHas[y] = true; colHas[x] = true;
      }
    }
  }
  top = rowHas.indexOf(true); bottom = rowHas.lastIndexOf(true);
  left = colHas.indexOf(true); right = colHas.lastIndexOf(true);
  if (top < 0) return null;
  const sx = meta.width / w, sy = meta.height / h;
  return {
    w: meta.width, h: meta.height,
    top: Math.round(top * sy), bottom: Math.round((h - 1 - bottom) * sy),
    left: Math.round(left * sx), right: Math.round((w - 1 - right) * sx),
  };
}

const rows = [];
for (const slug of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()) {
    const r = await analyse(path.join(dir, f));
    if (r) rows.push({ slug, f, ...r });
  }
}

const kind = (f) => (f.startsWith('gallery') ? 'gallery' : f.startsWith('hero') ? 'hero' : 'section');
console.log('slug/file'.padEnd(46), 'canvas'.padEnd(11), ' top  bot  left right   notes');
for (const r of rows) {
  const k = kind(r.f);
  const notes = [];
  // Gallery squares are meant to run off the bottom (the Figma pattern).
  if (r.top <= 1 || r.left <= 1 || r.right <= 1) notes.push('TOUCHES EDGE');
  if (r.bottom <= 1 && k !== 'gallery') notes.push('TOUCHES BOTTOM');
  const vert = Math.abs(r.top - r.bottom);
  if (k !== 'gallery' && r.bottom > 1 && vert > Math.max(40, 0.06 * r.h)) notes.push(`uneven vertical ${r.top}/${r.bottom}`);
  const horiz = Math.abs(r.left - r.right);
  if (horiz > Math.max(40, 0.05 * r.w)) notes.push(`uneven horizontal ${r.left}/${r.right}`);
  console.log(`${(r.slug + '/' + r.f).padEnd(46)} ${(r.w + 'x' + r.h).padEnd(11)} ${String(r.top).padStart(4)} ${String(r.bottom).padStart(4)} ${String(r.left).padStart(5)} ${String(r.right).padStart(5)}   ${notes.join('; ')}`);
}
