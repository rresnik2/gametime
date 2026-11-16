#!/usr/bin/env node
/**
 * Generates every GameTime icon, splash and favicon from assets/brand/mark.svg.
 *
 *   npm run icons
 *
 * Reads the geometry of #play and #live from the mark, then writes:
 *   assets/brand/logo.svg                    mark + "GameTime" wordmark (Space Grotesk Bold, outlined)
 *   assets/images/icon.png                   1024 app icon (Android legacy, web manifest, iOS fallback)
 *   assets/images/android-icon-*.png         1024 adaptive icon foreground, background, monochrome
 *   assets/images/splash-icon.png            1024 transparent splash image (expo-splash-screen)
 *   assets/images/favicon.png                48 web favicon
 *   assets/app.icon/                         iOS Icon Composer icon (icon.json + SVG layers)
 *   docs/brand/icon-{1024,180,29}.png        previews for reviews and docs
 *
 * Commit the outputs. Change the design in mark.svg (or the constants below), never in the outputs.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

// Brand tokens (src/theme/tokens.ts).
const BACKGROUND = '#0B0B12';
const PRIMARY = '#7C5CFF';
const LIVE = '#FF3B5C';
const TEXT = '#FFFFFF';

// ---------------------------------------------------------------------------
// Read the mark
// ---------------------------------------------------------------------------

const markSvg = fs.readFileSync(at('assets/brand/mark.svg'), 'utf8');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  if (!m) throw new Error(`mark.svg: missing ${name} on ${tag.slice(0, 40)}…`);
  return m[1];
};
const tagById = (id) => {
  const m = markSvg.match(new RegExp(`<[a-z]+[^>]*\\sid="${id}"[^>]*>`, 's'));
  if (!m) throw new Error(`mark.svg: no element with id="${id}"`);
  return m[0];
};
const playTag = tagById('play');
const liveTag = tagById('live');
const mark = {
  viewBox: attr(markSvg.match(/<svg[^>]*>/s)[0], 'viewBox').split(/[\s,]+/).map(Number),
  playPath: attr(playTag, 'd').replace(/\s+/g, ' ').trim(),
  live: { cx: +attr(liveTag, 'cx'), cy: +attr(liveTag, 'cy'), r: +attr(liveTag, 'r') },
};
const [vbX, vbY, vbW, vbH] = mark.viewBox;

/**
 * The mark as SVG elements, scaled so its viewBox is `size` px wide and centred on (cx, cy).
 * `parts` picks which shapes to draw (the iOS icon puts each on its own layer).
 */
function markElements({ size, cx, cy, play = PRIMARY, live = LIVE, parts = ['play', 'live'] }) {
  const s = size / vbW;
  const tx = cx - (vbX + vbW / 2) * s;
  const ty = cy - (vbY + vbH / 2) * s;
  const out = [];
  if (parts.includes('play')) out.push(`<path fill="${play}" fill-rule="evenodd" d="${mark.playPath}"/>`);
  if (parts.includes('live')) {
    out.push(`<circle fill="${live}" cx="${mark.live.cx}" cy="${mark.live.cy}" r="${mark.live.r}"/>`);
  }
  return `<g transform="translate(${round(tx)} ${round(ty)}) scale(${round(s, 5)})">${out.join('')}</g>`;
}

const round = (n, d = 2) => +n.toFixed(d);
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;

/** Dark background with a soft violet glow behind the mark. */
const background = (n) =>
  `<defs><radialGradient id="glow" cx="50%" cy="46%" r="55%">` +
  `<stop offset="0" stop-color="${PRIMARY}" stop-opacity="0.30"/>` +
  `<stop offset="1" stop-color="${PRIMARY}" stop-opacity="0"/></radialGradient></defs>` +
  `<rect width="${n}" height="${n}" fill="${BACKGROUND}"/><rect width="${n}" height="${n}" fill="url(#glow)"/>`;

function writePng(file, svgText, width) {
  const png = new Resvg(svgText, { fitTo: { mode: 'width', value: width } }).render().asPng();
  fs.mkdirSync(path.dirname(at(file)), { recursive: true });
  fs.writeFileSync(at(file), png);
  console.log(`  ${file} (${width}px)`);
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true });
  fs.writeFileSync(at(file), text);
  console.log(`  ${file}`);
}

// ---------------------------------------------------------------------------
// Layouts (all on a 1024 canvas)
// ---------------------------------------------------------------------------

const N = 1024;
const C = N / 2;
/** App icon: the mark's viewBox spans 78% of the icon, so the triangle is ~52% wide. */
const ICON_MARK = 800;
/**
 * Android adaptive foreground: the launcher may crop to a circle of 66/108 of the canvas
 * (diameter ~626px). The mark's farthest point is ~88 units from the viewBox centre, so
 * 640px keeps it inside a ~560px circle with margin.
 */
const ADAPTIVE_MARK = 640;

const appIcon = svg(N, N, background(N) + markElements({ size: ICON_MARK, cx: C, cy: C }));

console.log('Generating GameTime icons from assets/brand/mark.svg');

