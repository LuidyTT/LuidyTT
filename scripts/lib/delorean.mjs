import { palette } from './theme.mjs';

// DeLorean seen from behind, 50x30 pixels. Written as left halves (25 columns) and
// mirrored, so the car is symmetric by construction.
//
//   rows 0-8    louvered rear window (dark slots / light slats) with small mirrors
//   rows 9-10   silver rear deck
//   rows 11-15  tail light housings: amber indicator, red grid, white reverse light,
//               and a slate panel around the license plate
//   rows 16-22  silver trim, dark bumper, silver strip, row of vents
//   rows 23-29  tread-patterned tires and the dark underbody
const mirror = (half) => half + [...half].reverse().join('');

const LIGHTS = '..SDAADRRRDRRRDWDNNNWWWWW';
const SEPARATOR = '..SDDDDDDDDDDDDDDNNNWWWWW';
const BUMPER = '..MGGGGGGGGGGGGGGGGGGGGGG';
const TRIM = '..SSSSSSSSSSSSSSSSSSSSSSS';

export const DELOREAN = [
  '............SSSSSSSSSSSSS',
  '..........SMDDDDDDDDDDDDD',
  '..........SMMMMMMMMMMMMMM',
  '.........SMDDDDDDDDDDDDDD',
  '.........SMWWWWWWWWWWWWWW',
  '........SMDDDDDDDDDDDDDDD',
  '........SMMMMMMMMMMMMMMMM',
  '.....LLSMDDDDDDDDDDDDDDDD',
  '....LLLSMDDDDDDDDDDDDDDDD',
  '...SSSSSSSSSSSSSSSSSSSSSS',
  '..SMMMMMMMMMMMMMMMMMMMMMM',
  LIGHTS,
  SEPARATOR,
  LIGHTS,
  SEPARATOR,
  LIGHTS,
  TRIM,
  BUMPER,
  BUMPER,
  BUMPER,
  BUMPER,
  TRIM,
  '..MGGGGGGGGGGVVGVVGVVGVVG',
  '.KKKKKKKKDDDDDDDDDDDDDDDD',
  '.KTKTKTKKDDDDDDDDDDDDDDDD',
  '.KKTKTKTKDDDDDDDDDDDDDDDD',
  '.KTKTKTKKDDDDDDDDDDDDDDDD',
  '.KKTKTKTKDDDDDDMMMMMMMMMM',
  '.KTKTKTKKDDDDDDDDDDDDDDDD',
  '..KKKKKKDDDDDDDDDDDDDDDDD',
].map(mirror);

// The tail lights are the one place the car uses red and amber, as on the real thing;
// everything else stays in the titanium palette.
export const DELOREAN_COLORS = {
  S: palette.titanium,
  M: '#8d99a6',
  G: '#2a3640',
  D: '#0b0f14',
  V: '#05070a',
  K: '#05070a',
  T: '#1c232b',
  W: '#e8edf2',
  R: '#c2374a',
  A: '#e5a13a',
  N: '#3b4a5a',
  L: '#9fb2c8',
};
