import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame, escapeXml } from './lib/theme.mjs';
import { pixelText, textWidth } from './lib/pixel.mjs';

const W = 900;
const H = 298;
const X0 = 40;
const TEXT_X = 58;
const PX = 3;
const PITCH = 28;
const LINE_Y0 = 28;
const LOOP = 26; // seconds
const START = 1;
const GAP = 2.8; // seconds between line starts
const TYPE = 1.8; // seconds to type one line
const CHIP_Y = 240;

export const ABOUT_LINES = [
  'SOFTWARE DEVELOPER · JAVA & WEB',
  'EXPANDING INTO FULL-STACK: REACT, NODE.JS',
  'BUILDING INNOVATIVE, ETHICAL TECHNOLOGY',
  'CONCEPTS & VISUALS: BLENDER, ADOBE CC',
  'A WEAKNESS FOR AUTOMOTIVE DESIGN',
  'BILINGUAL, INTERNATIONAL & MULTICULTURAL',
  'OFF DUTY: GAMING, TECH TRENDS, OPEN SOURCE',
];

export const ABOUT_MODULES = ['JAVA & WEB', 'FULL-STACK', 'ETHICAL TECH', '3D & DESIGN'];

export const ABOUT_ALT =
  'Software developer focused on Java and web development, expanding into full-stack with React and Node.js. I build innovative, ethical technology, and I shape concepts and visual experiences in Blender and the Adobe Creative Suite, with a weakness for automotive design. Bilingual, with international and multicultural project experience. In my free time: gaming, new tech trends and open source.';

const lineY = (i) => LINE_Y0 + i * PITCH;
const frac = (t) => +(t / LOOP).toFixed(4);

// Discrete steps: one value per typed character, then hold the finished state.
function typing(i, text) {
  const n = text.length;
  const t0 = START + i * GAP;
  const values = [0];
  const keyTimes = [0];
  for (let k = 1; k <= n; k++) {
    values.push(textWidth(text.slice(0, k), PX) + (k < n ? PX : 0));
    keyTimes.push(frac(t0 + ((k - 1) * TYPE) / n));
  }
  values.push(textWidth(text, PX));
  keyTimes.push(1);
  return `<animate attributeName="width" calcMode="discrete" values="${values.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${LOOP}s" repeatCount="indefinite"/>`;
}

function line(text, i) {
  const y = lineY(i);
  const color = i === 0 ? palette.champagne : palette.titanium;
  return `<g class="line" data-text="${escapeXml(text)}">
<rect x="${X0}" y="${y + 7}" width="7" height="7" fill="${palette.cyan}"/>
<clipPath id="line-${i}"><rect x="${TEXT_X}" y="${y - 2}" width="${textWidth(text, PX)}" height="25">${typing(i, text)}</rect></clipPath>
<g clip-path="url(#line-${i})">${pixelText(text, PX, TEXT_X, y, color)}</g>
</g>`;
}

// The cursor hops to the end of each character as it is typed, then blinks at the end.
function cursor() {
  const xs = [TEXT_X];
  const ys = [lineY(0)];
  const keyTimes = [0];
  ABOUT_LINES.forEach((text, i) => {
    const n = text.length;
    const t0 = START + i * GAP;
    for (let k = 1; k <= n; k++) {
      xs.push(TEXT_X + textWidth(text.slice(0, k), PX) + 6);
      ys.push(lineY(i));
      keyTimes.push(frac(t0 + ((k - 1) * TYPE) / n));
    }
  });
  xs.push(xs[xs.length - 1]);
  ys.push(ys[ys.length - 1]);
  keyTimes.push(1);
  const kt = keyTimes.join(';');
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  return `<rect id="cursor" x="${lastX}" y="${lastY}" width="9" height="21" fill="${palette.champagne}">
<animate attributeName="x" calcMode="discrete" values="${xs.join(';')}" keyTimes="${kt}" dur="${LOOP}s" repeatCount="indefinite"/>
<animate attributeName="y" calcMode="discrete" values="${ys.join(';')}" keyTimes="${kt}" dur="${LOOP}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/>
</rect>`;
}

// Status chips: a LED that comes online in sequence, like a system check.
function chips() {
  let x = X0;
  return ABOUT_MODULES.map((name, i) => {
    const w = textWidth(name, 2) + 38;
    const g = `<g class="chip" data-name="${escapeXml(name)}" data-right="${x + w}"><rect x="${x}" y="${CHIP_Y}" width="${w}" height="30" fill="${palette.bg}" stroke="${palette.titaniumDim}" stroke-opacity="0.7"/><rect class="led" x="${x + 12}" y="${CHIP_Y + 11}" width="8" height="8" fill="${palette.cyan}"><animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/></rect>${pixelText(name, 2, x + 28, CHIP_Y + 8, palette.titanium)}</g>`;
    x += w + 12;
    return g;
  }).join('\n');
}

export function renderAbout() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(ABOUT_ALT)}">
<rect width="${W}" height="${H}" fill="${palette.panel}"/>
${ABOUT_LINES.map(line).join('\n')}
${cursor()}
${chips()}
${frame(W, H)}
</svg>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/about.svg');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderAbout());
  console.log(`wrote ${out}`);
}
