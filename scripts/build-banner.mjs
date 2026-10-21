import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { sprite, pixelText, textWidth } from './lib/pixel.mjs';
import { CAR, CAR_COLORS } from './lib/art.mjs';
import { landmarks, CITY } from './lib/landmarks.mjs';

const W = 1200;
const H = 400;
const GROUND = 340;
const LOOP = '10s';

// --- original stylized pixel art (silhouettes only) ---
const HELI_PX = 6;
const HELI = [
  '.....................T..............',
  '.....................T..............',
  '...............TTTTTTTTTTT...........',
  '..............BBBBBBBBBBBBBBB........',
  '..DD.BBBBBBBBBBBBBBBBBBBBBBBBBB......',
  '..DD.BBBBBBBBBBBBBBBBBBBGGGGGGGB.....',
  '...D.......BBBBBBBBBBBBBGGGGGGGGGB...',
  '...........BBBBBBBBBBBBBBGGGGGGGGGBC.',
  '............DDDBBBBBBBBBBBBBBBBBBBD..',
  '..............DDDDDDDDDDDDDDDDDDD....',
  '...............D.........D...........',
  '..............TTTTTTTTTTTTTTTTTTTT...',
];
const HELI_COLORS = { T: palette.titanium, B: '#4a5868', G: '#2f8794', D: '#1a222c', C: palette.cyan };
const HELI_X = 900;
const HELI_Y = GROUND - HELI.length * HELI_PX;
const MAST_X = HELI_X + 21 * HELI_PX + HELI_PX / 2;

const CAR_PX = 5;
const CAR_X = 560;
const CAR_Y = GROUND - CAR.length * CAR_PX;
const LIGHT_DROP = 2 * CAR_PX;

const TITLE = { text: 'LUIDY T TELES', px: 7, x: 48, y: 104 };

// Deterministic skyline so the output is stable between runs.
function skyline() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const parts = [];
  let lit = 0;
  let x = 0;
  while (x < W) {
    const w = 30 + Math.floor(rnd() * 30);
    // Keep the middle of the skyline low so the landmarks behind it stay readable.
    const cap = x < 410 ? 110 : x < 880 ? 38 : 180;
    const h = 60 + Math.floor(rnd() * (cap - 60));
    parts.push(`<rect x="${x}" y="${GROUND - h}" width="${w - 2}" height="${h}" fill="${CITY}"/>`);
    for (let wy = GROUND - h + 10; wy < GROUND - 14; wy += 14) {
      for (let wx = x + 6; wx < x + w - 10; wx += 10) {
        if (rnd() < 0.14) {
          lit++;
          // Every 4th lit window flickers, like someone switching a light.
          const flicker = lit % 4 === 0
            ? `<animate attributeName="opacity" values="0.55;0.08;0.55" dur="${3 + (lit % 4) + (lit % 3)}s" begin="-${lit % 5}s" repeatCount="indefinite"/>`
            : '';
          parts.push(`<rect x="${wx}" y="${wy}" width="4" height="4" fill="${palette.titaniumDim}" opacity="0.55">${flicker}</rect>`);
        }
      }
    }
    x += w;
  }
  return parts.join('');
}

function reveal() {
  const n = TITLE.text.length;
  const full = textWidth(TITLE.text, TITLE.px);
  const values = [0];
  const keyTimes = [0];
  const d = 0.3 / n;
  for (let k = 1; k <= n; k++) {
    values.push(textWidth(TITLE.text.slice(0, k), TITLE.px) + (k < n ? TITLE.px : 0));
    keyTimes.push(+(0.5 + (k - 1) * d).toFixed(4));
  }
  values.push(full);
  keyTimes.push(1);
  return `<clipPath id="reveal"><rect x="${TITLE.x}" y="${TITLE.y - 4}" width="${full}" height="${7 * TITLE.px + 8}">
    <animate attributeName="width" calcMode="discrete" values="${values.join(';')}" keyTimes="${keyTimes.join(';')}" dur="${LOOP}" repeatCount="indefinite"/>
  </rect></clipPath>`;
}

