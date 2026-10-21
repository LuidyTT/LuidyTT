// Deterministic placeholder data for previews and direct runs.
export function sampleWeekly(seed = 3) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: 52 }, (_, i) => {
    const trend = 0.25 + (i / 52) * 0.75; // activity ramps up toward the present
    return Math.floor(rnd() * 40 * trend * (rnd() < 0.12 ? 0 : 1));
  });
}

export const sampleStats = { total: 855, currentStreak: 6, longestStreak: 19 };

export const sampleLangs = [
  { name: 'Java', percent: 46.6 },
  { name: 'TypeScript', percent: 18.1 },
  { name: 'JavaScript', percent: 14.0 },
  { name: 'CSS', percent: 6.1 },
  { name: 'HTML', percent: 4.6 },
];