writePng('assets/images/icon.png', appIcon, N);
writePng('docs/brand/icon-1024.png', appIcon, 1024);
writePng('docs/brand/icon-180.png', appIcon, 180);
writePng('docs/brand/icon-29.png', appIcon, 29);

writePng('assets/images/android-icon-background.png', svg(N, N, background(N)), N);
writePng(
  'assets/images/android-icon-foreground.png',
  svg(N, N, markElements({ size: ADAPTIVE_MARK, cx: C, cy: C })),
  N,
);
writePng(
  'assets/images/android-icon-monochrome.png',
  svg(N, N, markElements({ size: ADAPTIVE_MARK, cx: C, cy: C, play: '#FFFFFF', live: '#FFFFFF' })),
  N,
);

// Splash: transparent, mark fills the canvas; app.json's imageWidth sets the on-screen size.
writePng('assets/images/splash-icon.png', svg(N, N, markElements({ size: N, cx: C, cy: C })), N);

// Favicon: rounded dark tile so the mark reads on light and dark browser chrome.
const FAV = 48;
writePng(
  'assets/images/favicon.png',
  svg(
    FAV,
    FAV,
    `<rect width="${FAV}" height="${FAV}" rx="${FAV * 0.22}" fill="${BACKGROUND}"/>` +
      markElements({ size: FAV * 1.12, cx: FAV / 2, cy: FAV / 2 }),
  ),
  FAV,
);

// ---------------------------------------------------------------------------
// iOS Icon Composer icon (ios.icon in app.json): solid background, the play shape and the
// live dot as separate glass layers so the dot floats above the triangle.
// ---------------------------------------------------------------------------

const iconDir = 'assets/app.icon';
fs.rmSync(at(iconDir), { recursive: true, force: true });
writeText(
  `${iconDir}/Assets/play.svg`,
  svg(N, N, markElements({ size: ICON_MARK, cx: C, cy: C, parts: ['play'] })),
);
writeText(
  `${iconDir}/Assets/live.svg`,
  svg(N, N, markElements({ size: ICON_MARK, cx: C, cy: C, parts: ['live'] })),
);
const srgb = (hex) =>
  'extended-srgb:' +
  [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(5)).join(',') +
  ',1.00000';
const layerGroup = (name) => ({
  layers: [{ 'image-name': `${name}.svg`, name }],
  shadow: { kind: 'neutral', opacity: 0.5 },
  translucency: { enabled: true, value: 0.4 },
});
writeText(
  `${iconDir}/icon.json`,
  JSON.stringify(
    {
      fill: { solid: srgb(BACKGROUND) },
      groups: [layerGroup('live'), layerGroup('play')],
      'supported-platforms': { squares: 'shared' },
    },
    null,
    2,
  ) + '\n',
);

// ---------------------------------------------------------------------------
// Logo lockup: mark + "GameTime" in Space Grotesk Bold, outlined so it needs no font.
// ---------------------------------------------------------------------------

const fontFile = fs.readFileSync(
  at('node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf'),
);
const font = opentype.parse(
  fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength),
);
// Mark bounds in mark units: triangle x -50..82, y ±73.4 (see mark.svg).
const MARK_BOUNDS = { x0: -50, x1: 82, h: 146.8 };
const capHeight = font.tables.os2.sCapHeight / font.unitsPerEm;
const fontSize = (MARK_BOUNDS.h * 0.54) / capHeight; // caps are 54% of the mark's height
const gap = 34;
const pad = 8;
const textX = MARK_BOUNDS.x1 + gap;
const baseline = (capHeight * fontSize) / 2; // centre the caps on the mark
const word = font.getPath('GameTime', textX, baseline, fontSize);
const wb = word.getBoundingBox();
const lx = MARK_BOUNDS.x0 - pad;
const ly = -MARK_BOUNDS.h / 2 - pad;
const lw = wb.x2 + pad - lx;
const lh = MARK_BOUNDS.h + pad * 2;
writeText(
  'assets/brand/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(lx)} ${round(ly)} ${round(lw)} ${round(lh)}">` +
    `<title>GameTime</title>` +
    `<!-- Generated by scripts/generate-icons.mjs from mark.svg; do not edit. Use on dark backgrounds. -->` +
    `<path fill="${PRIMARY}" fill-rule="evenodd" d="${mark.playPath}"/>` +
    `<circle fill="${LIVE}" cx="${mark.live.cx}" cy="${mark.live.cy}" r="${mark.live.r}"/>` +
    `<path fill="${TEXT}" d="${word.toPathData(2)}"/></svg>\n`,
);
writePng(
  'docs/brand/logo.png',
  svg(
    1200,
    Math.round((1080 * lh) / lw) + 120,
    `<rect width="100%" height="100%" fill="${BACKGROUND}"/>` +
      `<g transform="translate(60 60) scale(${round(1080 / lw, 5)}) translate(${round(-lx)} ${round(-ly)})">` +
      fs.readFileSync(at('assets/brand/logo.svg'), 'utf8').replace(/^<svg[^>]*>|<\/svg>\s*$/g, '') +
      `</g>`,
  ),
  1200,
);

console.log('Done.');
