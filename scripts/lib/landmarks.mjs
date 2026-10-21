import { palette } from './theme.mjs';

const HAZE = 24; // landmarks stand on the horizon, behind the low skyline

const blink = (dur, begin = 0) =>
  `<animate attributeName="opacity" values="1;0.3;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;

// The skyline's own color: the landmarks should read as part of the distant city.
export const CITY = '#0b1018';
const EDGE = '#18222f';

// Three broad blades, as in the photo: two lean right, one leans left across them,
// and the right-hand blade is the tallest.
function spires(base) {
  const defs = [
    { bx: 450, tx: 529, h: 104 },
    { bx: 487, tx: 565, h: 150 },
    { bx: 559, tx: 452, h: 107 },
  ];
  const w = 17; // half the base width
  const body = defs
    .map(({ bx, tx, h }) =>
      `<polygon class="spire" points="${bx - w},${base} ${bx + w},${base} ${tx},${base - h}" fill="${CITY}" stroke="${EDGE}" stroke-width="1"/>`)
    .join('');
  const tips = defs
    .map(({ tx, h }, i) =>
      `<rect x="${tx - 1}" y="${base - h - 1}" width="3" height="3" fill="${palette.champagne}" opacity="0.7">${blink(2.4 + i * 0.5, -i * 0.7)}</rect>`)
    .join('');
  const plinth = `<rect x="436" y="${base - 8}" width="142" height="8" fill="${CITY}"/>`;
  return {
    id: 'lm-spires',
    svg: `<g id="lm-spires">${plinth}${body}${tips}</g>`,
    x0: 433,
    x1: 577,
    top: base - 150 - 1,
  };
}

// Oscar Niemeyer Cultural Center: dome, tall leaning cone, long low hall.
function ccon(base) {
  const dome = `<path id="ccon-dome" d="M612,${base} A52,58 0 0 1 716,${base} Z" fill="${CITY}" stroke="${EDGE}" stroke-width="1"/>`;
  const cone = `<polygon id="ccon-cone" points="730,${base} 772,${base} 766,${base - 116}" fill="${CITY}" stroke="${EDGE}" stroke-width="1"/>`;
  const hall = `<g id="ccon-hall"><rect x="786" y="${base - 40}" width="80" height="40" fill="${CITY}" stroke="${EDGE}" stroke-width="1"/><rect x="792" y="${base - 28}" width="68" height="4" fill="${palette.cyan}" opacity="0.3">${blink(3.4)}</rect></g>`;
  return {
    id: 'lm-ccon',
    svg: `<g id="lm-ccon">${dome}${cone}${hall}</g>`,
    x0: 612,
    x1: 866,
    top: base - 116,
  };
}

export function landmarks(ground) {
  const base = ground - HAZE;
  const parts = [spires(base), ccon(base)];
  return {
    svg: `<g id="landmarks">${parts.map((p) => p.svg).join('')}</g>`,
    bounds: parts.map(({ id, x0, x1, top }) => ({ id, x0, x1, top })),
  };
}
