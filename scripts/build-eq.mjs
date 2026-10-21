import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { sprite, pixelText, textWidth } from './lib/pixel.mjs';
import { DELOREAN, DELOREAN_COLORS } from './lib/delorean.mjs';
import { sampleWeekly, sampleStats } from './lib/sample-data.mjs';
import { sun, floor, palms } from './lib/retrowave.mjs';

const W = 1200;
const H = 440;
const X0 = 48;
const CHART_W = W - 2 * X0;
const BASE = 272;
const HORIZON = BASE + 4;
const VPX = W / 2;
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
  const CAR_PX = 4;
  const carW = DELOREAN[0].length * CAR_PX;
  const carH = DELOREAN.length * CAR_PX;
  const carX = VPX - carW / 2;
  const carY = H - 8 - carH;
  const glow = (col) => {
    // Glow over one tail light housing: sprite columns col..col+10, rows 11..15.
    const gx = carX + col * CAR_PX - 4;
    return `<rect x="${gx}" y="${carY + 11 * CAR_PX - 4}" width="${11 * CAR_PX + 8}" height="${5 * CAR_PX + 8}" fill="#c2374a" opacity="0.3"><animate attributeName="opacity" values="0.15;0.45;0.15" dur="1.8s" repeatCount="indefinite"/></rect>`;
  };
  const delorean = `<g id="delorean" data-center="${VPX}">
  <animateTransform attributeName="transform" type="translate" values="-8 0;8 0;-8 0" dur="6s" repeatCount="indefinite"/>
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="0.8s" repeatCount="indefinite"/>
    <rect id="underglow" x="${carX + 10}" y="${carY + carH - 4}" width="${carW - 20}" height="6" fill="${palette.cyan}" opacity="0.5"><animate attributeName="opacity" values="0.25;0.75;0.25" dur="1.6s" repeatCount="indefinite"/></rect>
    <g id="taillights">${glow(4)}${glow(35)}</g>
    ${sprite(DELOREAN, DELOREAN_COLORS, CAR_PX, carX, carY)}
  </g>
</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${synced ? `Contribution graph: ${Math.max(0, Math.round(total))} contributions in the last year, drawn as an equalizer above a road.` : 'Contribution graph waiting for the first sync.'}">
<defs>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${palette.bg}"/><stop offset="0.7" stop-color="#172130"/><stop offset="1" stop-color="#2c394b"/>
  </linearGradient>
  <linearGradient id="barfill" gradientUnits="userSpaceOnUse" x1="0" y1="${BASE}" x2="0" y2="${BASE - MAX_H}">
    <stop offset="0" stop-color="${palette.titaniumDim}"/><stop offset="1" stop-color="${palette.titanium}"/>
  </linearGradient>
  <linearGradient id="scanfill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${palette.cyan}" stop-opacity="0"/><stop offset="1" stop-color="${palette.cyan}" stop-opacity="0.35"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#dusk)"/>
${sun(VPX, HORIZON, 150)}
<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="${palette.panel}"/>
${floor(VPX, HORIZON, W, H)}
${palms(VPX, HORIZON, H)}
<g>${bars}${cap}</g>
<rect id="scan" x="${X0}" y="${BASE - MAX_H - 12}" width="48" height="${MAX_H + 12}" fill="url(#scanfill)">
  <animate attributeName="x" values="${X0};${W - X0 - 48}" dur="8s" repeatCount="indefinite"/>
</rect>
<rect y="${BASE - 2}" width="${W}" height="6" fill="${palette.champagne}" opacity="0.1"/>
<rect y="${HORIZON}" width="${W}" height="2" fill="${palette.champagne}" opacity="0.6"/>
${delorean}
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
