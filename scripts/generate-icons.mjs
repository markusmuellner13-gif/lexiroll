/**
 * Renders every app icon and iOS startup image from one SVG source.
 * Run with `npm run icons` after changing the mark.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { SPLASH_SPECS } from "../lib/splash.ts";

const root = path.resolve(import.meta.dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");

const GRADIENT = `
  <linearGradient id="tile" x1="14" y1="10" x2="114" y2="120" gradientUnits="userSpaceOnUse">
    <stop stop-color="#b8ff4a"/>
    <stop offset="0.55" stop-color="#45dcff"/>
    <stop offset="1" stop-color="#ff4fa3"/>
  </linearGradient>`;

const GLYPH = `
  <path d="M28 40l11.5 44h11L64 52.5 77.5 84h11L100 40H88.5l-6 26.5L70 40h-12L45.5 66.5 39.5 40z" fill="#07060f"/>
  <circle cx="34" cy="100" r="5.5" fill="#07060f"/>
  <circle cx="64" cy="100" r="5.5" fill="#07060f" fill-opacity="0.55"/>
  <circle cx="94" cy="100" r="5.5" fill="#07060f" fill-opacity="0.3"/>`;

/** The app tile: rounded square, gradient, wordmark glyph. */
function tileSvg({ maskable = false } = {}) {
  if (maskable) {
    // Maskable icons get cropped to a circle on some launchers, so the art
    // sits inside the safe zone and the gradient bleeds to the edges.
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs>${GRADIENT}</defs>
      <rect width="128" height="128" fill="url(#tile)"/>
      <g transform="translate(64 64) scale(0.72) translate(-64 -64)">${GLYPH}</g>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs>${GRADIENT}</defs>
    <rect x="8" y="8" width="112" height="112" rx="30" fill="url(#tile)"/>
    ${GLYPH}
  </svg>`;
}

function splashSvg(w, h) {
  const tile = Math.round(Math.min(w, h) * 0.28);
  const cx = w / 2;
  const cy = h / 2 - tile * 0.35;
  const fontSize = Math.round(tile * 0.3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      ${GRADIENT}
      <radialGradient id="glowA" cx="0.5" cy="0.32" r="0.5">
        <stop offset="0" stop-color="#b8ff4a" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#b8ff4a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="0.5" cy="0.85" r="0.5">
        <stop offset="0" stop-color="#ff4fa3" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#ff4fa3" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#07060f"/>
    <rect width="${w}" height="${h}" fill="url(#glowA)"/>
    <rect width="${w}" height="${h}" fill="url(#glowB)"/>
    <g transform="translate(${cx - tile / 2} ${cy - tile / 2}) scale(${tile / 128})">
      <rect x="8" y="8" width="112" height="112" rx="30" fill="url(#tile)"/>
      ${GLYPH}
    </g>
    <text x="${cx}" y="${cy + tile * 0.92}" text-anchor="middle" fill="#f5f3ff"
      font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800"
      letter-spacing="-1">Wortjagd</text>
    <text x="${cx}" y="${cy + tile * 0.92 + fontSize * 0.95}" text-anchor="middle" fill="#a09bc0"
      font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="${Math.round(fontSize * 0.45)}"
      letter-spacing="2">STADT · LAND · FLUSS</text>
  </svg>`;
}

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log("  ", path.relative(root, file));
}

await mkdir(iconsDir, { recursive: true });
await mkdir(splashDir, { recursive: true });

console.log("icons:");
await writeFile(path.join(iconsDir, "favicon.svg"), tileSvg());
console.log("   public/icons/favicon.svg");
for (const size of [64, 128, 180, 192, 256, 384, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  await png(tileSvg(), size, path.join(iconsDir, name));
}
for (const size of [192, 512]) {
  await png(tileSvg({ maskable: true }), size, path.join(iconsDir, `icon-${size}-maskable.png`));
}

console.log("splash screens:");
for (const spec of SPLASH_SPECS) {
  const file = path.join(splashDir, `${spec.label}-${spec.w}x${spec.h}.png`);
  await sharp(Buffer.from(splashSvg(spec.w, spec.h)))
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log("  ", path.relative(root, file));
}

console.log("done.");
