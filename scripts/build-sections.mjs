import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame, escapeXml } from './lib/theme.mjs';
import { pixelText, textWidth } from './lib/pixel.mjs';

const W = 1200;
const X0 = 48;
const GARAGE_H = 170;

const ARTISTS = ['CALVIN HARRIS', 'DAVID GUETTA', 'ALOK', 'IMAGINE DRAGONS'];
const NOW_PLAYING = 'TITANIUM - DAVID GUETTA';
const LOOP = '6s';

export function renderHeader(num, title, tag) {
  const tagSvg = tag
    ? pixelText(tag, 2, W - X0 - textWidth(tag, 2), 22, palette.titaniumDim)
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 56" width="${W}" height="56" role="img" aria-label="${escapeXml(`${num} ${title}`)}">
<rect x="${X0 - 24}" y="14" width="10" height="28" fill="${palette.champagne}"/>
${pixelText(`${num} // ${title}`, 4, X0, 12, palette.titanium)}
${tagSvg}
<rect x="${X0}" y="46" width="${W - 2 * X0}" height="1" fill="${palette.titaniumDim}" fill-opacity="0.5"/>
<rect x="${X0}" y="45" width="64" height="3" fill="${palette.cyan}" opacity="0.8"><animateTransform attributeName="transform" type="translate" values="0 0;${W - 2 * X0 - 64} 0" dur="4s" repeatCount="indefinite"/></rect>
</svg>
`;
}

function typedReveal() {
  const n = NOW_PLAYING.length;
  const full = textWidth(NOW_PLAYING, 5);
  const values = [0];
  const keyTimes = [0];
  const typeEnd = 0.5;
  for (let k = 1; k <= n; k++) {
    values.push(textWidth(NOW_PLAYING.slice(0, k), 5) + (k < n ? 5 : 0));
    keyTimes.push(+(((k - 1) / n) * typeEnd).toFixed(4));
  }
  values.push(full);
  keyTimes.push(1);
  return `<clipPath id="typed"><rect x="${X0}" y="46" width="${full}" height="${7 * 5 + 8}">
    <animate attributeName="width" calcMode="discrete" values="${values.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${LOOP}" repeatCount="indefinite"/>
  </rect></clipPath>`;
}

function equalizer() {
  const base = 118;
  const count = 12;
  const x0 = 880;
  return Array.from({ length: count }, (_, i) => {
    const x = x0 + i * 22;
    const lo = 16 + ((i * 7) % 5) * 6;
    const hi = 54 + ((i * 11) % 6) * 8;
    const mid = Math.round((lo + hi) / 2);
    const dur = (0.7 + (i % 4) * 0.19).toFixed(2);
    return `<line x1="${x}" y1="${base}" x2="${x}" y2="${base - mid}" stroke="${i === 3 ? palette.champagne : palette.titanium}" stroke-width="12" stroke-dasharray="5 2"><animate attributeName="y2" values="${base - lo};${base - hi};${base - lo}" dur="${dur}s" repeatCount="indefinite"/></line>`;
  }).join('');
}

// The "car radio": what is playing, who it is by, and a progress bar.
export function renderGarage() {
  let cx = X0;
  const chips = ARTISTS.map((name) => {
    const w = textWidth(name, 2) + 28;
    const g = `<g class="chip" data-name="${name}"><rect x="${cx}" y="100" width="${w}" height="30" fill="${palette.panel}" stroke="${palette.titaniumDim}" stroke-opacity="0.7"/>${pixelText(name, 2, cx + 14, 108, palette.titanium)}</g>`;
    cx += w + 12;
    return g;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${GARAGE_H}" width="${W}" height="${GARAGE_H}" role="img" aria-label="Now playing: Titanium by David Guetta. Favorite artists: Calvin Harris, David Guetta, Alok, Imagine Dragons.">
<defs>${typedReveal()}</defs>
<rect width="${W}" height="${GARAGE_H}" fill="${palette.panel}"/>
${pixelText('NOW PLAYING', 2, X0, 24, palette.titaniumDim)}
<rect x="${X0 + 148}" y="24" width="6" height="6" fill="${palette.cyan}"><animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/></rect>
<g clip-path="url(#typed)">${pixelText(NOW_PLAYING, 5, X0, 52, palette.champagne)}</g>
${equalizer()}
${chips}
<rect x="${X0}" y="146" width="${W - 2 * X0}" height="4" fill="none" stroke="${palette.titaniumDim}" stroke-opacity="0.5"/>
<rect x="${X0}" y="146" width="420" height="4" fill="${palette.champagne}"><animate attributeName="width" values="0;${W - 2 * X0}" dur="30s" repeatCount="indefinite"/></rect>
${frame(W, GARAGE_H)}
</svg>
`;
}

const HEADERS = [
  ['01', 'ABOUT ME', 'WHO I AM'],
  ['02', 'STACK', 'LANGUAGES / TOOLS'],
  ['03', 'TELEMETRY', 'ACTIVITY / LANGUAGES'],
  ['04', 'GARAGE & SOUND', 'NOW PLAYING'],
  ['05', 'CONTACT', 'OPEN CHANNEL'],
];

export function writeSections(outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const [num, title, tag] of HEADERS) {
    writeFileSync(resolve(outDir, `header-${num}.svg`), renderHeader(num, title, tag));
  }
  writeFileSync(resolve(outDir, 'garage.svg'), renderGarage());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
  writeSections(out);
  console.log(`wrote sections to ${out}`);
}
