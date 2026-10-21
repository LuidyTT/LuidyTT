import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { pixelText, textWidth } from './lib/pixel.mjs';

const W = 1200;
const H = 230;
const X0 = 48;
const SCOPE_X = 330;
const SCOPE_W = 670;
const SCOPE_H = 64;
const METER_X = 1046;
const SEGMENTS = 5;

// Signal strength stands for fluency: a bigger, cleaner wave and a fuller meter.
const CHANNELS = [
  { id: 'pt', code: 'PT-BR', level: 'NATIVE', lit: 5, amp: 24, period: 80, dur: 2, harmonic: 0, color: palette.champagne, cy: 82 },
  { id: 'en', code: 'EN', level: 'INTERMEDIATE', lit: 3, amp: 12, period: 100, dur: 3.2, harmonic: 0.35, color: palette.cyan, cy: 170 },
];

// One extra period of wave so scrolling by exactly `period` loops with no jump.
function wavePath({ cy, amp, period, harmonic }) {
  const pts = [];
  for (let x = 0; x <= SCOPE_W + period; x += 4) {
    const t = (2 * Math.PI * x) / period;
    const y = cy - amp * (Math.sin(t) + harmonic * Math.sin(2 * t));
    pts.push(`${pts.length ? 'L' : 'M'}${SCOPE_X + x},${y.toFixed(1)}`);
  }
  return pts.join('');
}

function segments({ cy, lit, color }, growing) {
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const x = METER_X + i * 22;
    const y = cy - 14;
    if (i < lit) return `<rect class="seg on" x="${x}" y="${y}" width="18" height="28" fill="${color}"/>`;
    if (growing && i === lit) {
      return `<rect class="seg grow" x="${x}" y="${y}" width="18" height="28" fill="${color}" opacity="0.55"><animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.4s" repeatCount="indefinite"/></rect>`;
    }
    return `<rect class="seg off" x="${x}" y="${y}" width="18" height="28" fill="${palette.titaniumDim}" opacity="0.25"/>`;
  }).join('');
}

function channel(ch) {
  const top = ch.cy - SCOPE_H / 2;
  const grid = [-16, 0, 16]
    .map((d) => `<line x1="${SCOPE_X}" y1="${ch.cy + d}" x2="${SCOPE_X + SCOPE_W}" y2="${ch.cy + d}" stroke="${palette.titaniumDim}" stroke-opacity="${d === 0 ? 0.45 : 0.2}"/>`)
    .join('');
  const ticks = Array.from({ length: 9 }, (_, i) => SCOPE_X + (i + 1) * (SCOPE_W / 10))
    .map((x) => `<line x1="${x.toFixed(1)}" y1="${top}" x2="${x.toFixed(1)}" y2="${top + SCOPE_H}" stroke="${palette.titaniumDim}" stroke-opacity="0.15"/>`)
    .join('');
  return `<g class="lang" data-code="${ch.code}" data-level="${ch.level}" data-lit="${ch.lit}" data-amp="${ch.amp}">
${pixelText(ch.code, 5, X0, ch.cy - 28, palette.titanium)}
${pixelText(ch.level, 3, X0, ch.cy + 14, ch.color)}
<clipPath id="scope-${ch.id}"><rect x="${SCOPE_X}" y="${top}" width="${SCOPE_W}" height="${SCOPE_H}"/></clipPath>
<rect x="${SCOPE_X}" y="${top}" width="${SCOPE_W}" height="${SCOPE_H}" fill="${palette.bg}" stroke="${palette.titaniumDim}" stroke-opacity="0.6"/>
${grid}${ticks}
<g clip-path="url(#scope-${ch.id})" data-period="${ch.period}"><g><animateTransform attributeName="transform" type="translate" values="0 0;-${ch.period} 0" dur="${ch.dur}s" repeatCount="indefinite"/><path d="${wavePath(ch)}" fill="none" stroke="${ch.color}" stroke-width="3" stroke-linejoin="round"/></g></g>
${segments(ch, ch.id === 'en')}
</g><!--end-lang-->`;
}

export function renderLanguages() {
  const right = 'SIGNAL STRENGTH';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Spoken languages: Portuguese, native. English, intermediate and improving.">
<rect width="${W}" height="${H}" fill="${palette.panel}"/>
${pixelText('LANGUAGE LINK', 3, X0, 16, palette.titanium)}
${pixelText(right, 2, W - X0 - textWidth(right, 2), 20, palette.titaniumDim)}
${CHANNELS.map(channel).join('\n')}
${frame(W, H)}
</svg>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/languages.svg');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderLanguages());
  console.log(`wrote ${out}`);
}
