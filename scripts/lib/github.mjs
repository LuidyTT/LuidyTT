const ENDPOINT = 'https://api.github.com/graphql';
const DAY = 86400000;

async function graphql(query, variables, token, fetchFn) {
  const res = await fetchFn(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-readme-updater',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API request failed: ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GitHub API error: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data;
}

const CALENDAR_QUERY = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;

export async function fetchContribData(login, token, fetchFn = fetch) {
  const data = await graphql(CALENDAR_QUERY, { login }, token, fetchFn);
  const cal = data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GitHub user "${login}" not found`);

  const days = cal.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Today may not have contributions yet; that must not reset the streak.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }

  return { days, total: cal.totalContributions, currentStreak: current, longestStreak: longest };
}

const LANG_QUERY = `query($login:String!){user(login:$login){repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC){nodes{name languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}}}`;

export async function fetchLanguages(login, token, fetchFn = fetch) {
  const data = await graphql(LANG_QUERY, { login }, token, fetchFn);
  const repos = data?.user?.repositories?.nodes;
  if (!repos) throw new Error(`GitHub user "${login}" not found`);

  const bytes = new Map();
  for (const repo of repos) {
    // The profile repo holds this generator; its JavaScript would skew the mix.
    if (repo.name?.toLowerCase() === login.toLowerCase()) continue;
    for (const e of repo.languages?.edges ?? []) {
      bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);
    }
  }
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...bytes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, size]) => ({ name, percent: Math.round((size / total) * 1000) / 10 }));
}
