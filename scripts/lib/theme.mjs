export const palette = {
  bg: '#07090d',
  panel: '#0d1117',
  titanium: '#b8c2cc',
  titaniumDim: '#6b7785',
  champagne: '#d9bf8c',
  cyan: '#5fd4e6',
  ink: '#e8edf2',
};

// Thin titanium border with champagne corner ticks.
export function frame(w, h, { accent = palette.champagne } = {}) {
  const t = 14;
  const tick = (x, y, dx, dy) =>
    `<path d="M${x},${y + dy * t} L${x},${y} L${x + dx * t},${y}" fill="none" stroke="${accent}" stroke-width="2"/>`;
  return [
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${palette.titanium}" stroke-opacity="0.45" stroke-width="1"/>`,
    tick(1, 1, 1, 1),
    tick(w - 1, 1, -1, 1),
    tick(1, h - 1, 1, -1),
    tick(w - 1, h - 1, -1, -1),
  ].join('');
}

export const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