const anim = (attr, values, keyTimes, extra = '') =>
  `<animate attributeName="${attr}" values="${values}" keyTimes="${keyTimes}" dur="${LOOP}" repeatCount="indefinite" ${extra}/>`;

export function renderBanner() {
  const padLights = Array.from({ length: 8 }, (_, i) =>
    `<rect x="${852 + i * 40}" y="${GROUND - 8}" width="8" height="6" fill="${palette.cyan}"><animate attributeName="opacity" values="1;0.25;1" dur="1.6s" begin="${(i * 0.2).toFixed(1)}s" repeatCount="indefinite"/></rect>`).join('');
  const hudRight = 'GOIANIA - BR';
  const dashes = Array.from({ length: 9 }, (_, i) =>
    `<rect x="${30 + i * 62}" y="${GROUND + 40}" width="30" height="3" fill="${palette.titaniumDim}" opacity="0.45"/>`).join('');
  const stars = [[90, 40], [210, 70], [380, 30], [560, 60], [720, 28], [880, 52], [1010, 36], [1130, 66], [300, 90]]
    .map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="3" fill="${palette.ink}" opacity="0.5"><animate attributeName="opacity" values="0.6;0.12;0.6" dur="${2 + (i % 3)}s" begin="-${(i * 0.7).toFixed(1)}s" repeatCount="indefinite"/></rect>`).join('');
  const beamX = CAR_X + 34 * CAR_PX;
  const beamY = CAR_Y + 2 * CAR_PX;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Luidy T Teles, Software Engineer. Animated pixel scene: an Airbus H160 helicopter lands and a sports car raises its pop-up headlights.">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${palette.bg}"/><stop offset="0.6" stop-color="#101722"/><stop offset="1" stop-color="#1d2938"/>
  </linearGradient>
  <linearGradient id="beamfill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${palette.champagne}" stop-opacity="0.9"/><stop offset="1" stop-color="${palette.champagne}" stop-opacity="0"/>
  </linearGradient>
  ${reveal()}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}
<g id="scene" opacity="1">
  ${anim('opacity', '0;1;1;0', '0;0.02;0.95;1')}
  ${landmarks(GROUND).svg}
  ${skyline()}
  <rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="${palette.panel}"/>
  <rect y="${GROUND}" width="${W}" height="2" fill="${palette.titaniumDim}"/>
  ${dashes}
  <rect x="840" y="${GROUND - 2}" width="300" height="6" fill="${palette.titanium}"/>
  <g id="pad-lights" opacity="1">${anim('opacity', '0;0;1;1', '0;0.3;0.4;1')}${padLights}</g>

  <polygon id="beam" points="${beamX},${beamY} ${beamX + 190},${beamY - 26} ${beamX + 190},${beamY + 54} ${beamX},${beamY + 14}" fill="url(#beamfill)" opacity="0.4">
    ${anim('opacity', '0;0;0.4;0.08;0.4;0.08;0.4;0.4', '0;0.5;0.52;0.55;0.57;0.6;0.62;1')}
  </polygon>
  <g id="popups">
    <animateTransform attributeName="transform" type="translate" values="0 ${LIGHT_DROP};0 ${LIGHT_DROP};0 0;0 0" keyTimes="0;0.4;0.5;1" dur="${LOOP}" repeatCount="indefinite"/>
    <rect x="${CAR_X + 28 * CAR_PX}" y="${CAR_Y + 1 * CAR_PX}" width="${3 * CAR_PX}" height="${2 * CAR_PX}" fill="#10161e"/>
    <rect x="${CAR_X + 30 * CAR_PX}" y="${CAR_Y + 1 * CAR_PX}" width="${CAR_PX}" height="${2 * CAR_PX}" fill="${palette.champagne}" opacity="1">
      ${anim('opacity', '0.3;0.3;1;0.3;1;0.3;1;1', '0;0.5;0.52;0.55;0.57;0.6;0.62;1')}
    </rect>
  </g>
  ${sprite(CAR, CAR_COLORS, CAR_PX, CAR_X, CAR_Y)}

  <g id="heli">
    <animateTransform attributeName="transform" type="translate" values="0 -380;0 0;0 0" keyTimes="0;0.3;1" calcMode="spline" keySplines="0.2 0.6 0.3 1;0 0 1 1" dur="${LOOP}" repeatCount="indefinite"/>
    ${sprite(HELI, HELI_COLORS, HELI_PX, HELI_X, HELI_Y)}
    <g transform="translate(${MAST_X} ${HELI_Y + 2 * HELI_PX})">
      <g>
        <animateTransform attributeName="transform" type="scale" values="1 1;0.55 1;1 1" dur="0.3s" repeatCount="indefinite"/>
        <rect x="-165" y="-3" width="330" height="4" fill="${palette.titanium}" opacity="0.8"/>
      </g>
    </g>
  </g>

  <g id="title" clip-path="url(#reveal)">${pixelText(TITLE.text, TITLE.px, TITLE.x, TITLE.y, palette.champagne)}</g>
  <g id="subtitle" opacity="1">
    ${anim('opacity', '0;0;1;1', '0;0.65;0.8;1')}
    ${pixelText('SOFTWARE ENGINEER', 3, 48, 176, palette.titanium)}
    ${pixelText('ENGINEERING IDEAS INTO REALITY', 2, 48, 214, palette.titaniumDim)}
  </g>

  <g id="aircraft">
    <animateTransform attributeName="transform" type="translate" values="-80 0;1280 0" dur="${LOOP}" repeatCount="indefinite"/>
    <g transform="translate(0 84)">
      <rect width="26" height="4" fill="${palette.titaniumDim}"/>
      <rect x="9" y="-5" width="8" height="5" fill="${palette.titaniumDim}"/>
      <rect x="9" y="4" width="8" height="5" fill="${palette.titaniumDim}"/>
      <rect x="-3" y="0" width="3" height="3" fill="${palette.cyan}"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>
    </g>
  </g>
  <g id="radar" transform="translate(1110 124)">
    <circle r="34" fill="${palette.panel}" fill-opacity="0.6" stroke="${palette.titaniumDim}" stroke-opacity="0.7"/>
    <circle r="17" fill="none" stroke="${palette.titaniumDim}" stroke-opacity="0.4"/>
    <line x1="-34" y1="0" x2="34" y2="0" stroke="${palette.titaniumDim}" stroke-opacity="0.3"/>
    <line x1="0" y1="-34" x2="0" y2="34" stroke="${palette.titaniumDim}" stroke-opacity="0.3"/>
    <g>
      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite"/>
      <path d="M0,0 L34,0 A34,34 0 0 0 29.44,-17 Z" fill="${palette.cyan}" fill-opacity="0.18"/>
      <line x1="0" y1="0" x2="34" y2="0" stroke="${palette.cyan}" stroke-width="2"/>
    </g>
    <rect x="12" y="-14" width="4" height="4" fill="${palette.champagne}"><animate attributeName="opacity" values="1;0.1;1" dur="4s" repeatCount="indefinite"/></rect>
    <rect x="-18" y="8" width="4" height="4" fill="${palette.champagne}"><animate attributeName="opacity" values="0.1;1;0.1" dur="4s" repeatCount="indefinite"/></rect>
    <rect x="6" y="18" width="4" height="4" fill="${palette.champagne}"><animate attributeName="opacity" values="1;0.1;1" dur="4s" begin="-1.3s" repeatCount="indefinite"/></rect>
  </g>
  <rect x="48" y="32" width="6" height="6" fill="${palette.cyan}"><animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/></rect>
  ${pixelText('// SYSTEM ONLINE', 3, 64, 28, palette.titaniumDim)}
  ${pixelText(hudRight, 3, W - 48 - textWidth(hudRight, 3), 28, palette.titaniumDim)}
</g>
${frame(W, H)}
</svg>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/banner.svg');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderBanner());
  console.log(`wrote ${out}`);
}
