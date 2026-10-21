import { writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchContribData, fetchLanguages } from './lib/github.mjs';
import { weeklyTotals, renderEq } from './build-eq.mjs';
import { renderStats } from './build-stats.mjs';

// Fetch and render everything first; touch the output dir only when all of it succeeded.
export async function update({ login, token, outDir, fetchFn = fetch }) {
  const [data, langs] = await Promise.all([
    fetchContribData(login, token, fetchFn),
    fetchLanguages(login, token, fetchFn),
  ]);
  const files = {
    'eq.svg': renderEq(weeklyTotals(data.days), data.total),
    'stats.svg': renderStats(data, langs),
  };

  mkdirSync(outDir, { recursive: true });
  const staged = Object.entries(files).map(([name, svg]) => {
    const final = resolve(outDir, name);
    const tmp = `${final}.tmp`;
    writeFileSync(tmp, svg);
    return [tmp, final];
  });
  for (const [tmp, final] of staged) renameSync(tmp, final);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_REPOSITORY_OWNER;
  if (!token || !login) {
    console.error('GITHUB_TOKEN and GITHUB_REPOSITORY_OWNER are required');
    process.exit(1);
  }
  const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
  update({ login, token, outDir }).then(
    () => console.log(`updated eq.svg and stats.svg for ${login}`),
    (err) => {
      console.error(err.message);
      process.exit(1);
    },
  );
}
