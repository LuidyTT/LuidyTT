import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { pixelText } from './lib/pixel.mjs';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/luidy-t-teles-a3721b375';

const W = 900;
const H = 160;
const HANDLE = LINKEDIN_URL.split('/').pop().toUpperCase();

// An antenna that transmits: rings expand from the mast and fade, out of phase.
function antenna() {
  const cx = 110;
  const cy = 86;
  const rings = [0, 1, 2]
    .map((i) =>
      `<circle class="ring" cx="${cx}" cy="${cy - 20}" r="22" fill="none" stroke="${palette.cyan}" stroke-width="2" opacity="0.3"><animate attributeName="r" values="6;52" dur="3s" begin="${-i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="3s" begin="${-i}s" repeatCount="indefinite"/></circle>`)
    .join('');
  const mast = `<polygon points="${cx - 14},${cy + 40} ${cx + 14},${cy + 40} ${cx},${cy - 14}" fill="${palette.panel}" stroke="${palette.titaniumDim}" stroke-width="2"/><rect x="${cx - 4}" y="${cy - 26}" width="8" height="8" fill="${palette.champagne}"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></rect>`;
  return rings + mast;
}

export function renderContact() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Contact Luidy T Teles on LinkedIn.">
<rect width="${W}" height="${H}" fill="${palette.panel}"/>
${antenna()}
<g class="button" data-handle="${HANDLE}">
<rect x="238" y="34" width="310" height="76" fill="${palette.bg}" stroke="${palette.champagne}" stroke-width="2"><animate attributeName="stroke-opacity" values="1;0.35;1" dur="2.6s" repeatCount="indefinite"/></rect>
<rect x="238" y="34" width="8" height="76" fill="${palette.champagne}"/>
${pixelText('LINKEDIN', 4, 262, 56, palette.champagne)}
${pixelText(HANDLE, 2, 262, 92, palette.titaniumDim)}
</g>
${pixelText('OPEN CHANNEL', 2, 590, 34, palette.cyan)}
${pixelText('ENGINEERING IDEAS', 2, 590, 56, palette.titanium)}
${pixelText('INTO REALITY', 2, 590, 76, palette.titanium)}
${pixelText('GOIANIA - BR', 2, 590, 104, palette.titaniumDim)}
${frame(W, H)}
</svg>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/contact.svg');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderContact());
  console.log(`wrote ${out}`);
}
