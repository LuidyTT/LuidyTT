import { palette } from './theme.mjs';
import { sprite } from './pixel.mjs';
import { PALM } from './art.mjs';

// Ease-in: things accelerate as they approach the viewer, like perspective.
const EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.55 0 1 0.45"';
const PALM_PX = 6;
const PALM_COLOR = '#1f2b3a';

const anim = (attr, from, to, dur, begin) =>
  `<animate attributeName="${attr}" values="${from};${to}" ${EASE} dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;

// A striped sunset: a solid cap, then slats whose gaps widen toward the horizon.
export function sun(cx, horizon, R = 150) {
  const k = R / 112;
  const top = horizon - R;
  const bands = [[top, 50 * k]];
  let y = top + 50 * k;
  for (let i = 0; i < 5; i++) {
    bands.push([y, 8 * k]);
    y += (8 + 2 + i * 2) * k;
  }
  const slats = bands
    .map(([by, h]) => `<rect class="slat" x="${cx - R}" y="${by.toFixed(1)}" width="${2 * R}" height="${h.toFixed(1)}"/>`)
    .join('');
  return `<g id="sun">
  <animateTransform attributeName="transform" type="translate" values="0 0;0 6;0 0" dur="8s" repeatCount="indefinite"/>
  <clipPath id="suncut"><circle cx="${cx}" cy="${horizon}" r="${R}"/></clipPath>
  <circle cx="${cx}" cy="${horizon}" r="${R + 18}" fill="${palette.champagne}" opacity="0.1"><animate attributeName="opacity" values="0.06;0.16;0.06" dur="4s" repeatCount="indefinite"/></circle>
  <g clip-path="url(#suncut)" fill="${palette.champagne}" opacity="0.42">${slats}</g>
</g>`;
}

// The road, the floor grid and the lane markings, all converging on one vanishing point.
export function floor(vpx, horizon, w, h) {
  const depth = h - horizon;
  const converging = Array.from({ length: 21 }, (_, i) => i - 10)
    .map((k) => `<line x1="${vpx}" y1="${horizon}" x2="${vpx + k * 150}" y2="${h}" stroke="${palette.titaniumDim}" stroke-opacity="0.22"/>`)
    .join('');
  const road = `<polygon id="road" points="${vpx - 4},${horizon} ${vpx + 4},${horizon} ${vpx + 270},${h} ${vpx - 270},${h}" fill="#0a0f16" stroke="${palette.champagne}" stroke-opacity="0.55" stroke-width="2"/>`;

  const laneDur = 2.4;
  const dashes = Array.from({ length: 6 }, (_, k) => {
    const e = ((k + 0.5) / 6) ** 2;
    const sy = (horizon + depth * e).toFixed(1);
    const sh = (1 + 35 * e).toFixed(1);
    const sw = (2 + 18 * e).toFixed(1);
    const sx = (vpx - (1 + 9 * e)).toFixed(1);
    const begin = (-(k * laneDur) / 6).toFixed(2);
    return `<rect class="dash" x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${palette.champagne}" opacity="0.8">${anim('y', horizon, h, laneDur, begin)}${anim('height', 1, 36, laneDur, begin)}${anim('width', 2, 20, laneDur, begin)}${anim('x', vpx - 1, vpx - 10, laneDur, begin)}</rect>`;
  }).join('');

  const gridDur = 3.2;
  const lines = Array.from({ length: 8 }, (_, k) => {
    const e = ((k + 0.5) / 8) ** 2;
    const begin = (-(k * gridDur) / 8).toFixed(2);
    return `<rect class="gridline" x="0" y="${(horizon + depth * e).toFixed(1)}" width="${w}" height="${(1 + 2 * e).toFixed(1)}" fill="${palette.titaniumDim}" opacity="0.35">${anim('y', horizon, h, gridDur, begin)}${anim('height', 1, 3, gridDur, begin)}</rect>`;
  }).join('');

  return `${converging}${road}<g id="lane">${dashes}</g><g id="grid">${lines}</g>`;
}

// Palms rush past on both sides: born tiny at the vanishing point, huge as they leave the frame.
export function palms(vpx, horizon, h) {
  const dur = 4.8;
  const end = 3.3;
  const items = [];
  for (const [side, dir] of [['L', -1], ['R', 1]]) {
    for (let k = 0; k < 3; k++) {
      const begin = (-(k * 1.6 + (side === 'R' ? 0.8 : 0))).toFixed(2);
      const x0 = vpx + dir * 8;
      const x1 = vpx + dir * 900;
      const e = 0.3; // static frame: a palm part-way down its path
      const mx = (vpx + dir * 900 * e).toFixed(1);
      const my = (horizon + (h - horizon) * e).toFixed(1);
      items.push(
        `<g class="palm" data-side="${side}" transform="translate(${mx} ${my})"><animateTransform attributeName="transform" type="translate" values="${x0} ${horizon};${x1} ${h}" ${EASE} dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><g transform="scale(${(end * e).toFixed(2)})"><animateTransform attributeName="transform" type="scale" values="0.06;${end}" ${EASE} dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>${sprite(PALM, { P: PALM_COLOR }, PALM_PX, -51, -90)}</g></g>`,
      );
    }
  }
  return `<g id="palms">${items.join('')}</g>`;
}
