import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, frame } from './lib/theme.mjs';
import { pixelText, textWidth } from './lib/pixel.mjs';
import { sampleStats, sampleLangs } from './lib/sample-data.mjs';

const W = 1200;
const H = 260;
const TRACK_X = 780;
const TRACK_W = 260;
const MAX_LABEL = 14;

const SYMBOLS = {
  'C#': 'C SHARP',
  'C++': 'C PLUS',
  'F#': 'F SHARP',
  'Q#': 'Q SHARP',
  'Jupyter Notebook': 'JUPYTER',
  'Visual Basic .NET': 'VB.NET',
};

// Cut at a word boundary so labels never end mid-word.
function fit(label) {
  if (label.length <= MAX_LABEL) return label;
  const head = label.slice(0, MAX_LABEL + 1);
  const cut = head.lastIndexOf(' ');
  return (cut > 0 ? head.slice(0, cut) : label.slice(0, MAX_LABEL)).trim();
}

// Language names come from GitHub; the pixel font only covers a small charset.
export function labelFor(name) {
  const mapped = SYMBOLS[name] ?? name;
  const clean = fit(
    mapped
      .toUpperCase()
      .replace(/[^A-Z0-9 \-.:/&'·]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  return clean || 'OTHER';
}

const int = (n) => (Number.isFinite(n) ? String(Math.max(0, Math.round(n))) : '--');
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function readout(label, value, x) {
  return `${pixelText(label, 3, x, 72, palette.titanium)}${pixelText(int(value), 6, x, 106, palette.champagne)}`;
}

export function renderStats({ total, currentStreak, longestStreak }, langs) {
  const ratio = clamp((currentStreak ?? 0) / Math.max(longestStreak ?? 0, 1), 0, 1);
  const gaugeW = 440;

  const rows = langs.length
    ? langs
        .map(({ name, percent }, i) => {
          const y = 64 + i * 36;
          const p = clamp(percent, 0, 100);
          const fillW = +((p / 100) * TRACK_W).toFixed(2);
          return [
            pixelText(labelFor(name), 2, 600, y + 3, palette.titanium),
            `<rect x="${TRACK_X}" y="${y}" width="${TRACK_W}" height="16" fill="${palette.panel}" stroke="${palette.titaniumDim}" stroke-opacity="0.5"/>`,
            `<rect class="lang-fill" data-w="${fillW}" data-track="${TRACK_W}" x="${TRACK_X}" y="${y}" width="${fillW}" height="16" fill="${palette.titanium}"/>`,
            pixelText(`${(Math.round(percent * 10) / 10).toFixed(1)}%`, 3, TRACK_X + TRACK_W + 16, y - 1, palette.champagne),
          ].join('');
        })
        .join('')
    : pixelText('NO DATA', 3, 600, 100, palette.titaniumDim);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="GitHub stats: ${int(total)} contributions, current streak ${int(currentStreak)} days, longest streak ${int(longestStreak)} days.">
<rect width="${W}" height="${H}" fill="${palette.panel}"/>
${pixelText('STATUS - LAST 12 MONTHS', 3, 48, 28, palette.titanium)}
${pixelText('TOP LANGUAGES', 3, 600, 28, palette.titanium)}
${readout('STREAK', currentStreak, 48)}
${readout('LONGEST', longestStreak, 208)}
${readout('TOTAL', total, 368)}
<rect x="48" y="180" width="${gaugeW}" height="12" fill="${palette.bg}" stroke="${palette.titaniumDim}" stroke-opacity="0.5"/>
<rect x="48" y="180" width="${+(gaugeW * ratio).toFixed(2)}" height="12" fill="${palette.cyan}"/>
${pixelText('CURRENT VS LONGEST', 2, 48, 204, palette.titaniumDim)}
<line x1="560" y1="20" x2="560" y2="${H - 20}" stroke="${palette.titaniumDim}" stroke-opacity="0.4"/>
${rows}
${frame(W, H)}
</svg>
`;
}

export const placeholderStats = () =>
  renderStats({ total: null, currentStreak: null, longestStreak: null }, []);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/stats.svg');
  mkdirSync(dirname(out), { recursive: true });
  const sample = process.argv.includes('--sample');
  writeFileSync(out, sample ? renderStats(sampleStats, sampleLangs) : placeholderStats());
  console.log(`wrote ${out} (${sample ? 'sample data' : 'placeholder'})`);
}
