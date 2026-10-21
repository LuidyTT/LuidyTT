import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { pixelText, textWidth } from './lib/pixel.mjs';

const W = 1200;
const H = 230;
const X0 = 48;
const PX = 3;
const SEGMENTS = 5;

// Real flag colors, a touch muted so they sit on the dark panel.
export const FLAG = {
  green: '#2a9d5c',
  yellow: '#e8c547',
  blue: '#2b4fa3',
  white: '#e8edf2',
  red: '#b3363f',
  navy: '#2b3f7a',
};

function brazil() {
  const w = 42;
  const h = 30;
  const R = 7.5;
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      if (px * px + py * py <= R * R) return Math.abs(py + 0.3 * px - 0.15 * R) <= 0.85 ? 'white' : 'blue';
      return Math.abs(px) / 18 + Math.abs(py) / 12 <= 1 ? 'yellow' : 'green';
    }));
}

function usa() {
  const w = 50;
  const h = 26;
  const stars = new Set();
  for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) stars.add(`${2 + 4 * c},${2 + 3 * r}`);
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      if (x < 20 && y < 14) return stars.has(`${x},${y}`) ? 'white' : 'navy';
      return Math.floor(y / 2) % 2 === 0 ? 'red' : 'white';
    }));
}

export function flagCells(country) {
  return country === 'BR' ? brazil() : usa();
}

// One <g> per pixel column, each rippling out of phase, so the cloth appears to wave.
function flag(country, fx, fy) {
  const cells = flagCells(country);
  const cols = cells[0].length;
  const rows = cells.length;
  const columns = Array.from({ length: cols }, (_, x) => {
    const rects = [];
    let y = 0;
    while (y < rows) {
      const c = cells[y][x];
      let end = y;
      while (end + 1 < rows && cells[end + 1][x] === c) end++;
      rects.push(`<rect x="${fx + x * PX}" y="${fy + y * PX}" width="${PX}" height="${(end - y + 1) * PX}" fill="${FLAG[c]}"/>`);
      y = end + 1;
    }
    return `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0;0 3;0 0" dur="2.4s" begin="-${(x * 0.09).toFixed(2)}s" repeatCount="indefinite"/>${rects.join('')}</g>`;
  });
  const pole = `<rect x="${fx - 5}" y="${fy - 8}" width="4" height="${rows * PX + 40}" fill="${palette.titaniumDim}"/><rect x="${fx - 6}" y="${fy - 12}" width="6" height="6" fill="${palette.champagne}"/>`;
  return `<g class="flag" data-country="${country}">${pole}${columns.join('')}</g>`;
}

function segments(lit, x, y, color, growing) {
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const sx = x + i * 22;
    if (i < lit) return `<rect class="seg on" x="${sx}" y="${y}" width="18" height="20" fill="${color}"/>`;
    if (growing && i === lit) {
      return `<rect class="seg grow" x="${sx}" y="${y}" width="18" height="20" fill="${color}" opacity="0.55"><animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.4s" repeatCount="indefinite"/></rect>`;
    }
    return `<rect class="seg off" x="${sx}" y="${y}" width="18" height="20" fill="${palette.titaniumDim}" opacity="0.25"/>`;
  }).join('');
}

const LANGS = [
  { code: 'PT-BR', name: 'PORTUGUESE', level: 'NATIVE', lit: 5, country: 'BR', ox: X0, flagY: 78, color: palette.champagne },
  { code: 'EN', name: 'ENGLISH', level: 'INTERMEDIATE', lit: 3, country: 'US', ox: 640, flagY: 84, color: palette.cyan },
];

function lang(l) {
  const tx = l.ox + 190;
  return `<g class="lang" data-code="${l.code}" data-name="${l.name}" data-level="${l.level}" data-lit="${l.lit}">
${flag(l.country, l.ox + 20, l.flagY)}
${pixelText(l.name, 4, tx, 74, palette.titanium)}
${pixelText(l.level, 3, tx, 112, l.color)}
${segments(l.lit, tx, 148, l.color, l.code === 'EN')}
</g><!--end-lang-->`;
}

export function renderLanguages() {
  const right = 'FLUENCY LEVEL';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Spoken languages: Portuguese, native, shown with the Brazilian flag. English, intermediate and improving, shown with the American flag.">
<rect width="${W}" height="${H}" fill="${palette.panel}"/>
${pixelText('LANGUAGES', 3, X0, 16, palette.titanium)}
${pixelText(right, 2, W - X0 - textWidth(right, 2), 20, palette.titaniumDim)}
<line x1="620" y1="52" x2="620" y2="206" stroke="${palette.titaniumDim}" stroke-opacity="0.4"/>
${LANGS.map(lang).join('\n')}
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
