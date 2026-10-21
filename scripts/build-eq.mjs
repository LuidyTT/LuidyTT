import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { sprite, pixelText, textWidth } from './lib/pixel.mjs';
import { CAR, CAR_COLORS } from './lib/art.mjs';
import { sampleWeekly, sampleStats } from './lib/sample-data.mjs';

const W = 1200;
const H = 360;
const X0 = 48;
const CHART_W = W - 2 * X0;
const BASE = 272;
const MAX_H = 170;
const MIN_SLOTS = 52;
const MAX_WEEKS = 54;
const MIN_ACTIVE_FOR_CLAMP = 20;

const DAY = 86400000;

// Group days into Monday-start weeks, oldest first, newest 54 at most.
export function weeklyTotals(days) {
  const sums = new Map();
  for (const { date, count } of days) {
    const t = Date.parse(`${date}T00:00:00Z`);
    const dow = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
    const key = t - dow * DAY;
    sums.set(key, (sums.get(key) ?? 0) + count);
  }
  return [...sums.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v).slice(-MAX_WEEKS);
}

// Scale to the 95th percentile of non-zero weeks so one outlier cannot flatten the rest.
function scaleFor(weekly) {
  const nz = weekly.filter((v) => v > 0).sort((a, b) => a - b);
  if (nz.length === 0) return 1;
  // With few active weeks the 95th percentile is just the runner-up; use the true max.
  return nz.length >= MIN_ACTIVE_FOR_CLAMP ? nz[Math.floor(0.95 * (nz.length - 1))] : nz[nz.length - 1];
}

export function renderEq(weekly, total) {
  const n = weekly.length;
  const slot = CHART_W / Math.max(n, MIN_SLOTS);
  const bw = +(slot * 0.68).toFixed(2);
  const start = X0 + (CHART_W - n * slot) / 2;
  const scale = scaleFor(weekly);
  const heights = weekly.map((v) => Math.max(2, +((Math.min(v, scale) / scale) * MAX_H).toFixed(1)));
  const peak = weekly.reduce((best, v, i) => (v > weekly[best] ? i : best), 0);

  const bars = weekly
    .map((_, i) => {
      const cx = +(start + i * slot + slot / 2).toFixed(2);
      const left = +(cx - bw / 2).toFixed(2);
      const h = heights[i];
      const dur = (1.6 + (i % 5) * 0.25).toFixed(2);
      const begin = -((i * 0.37) % 2).toFixed(2);
      return `<line class="bar" data-x="${left}" data-w="${bw}" data-h="${h}" x1="${cx}" y1="${BASE}" x2="${cx}" y2="${+(BASE - h).toFixed(1)}" stroke="url(#barfill)" stroke-width="${bw}" stroke-dasharray="6 2"><animate attributeName="opacity" values="1;0.6;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></line>`;
    })
    .join('');

  const cap =
    n > 0 && weekly[peak] > 0
      ? `<rect x="${+(start + peak * slot + (slot - bw) / 2).toFixed(2)}" y="${+(BASE - heights[peak] - 4).toFixed(1)}" width="${bw}" height="4" fill="${palette.champagne}"/>`
      : '';

  const synced = total !== null;
  const totalLabel = synced ? `${Math.max(0, Math.round(total))} IN THE LAST YEAR` : 'SYNC PENDING';
  const px = 4;
  const carY = 322 - CAR.length * px;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${synced ? `Contribution graph: ${Math.max(0, Math.round(total))} contributions in the last year, drawn as an equalizer above a road.` : 'Contribution graph waiting for the first sync.'}">
<defs>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${palette.bg}"/><stop offset="0.7" stop-color="#172130"/><stop offset="1" stop-color="#2c394b"/>
  </linearGradient>
  <linearGradient id="barfill" gradientUnits="userSpaceOnUse" x1="0" y1="${BASE}" x2="0" y2="${BASE - MAX_H}">
    <stop offset="0" stop-color="${palette.titaniumDim}"/><stop offset="1" stop-color="${palette.titanium}"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#dusk)"/>
<circle cx="${W * 0.74}" cy="${BASE}" r="96" fill="${palette.champagne}" opacity="0.12"/>
<g>${bars}${cap}</g>
<rect y="${BASE + 4}" width="${W}" height="${H - BASE - 4}" fill="${palette.panel}"/>
<rect y="${BASE + 4}" width="${W}" height="2" fill="${palette.titaniumDim}"/>
<line x1="0" y1="${BASE + 50}" x2="${W}" y2="${BASE + 50}" stroke="${palette.champagne}" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="24 16"><animate attributeName="stroke-dashoffset" values="0;-40" dur="0.8s" repeatCount="indefinite"/></line>
<g transform="translate(-200 ${carY})">
  <animateTransform attributeName="transform" type="translate" values="-200 ${carY};${W + 40} ${carY}" dur="14s" repeatCount="indefinite"/>
  ${sprite(CAR, CAR_COLORS, px, 0, 0)}
</g>
${pixelText('CONTRIBUTIONS', 3, X0, 28, palette.titanium)}
${pixelText(totalLabel, 3, W - X0 - textWidth(totalLabel, 3), 28, palette.champagne)}
${frame(W, H)}
</svg>
`;
}

export const placeholderEq = () => renderEq(Array(MIN_SLOTS).fill(0), null);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/eq.svg');
  mkdirSync(dirname(out), { recursive: true });
  const sample = process.argv.includes('--sample');
  writeFileSync(out, sample ? renderEq(sampleWeekly(), sampleStats.total) : placeholderEq());
  console.log(`wrote ${out} (${sample ? 'sample data' : 'placeholder'})`);
}
