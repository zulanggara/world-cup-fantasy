#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

const HOME_URL = 'https://play.fifa.com/';
const PLAYERS_URL = 'https://play.fifa.com/json/fantasy/players.json';
const SQUADS_URL = 'https://play.fifa.com/json/fantasy/squads.json';
const STATS_URL = (id) => `https://play.fifa.com/json/fantasy/player_stats/${id}.json`;
const ROUNDS_URL = 'https://play.fifa.com/json/fantasy/rounds.json';
const MATCHES_URL = 'https://worldcup26.ir/get/games';
const STADIUMS_URL = 'https://worldcup26.ir/get/stadiums';

const ELO_BASE = 'https://www.eloratings.net';
const ELO_TEAMS_URL = `${ELO_BASE}/en.teams.tsv`;
const ELO_CURRENT_URL = `${ELO_BASE}/2026_World_Cup.tsv`;
const ELO_FIXTURES_URL = `${ELO_BASE}/2026_World_Cup_fixtures.tsv`;
const ELO_RESULTS_URL = `${ELO_BASE}/2026_World_Cup_latest.tsv`;

// eloratings.net's team-name strings don't always match our squads.json
// names verbatim (FIFA vs. common-usage naming) — only these 7 of 48 World
// Cup 2026 teams needed a manual override; everything else matches by
// normalized name automatically.
const ELO_NAME_OVERRIDES = {
  'Cabo Verde': 'Cape Verde',
  'Congo DR': 'DR Congo',
  "Côte d'Ivoire": 'Ivory Coast',
  'IR Iran': 'Iran',
  'Korea Republic': 'South Korea',
  'Türkiye': 'Turkey',
  'USA': 'United States',
};

const FIFA_TEAMS_PAGE_URL = 'https://inside.fifa.com/data-centre/teams';
const FIFA_H2H_URL = (teamA, teamB) =>
  `https://inside.fifa.com/api/data-centre/head-to-head/head-to-head?teamA=${teamA}&teamB=${teamB}&language=en`;

// matches.json's home_team_name_en/away_team_name_en (worldcup26.ir) sometimes
// spells a team differently than squads.json (FIFA's own naming) — same alias
// list as groups.html's/best15-next-round.html's SQUAD_NAME_ALIASES.
const SQUAD_NAME_ALIASES = {
  'Cape Verde': 'Cabo Verde',
  'South Korea': 'Korea Republic',
  Iran: 'IR Iran',
  'Ivory Coast': "Côte d'Ivoire",
  'Democratic Republic of the Congo': 'Congo DR',
  'DR Congo': 'Congo DR',
  'United States': 'USA',
  Turkey: 'Türkiye',
};

const DATA_DIR = path.join(__dirname, 'data');
const STATS_DIR = path.join(DATA_DIR, 'stats');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const args = { withStats: false, headful: false, ids: null, rebuildAggregatesOnly: false, h2hOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--with-stats') args.withStats = true;
    else if (a === '--headful') args.headful = true;
    else if (a === '--rebuild-aggregates-only') args.rebuildAggregatesOnly = true;
    else if (a === '--h2h-only') args.h2hOnly = true;
    else if (a === '--elo-only') args.eloOnly = true;
    else if (a === '--ids') {
      const v = argv[++i] || '';
      args.ids = v.split(',').map((s) => s.trim()).filter(Boolean).map(Number);
    }
  }
  return args;
}

function log(...msg) {
  process.stderr.write(msg.join(' ') + '\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return sleep(min + Math.random() * (max - min));
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(STATS_DIR, { recursive: true });
}

async function createBrowserContext(headful) {
  const browser = await chromium.launch({ headless: !headful });
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'id-ID',
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['id-ID', 'id', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
  });

  const page = await context.newPage();
  return { browser, context, page };
}

async function warmUpAkamai(page, context) {
  log('[init] opening home page to let Akamai sensor run...');
  try {
    await page.goto(HOME_URL, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    log('[warn] networkidle timeout, continuing anyway (page may keep background polling)...');
  }
  await page.waitForTimeout(4000);

  const cookies = await context.cookies();
  const abck = cookies.find((c) => c.name === '_abck');
  const bmsz = cookies.find((c) => c.name === 'bm_sz');
  const akbmsc = cookies.find((c) => c.name === 'ak_bmsc');

  if (!abck) {
    log('[warn] _abck cookie not found — Akamai sensor may not have run. Endpoints may be challenged.');
  } else {
    log(`[init] Akamai cookies present: _abck=${!!abck} bm_sz=${!!bmsz} ak_bmsc=${!!akbmsc}`);
  }
  return !!abck;
}

async function fetchJsonInPage(page, url) {
  const result = await page.evaluate(async (u) => {
    try {
      const res = await fetch(u, {
        credentials: 'include',
        headers: { accept: 'application/json' },
      });
      const status = res.status;
      const text = await res.text();
      return { status, text };
    } catch (e) {
      return { status: 0, text: '', error: String(e) };
    }
  }, url);

  if (!result || result.status === 0) {
    return { ok: false, reason: result?.error || 'network error' };
  }
  if (result.status < 200 || result.status >= 300) {
    return { ok: false, reason: `http ${result.status}` };
  }
  try {
    const json = JSON.parse(result.text);
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, reason: 'non-json/challenge response' };
  }
}

async function fetchWithRetry(page, url, label) {
  let attempt = await fetchJsonInPage(page, url);
  if (attempt.ok) return attempt;

  log(`[retry] ${label} failed (${attempt.reason}), retrying once...`);
  await sleep(2500 + Math.random() * 1500);
  attempt = await fetchJsonInPage(page, url);
  if (attempt.ok) return attempt;

  log(`[skip] ${label} failed again (${attempt.reason}), skipping.`);
  return attempt;
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { accept: 'application/json', 'user-agent': UA } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('non-json response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

function httpsGetText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { accept: 'text/plain', 'user-agent': UA } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

async function fetchMatches() {
  log('[matches] fetching worldcup26.ir/get/games...');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await httpsGetJson(MATCHES_URL);
      const games = data?.games ?? [];
      const outPath = path.join(DATA_DIR, 'matches.json');
      fs.writeFileSync(outPath, JSON.stringify({ fetchedAt: new Date().toISOString(), games }, null, 2));
      log(`[matches] saved ${games.length} matches -> ${outPath}`);
      return;
    } catch (e) {
      if (attempt === 2) {
        log(`[matches] could not fetch matches: ${e.message} (continuing without match schedule)`);
      } else {
        await sleep(1000);
      }
    }
  }
}

// stadium_id in matches.json (worldcup26.ir/get/games) refers to this same
// source's own venue listing — confirmed by cross-checking id 9 = Gillette
// Stadium, Foxborough, which matches the official bracket reference image.
async function fetchStadiums() {
  log('[stadiums] fetching worldcup26.ir/get/stadiums...');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await httpsGetJson(STADIUMS_URL);
      const stadiums = data?.stadiums ?? [];
      const byId = {};
      for (const s of stadiums) {
        byId[s.id] = { name: s.name_en, city: s.city_en };
      }
      const outPath = path.join(DATA_DIR, 'stadiums.json');
      fs.writeFileSync(outPath, JSON.stringify(byId, null, 2));
      log(`[stadiums] saved ${stadiums.length} stadiums -> ${outPath}`);
      return;
    } catch (e) {
      if (attempt === 2) {
        log(`[stadiums] could not fetch stadiums: ${e.message} (continuing without venue names)`);
      } else {
        await sleep(1000);
      }
    }
  }
}

// inside.fifa.com/data-centre/teams embeds a full list of every FIFA
// national-team association in its Next.js __NEXT_DATA__ payload, keyed by
// the same 3-letter associationId we already store as squads.json's `abbr`
// (e.g. GER, PAR) — so no manual id-collection or fuzzy name matching is
// needed, just an exact abbr lookup.
async function fetchFifaTeamIds() {
  log('[fifa-teams] fetching inside.fifa.com/data-centre/teams...');
  let html;
  try {
    html = await httpsGetText(FIFA_TEAMS_PAGE_URL);
  } catch (e) {
    log(`[fifa-teams] could not fetch teams page: ${e.message}`);
    return null;
  }
  const m = html.match(/__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!m) {
    log('[fifa-teams] __NEXT_DATA__ not found in page, skipping head-to-head fetch.');
    return null;
  }
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch (e) {
    log(`[fifa-teams] failed to parse __NEXT_DATA__: ${e.message}`);
    return null;
  }
  const associations = data?.props?.pageProps?.pageData?.content?.[0]?.associations ?? {};
  const byAbbr = {};
  for (const letter of Object.keys(associations)) {
    for (const team of associations[letter]) {
      byAbbr[team.associationId] = { id: team.id, name: team.name };
    }
  }
  log(`[fifa-teams] parsed ${Object.keys(byAbbr).length} associations.`);
  return byAbbr;
}

function squadByNameForH2H(squads, name) {
  if (!name) return null;
  const direct = squads.find((s) => s.name === name);
  if (direct) return direct;
  const alias = SQUAD_NAME_ALIASES[name];
  return alias ? squads.find((s) => s.name === alias) : null;
}

// Only fetches head-to-head for R32-onward matches where FIFA's own fixture
// feed has already confirmed both teams (home_team_name_en/away_team_name_en
// populated) — group-stage slots are still "Winner Group X" placeholders and
// have no real team to look up yet.
async function fetchHeadToHead() {
  log('[h2h] checking for confirmed R32+ matches...');
  let matches, squads;
  try {
    matches = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'matches.json'), 'utf8'));
    squads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'squads.json'), 'utf8'));
  } catch (e) {
    log(`[h2h] matches.json/squads.json not found, skipping: ${e.message}`);
    return;
  }

  const knockoutTypes = new Set(['r32', 'r16', 'qf', 'sf', 'final', 'third']);
  const confirmed = (matches.games ?? []).filter(
    (g) => knockoutTypes.has(g.type) && g.home_team_name_en && g.away_team_name_en
  );
  if (!confirmed.length) {
    log('[h2h] no confirmed knockout matches yet, skipping.');
    return;
  }

  const teamIds = await fetchFifaTeamIds();
  if (!teamIds) return;

  const outPath = path.join(DATA_DIR, 'head_to_head.json');
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch (e) {
    // no previous file yet, start fresh
  }

  const result = {};
  for (const g of confirmed) {
    // H2H for a finished match won't change — skip if already cached
    if (g.finished === 'TRUE' && existing[g.id]) {
      log(`[h2h] skipping finished match ${g.id} (already cached)`);
      continue;
    }

    const home = squadByNameForH2H(squads, g.home_team_name_en);
    const away = squadByNameForH2H(squads, g.away_team_name_en);
    const fifaA = home && teamIds[home.abbr];
    const fifaB = away && teamIds[away.abbr];
    if (!fifaA || !fifaB) {
      log(`[h2h] skipping match ${g.id}: no FIFA team id for ${g.home_team_name_en} / ${g.away_team_name_en}`);
      continue;
    }

    try {
      const data = await httpsGetJson(FIFA_H2H_URL(fifaA.id, fifaB.id));
      result[g.id] = {
        teamA: { squadId: home.id, abbr: home.abbr, name: home.name, ...data.teamA },
        teamB: { squadId: away.id, abbr: away.abbr, name: away.name, ...data.teamB },
        matches: (data.matchesList ?? []).map((mt) => ({
          date: mt.date,
          competition: mt.competitionName?.description ?? '',
          home: mt.home?.teamName?.description ?? '',
          homeScore: mt.home?.score,
          away: mt.away?.teamName?.description ?? '',
          awayScore: mt.away?.score,
        })),
      };
      log(`[h2h] fetched ${g.home_team_name_en} vs ${g.away_team_name_en} (match ${g.id})`);
    } catch (e) {
      log(`[h2h] failed for match ${g.id} (${g.home_team_name_en} vs ${g.away_team_name_en}): ${e.message}`);
    }
    await sleep(400 + Math.random() * 400);
  }

  const merged = { ...existing, ...result };
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
  log(`[h2h] saved head-to-head for ${Object.keys(merged).length} match(es) -> ${outPath}`);
}

function normTeamName(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

// eloratings.net serves no JSON API — its SPA (scripts/ratings.js) fetches
// plain TSV files client-side and renders them into a slickgrid. We fetch
// the same TSV files directly. Column layouts below were reverse-engineered
// from ratings.js's pushFixtureRow/pushMatchRow functions and confirmed by
// screenshotting the live rendered tables (see project notes) — not guessed.
async function fetchEloData() {
  log('[elo] fetching eloratings.net World Cup 2026 data...');
  let squads;
  try {
    squads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'squads.json'), 'utf8'));
  } catch (e) {
    log(`[elo] squads.json not found, skipping (run players/squads fetch first): ${e.message}`);
    return;
  }

  let teamsTsv, currentTsv, fixturesTsv, resultsTsv;
  try {
    [teamsTsv, currentTsv, fixturesTsv, resultsTsv] = await Promise.all([
      httpsGetText(ELO_TEAMS_URL),
      httpsGetText(ELO_CURRENT_URL),
      httpsGetText(ELO_FIXTURES_URL),
      httpsGetText(ELO_RESULTS_URL),
    ]);
  } catch (e) {
    log(`[elo] could not fetch eloratings.net data: ${e.message} (continuing without Elo data)`);
    return;
  }

  // code -> English team name, e.g. "ES" -> "Spain"
  const eloNameByCode = {};
  for (const line of teamsTsv.split('\n')) {
    const [code, name] = line.split('\t');
    if (code && name) eloNameByCode[code] = name.trim();
  }
  const eloCodeByNormName = {};
  for (const [code, name] of Object.entries(eloNameByCode)) {
    eloCodeByNormName[normTeamName(name)] = code;
  }

  // squadId <-> eloCode, both directions.
  const squadIdToEloCode = {};
  const eloCodeToSquadId = {};
  const unmatchedSquads = [];
  for (const s of squads) {
    const lookupName = ELO_NAME_OVERRIDES[s.name] || s.name;
    const code = eloCodeByNormName[normTeamName(lookupName)];
    if (code) {
      squadIdToEloCode[s.id] = code;
      eloCodeToSquadId[code] = s.id;
    } else {
      unmatchedSquads.push(s.name);
    }
  }
  if (unmatchedSquads.length) {
    log(`[elo] WARNING: could not map ${unmatchedSquads.length} squad(s) to an Elo code: ${unmatchedSquads.join(', ')}`);
  }
  // If eloratings.net's response was unparsable (e.g. blocked/rate-limited
  // from a CI IP and served something other than the expected TSV), every
  // squad fails to map and we'd otherwise happily write an all-empty
  // elo.json over a previously good one. Bail out instead — keep stale data
  // rather than silently destroying it.
  if (Object.keys(squadIdToEloCode).length === 0) {
    log('[elo] ERROR: matched 0/48 squads to an Elo code — eloratings.net likely returned unexpected content. Leaving existing data/elo.json untouched.');
    return;
  }

  // 2026_World_Cup.tsv: rankLocal, rankGlobal, code, rating, ...
  const ratings = {};
  for (const line of currentTsv.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const code = f[2];
    const squadId = eloCodeToSquadId[code];
    if (!squadId) continue;
    ratings[squadId] = {
      eloCode: code,
      rank: Number(f[1]),
      rating: Number(f[3]),
    };
  }

  // 2026_World_Cup_fixtures.tsv: y,m,d,home,away,comp,host,homeRank,awayRank,
  // homeElo,awayElo,homeWinPct,drawChange,win1Home,win1Away,win2Home,win2Away,
  // win3Home,win3Away,win4Home,win4Away,win5Home,win5Away
  const fixtures = [];
  for (const line of fixturesTsv.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const homeCode = f[3], awayCode = f[4];
    const homeSquadId = eloCodeToSquadId[homeCode];
    const awaySquadId = eloCodeToSquadId[awayCode];
    if (!homeSquadId || !awaySquadId) continue;
    const homeWinPct = Number(f[11]);
    fixtures.push({
      date: `${f[0]}-${f[1]}-${f[2]}`,
      hostCountry: f[6],
      homeSquadId, awaySquadId,
      homeEloCode: homeCode, awayEloCode: awayCode,
      homeRank: Number(f[7]) || null, awayRank: Number(f[8]) || null,
      homeRating: Number(f[9]), awayRating: Number(f[10]),
      homeWinPct, awayWinPct: Math.round((100 - homeWinPct) * 10) / 10,
      eloPointsAtStake: {
        draw: Number(f[12]),
        winMargin1: [Number(f[13]), Number(f[14])],
        winMargin2: [Number(f[15]), Number(f[16])],
        winMargin3: [Number(f[17]), Number(f[18])],
        winMargin4: [Number(f[19]), Number(f[20])],
        winMargin5: [Number(f[21]), Number(f[22])],
      },
    });
  }

  // 2026_World_Cup_latest.tsv: y,m,d,home,away,homeScore,awayScore,comp,host,
  // eloChangeHome,homeEloAfter,awayEloAfter,homeRankMove,awayRankMove,
  // homeRankAfter,awayRankAfter
  const results = [];
  for (const line of resultsTsv.split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const homeCode = f[3], awayCode = f[4];
    const homeSquadId = eloCodeToSquadId[homeCode];
    const awaySquadId = eloCodeToSquadId[awayCode];
    if (!homeSquadId || !awaySquadId) continue;
    results.push({
      date: `${f[0]}-${f[1]}-${f[2]}`,
      hostCountry: f[8],
      homeSquadId, awaySquadId,
      homeEloCode: homeCode, awayEloCode: awayCode,
      homeScore: Number(f[5]), awayScore: Number(f[6]),
      eloChangeHome: Number(f[9]),
      homeRatingAfter: Number(f[10]), awayRatingAfter: Number(f[11]),
      homeRankAfter: Number(f[14]) || null, awayRankAfter: Number(f[15]) || null,
    });
  }

  const outPath = path.join(DATA_DIR, 'elo.json');

  // eloratings.net's own fixtures.tsv only lists matches still to be played —
  // once a match finishes it drops out of that feed entirely (moves to
  // results.tsv, which has no pre-match win%). Without this, every match's
  // win-expectancy bar would disappear from the bracket the moment it's
  // played. Preserve previously-captured fixture entries that are no longer
  // in the live feed instead of letting them get silently overwritten.
  let previousFixtures = [];
  try {
    const prevData = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    previousFixtures = Array.isArray(prevData.fixtures) ? prevData.fixtures : [];
  } catch (e) {
    // no previous elo.json yet, nothing to preserve
  }

  function fixtureKey(homeSquadId, awaySquadId, date) {
    const pair = [homeSquadId, awaySquadId].sort((a, b) => a - b).join('-');
    return `${date}_${pair}`;
  }

  const fixtureKeys = new Set(fixtures.map((f) => fixtureKey(f.homeSquadId, f.awaySquadId, f.date)));
  let preservedCount = 0;
  for (const f of previousFixtures) {
    const key = fixtureKey(f.homeSquadId, f.awaySquadId, f.date);
    if (!fixtureKeys.has(key)) {
      fixtures.push(f);
      fixtureKeys.add(key);
      preservedCount++;
    }
  }

  // A match that finished before this caching existed (or was scraped for
  // the very first time after it already finished) has no captured fixture
  // to fall back on either. Reconstruct its pre-match win% from the
  // post-match Elo ratings using eloratings.net's own win-expectancy
  // formula — verified to reproduce their published homeWinPct exactly on
  // several live fixtures: W_e = 1 / (10^(-(ratingHome-ratingAway)/400) + 1).
  let derivedCount = 0;
  for (const r of results) {
    const key = fixtureKey(r.homeSquadId, r.awaySquadId, r.date);
    if (fixtureKeys.has(key)) continue;
    const homeRatingBefore = r.homeRatingAfter - r.eloChangeHome;
    const awayRatingBefore = r.awayRatingAfter + r.eloChangeHome;
    const we = 1 / (Math.pow(10, -(homeRatingBefore - awayRatingBefore) / 400) + 1);
    const homeWinPct = Math.round(we * 1000) / 10;
    fixtures.push({
      date: r.date,
      hostCountry: r.hostCountry,
      homeSquadId: r.homeSquadId, awaySquadId: r.awaySquadId,
      homeEloCode: r.homeEloCode, awayEloCode: r.awayEloCode,
      homeRank: null, awayRank: null,
      homeRating: homeRatingBefore, awayRating: awayRatingBefore,
      homeWinPct, awayWinPct: Math.round((100 - homeWinPct) * 10) / 10,
      eloPointsAtStake: null,
      derived: true,
    });
    fixtureKeys.add(key);
    derivedCount++;
  }

  fs.writeFileSync(outPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: 'eloratings.net (World Football Elo Ratings, 2026 World Cup)',
    squadIdToEloCode,
    ratings,
    fixtures,
    results,
  }, null, 2));
  log(`[elo] saved ${Object.keys(ratings).length} team ratings, ${fixtures.length} fixtures (${preservedCount} preserved, ${derivedCount} derived from results), ${results.length} results -> ${outPath}`);
}

// Polymarket prediction-market odds — a second, independent signal (real
// money, continuously updated) alongside eloratings.net's Elo-based win%,
// used as extra consideration for knockout-stage Best 15 projections.
// gamma-api.polymarket.com needs no auth/key; each of these is one fixed
// multi-outcome event covering all 48 teams for that single tournament
// stage, found by browsing polymarket.com's World Cup 2026 markets.
const POLY_GAMMA = 'https://gamma-api.polymarket.com';
const POLY_CLOB = 'https://clob.polymarket.com';
const POLY_EVENTS = {
  makeR32: 414231,   // "Team to advance to Knockout Stages"
  makeR16: 550029,   // "Nation To Reach Round of 16"
  makeQF: 551766,    // "Nation To Reach Quarterfinals"
  makeSF: 551781,    // "Nation To Reach Semifinals"
  makeFinal: 414457, // "Nation to Reach Final"
  winWC: 30615,      // "World Cup Winner"
};
const POLY_GROUP_WINNER_EVENTS = {
  a: 98252, b: 98263, c: 98264, d: 98266, e: 98271, f: 98272,
  g: 98273, h: 98287, i: 98330, j: 98336, k: 98337, l: 98338,
};

// Polymarket's own question text isn't internally consistent about team
// names (e.g. "DR Congo" in the Round-of-16 event, "Congo DR" in the Winner
// event) — list every variant actually observed, beyond squads.json's name.
const POLY_NAME_ALIASES = {
  'Cape Verde': 'Cabo Verde',
  'South Korea': 'Korea Republic',
  'Iran': 'IR Iran',
  'Ivory Coast': "Côte d'Ivoire",
  'DR Congo': 'Congo DR',
  'United States': 'USA',
};

function buildPolySquadResolver(squads) {
  const byNormName = {};
  for (const s of squads) byNormName[normTeamName(s.name)] = s.id;
  for (const [alias, squadName] of Object.entries(POLY_NAME_ALIASES)) {
    const s = squads.find((x) => x.name === squadName);
    if (s) byNormName[normTeamName(alias)] = s.id;
  }
  return (name) => byNormName[normTeamName(name || '')] ?? null;
}

async function fetchPolyEvent(eventId) {
  return httpsGetJson(`${POLY_GAMMA}/events/${eventId}`);
}

// Each market in these events is a "Will <Team> ...?" Yes/No question;
// groupItemTitle carries the clean team name (or "Other"/"Field" filler,
// which resolveSquad naturally fails to match and we skip).
function extractTeamProbabilities(event, resolveSquad) {
  const out = {};
  for (const m of event?.markets || []) {
    const squadId = resolveSquad(m.groupItemTitle);
    if (!squadId) continue;
    let outcomes, prices;
    try {
      outcomes = JSON.parse(m.outcomes);
      prices = JSON.parse(m.outcomePrices);
    } catch (e) { continue; }
    const yesIdx = outcomes.indexOf('Yes');
    const p = Number(prices[yesIdx >= 0 ? yesIdx : 0]);
    if (Number.isFinite(p)) out[squadId] = p;
  }
  return out;
}

async function fetchPolymarketData() {
  log('[polymarket] fetching gamma-api.polymarket.com World Cup odds...');
  let squads;
  try {
    squads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'squads.json'), 'utf8'));
  } catch (e) {
    log(`[polymarket] squads.json not found, skipping (run players/squads fetch first): ${e.message}`);
    return;
  }
  const resolveSquad = buildPolySquadResolver(squads);

  let stageEvents, winnerEvent, groupEvents;
  try {
    const stageKeys = Object.keys(POLY_EVENTS).filter((k) => k !== 'winWC');
    const [stageResults, winner, groupResults] = await Promise.all([
      Promise.all(stageKeys.map((k) => fetchPolyEvent(POLY_EVENTS[k]))),
      fetchPolyEvent(POLY_EVENTS.winWC),
      Promise.all(Object.values(POLY_GROUP_WINNER_EVENTS).map((id) => fetchPolyEvent(id))),
    ]);
    stageEvents = Object.fromEntries(stageKeys.map((k, i) => [k, stageResults[i]]));
    winnerEvent = winner;
    groupEvents = Object.fromEntries(Object.keys(POLY_GROUP_WINNER_EVENTS).map((g, i) => [g, groupResults[i]]));
  } catch (e) {
    log(`[polymarket] could not fetch event data: ${e.message} (continuing without market odds)`);
    return;
  }

  const teams = {};
  function applyProb(stageKey, event) {
    for (const [squadId, p] of Object.entries(extractTeamProbabilities(event, resolveSquad))) {
      teams[squadId] = teams[squadId] || {};
      teams[squadId][stageKey] = p;
    }
  }
  for (const [stageKey, event] of Object.entries(stageEvents)) applyProb(stageKey, event);
  applyProb('winWC', winnerEvent);
  for (const [group, event] of Object.entries(groupEvents)) {
    for (const [squadId, p] of Object.entries(extractTeamProbabilities(event, resolveSquad))) {
      teams[squadId] = teams[squadId] || {};
      teams[squadId].winGroup = p;
      teams[squadId].group = group;
    }
  }

  const matched = Object.keys(teams).length;
  if (matched === 0) {
    log('[polymarket] ERROR: matched 0 squads to Polymarket markets — leaving existing data/polymarket.json untouched.');
    return;
  }

  // Historical "win World Cup" daily price series, top 8 contenders only —
  // keeps the file small instead of pulling ~1 year of history for all 48
  // teams (most of which are already mathematically at 0%).
  const topSquadIds = Object.entries(teams)
    .filter(([, t]) => t.winWC != null)
    .sort((a, b) => b[1].winWC - a[1].winWC)
    .slice(0, 8)
    .map(([id]) => id);

  const winnerTokenBySquadId = {};
  for (const m of winnerEvent.markets || []) {
    const squadId = resolveSquad(m.groupItemTitle);
    if (!squadId) continue;
    try {
      winnerTokenBySquadId[squadId] = JSON.parse(m.clobTokenIds)[0]; // "Yes" token
    } catch (e) { /* skip unparsable */ }
  }

  const history = {};
  for (const squadId of topSquadIds) {
    const token = winnerTokenBySquadId[squadId];
    if (!token) continue;
    try {
      const hist = await httpsGetJson(`${POLY_CLOB}/prices-history?market=${token}&interval=max&fidelity=1440`);
      history[squadId] = (hist?.history || []).map((pt) => ({ t: pt.t, p: pt.p }));
    } catch (e) {
      log(`[polymarket] could not fetch price history for squad ${squadId}: ${e.message}`);
    }
    await sleep(150);
  }

  const outPath = path.join(DATA_DIR, 'polymarket.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: 'Polymarket (gamma-api.polymarket.com) — aggregated prediction-market odds, not an official forecast',
    teams,
    history,
  }, null, 2));
  log(`[polymarket] saved odds for ${matched} teams, price history for ${Object.keys(history).length} teams -> ${outPath}`);
}

async function fetchRounds() {
  log('[rounds] fetching rounds.json (FIFA official fixtures)...');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await httpsGetJson(ROUNDS_URL);
      const outPath = path.join(DATA_DIR, 'rounds.json');
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      const tournamentCount = (Array.isArray(data) ? data : []).reduce((sum, r) => sum + (r.tournaments?.length || 0), 0);
      log(`[rounds] saved ${Array.isArray(data) ? data.length : 0} rounds (${tournamentCount} tournaments) -> ${outPath}`);
      return true;
    } catch (e) {
      if (attempt === 2) {
        log(`[rounds] could not fetch rounds.json directly: ${e.message}, will retry via browser context...`);
      } else {
        await sleep(1000);
      }
    }
  }
  return false;
}

async function fetchRoundsViaPage(page) {
  const result = await fetchWithRetry(page, ROUNDS_URL, 'rounds.json');
  if (!result.ok) {
    log(`[rounds] could not fetch rounds.json: ${result.reason} (continuing without official fixtures)`);
    return;
  }
  const outPath = path.join(DATA_DIR, 'rounds.json');
  fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2));
  const tournamentCount = (Array.isArray(result.data) ? result.data : []).reduce((sum, r) => sum + (r.tournaments?.length || 0), 0);
  log(`[rounds] saved ${Array.isArray(result.data) ? result.data.length : 0} rounds (${tournamentCount} tournaments) -> ${outPath}`);
}

async function fetchSquads(page) {
  log('[squads] fetching squads.json...');
  const result = await fetchWithRetry(page, SQUADS_URL, 'squads.json');
  if (!result.ok) {
    log(`[squads] could not fetch squads.json: ${result.reason} (continuing without team names)`);
    return;
  }
  const outPath = path.join(DATA_DIR, 'squads.json');
  fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2));
  log(`[squads] saved ${result.data.length} squads -> ${outPath}`);
}

async function fetchPlayers(page) {
  log('[players] fetching players.json...');
  const result = await fetchWithRetry(page, PLAYERS_URL, 'players.json');
  if (!result.ok) {
    throw new Error(`Could not fetch players.json: ${result.reason}`);
  }
  const outPath = path.join(DATA_DIR, 'players.json');
  fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2));
  log(`[players] saved ${result.data.length} players -> ${outPath}`);
  return result.data;
}

// Sums per-round stat codes (GS, CS, T, CC, ST, AS, S, ...) across every
// round file in data/stats/ into one compact file. players.json only has
// FIFA's own pre-aggregated totalPoints/avgPoints/form — goals, clean
// sheets, tackles, etc. only exist per-round in the 1488 individual stats
// files, so this is computed once here instead of fetching all of them
// client-side on every dashboard page load.
function buildAggregates() {
  if (!fs.existsSync(STATS_DIR)) {
    log('[aggregates] no data/stats/ directory yet, skipping.');
    return;
  }
  const files = fs.readdirSync(STATS_DIR).filter((f) => f.endsWith('.json'));
  if (!files.length) {
    log('[aggregates] no stats files found, skipping.');
    return;
  }

  const aggregates = {};
  for (const file of files) {
    const id = Number(file.replace(/\.json$/, ''));
    if (!Number.isFinite(id)) continue;
    let rounds;
    try {
      rounds = JSON.parse(fs.readFileSync(path.join(STATS_DIR, file), 'utf8'));
    } catch (e) {
      continue;
    }
    if (!Array.isArray(rounds) || !rounds.length) continue;

    const sum = {
      GS: 0, CS: 0, AS: 0, T: 0, CC: 0, ST: 0, S: 0, YC: 0, RC: 0, OG: 0, PW: 0, PC: 0, PS: 0, MP: 0, FK: 0, SXI: 0,
      roundsPlayed: 0, startedCount: 0, suspendedNextMatch: false, recentFormPoints: null,
    };

    // FIFA's source data needs to be processed in chronological round order
    // for the rotation/suspension simulation below — files aren't always
    // already sorted that way.
    const sortedRounds = rounds.slice().sort((a, b) => (a?.roundId ?? 0) - (b?.roundId ?? 0));

    // Simulates the FIFA disciplinary rule (auto one-match ban on a 2nd
    // yellow card, counter resets once that ban is served) round by round,
    // so the *final* state reflects whether the player is suspended
    // entering whatever round comes next — used to exclude them from next-
    // round Best 15 pools entirely rather than just scoring them lower.
    let cardCount = 0;
    const playedPoints = []; // chronological points for rounds actually played (MP > 0)
    for (const r of sortedRounds) {
      const s = r?.stats ?? {};
      sum.GS += s.GS ?? 0;
      sum.CS += s.CS ?? 0;
      sum.AS += s.AS ?? 0;
      sum.T += s.T ?? 0;
      sum.CC += s.CC ?? 0;
      sum.ST += s.ST ?? 0;
      sum.S += s.S ?? 0;
      sum.YC += s.YC ?? 0;
      sum.RC += s.RC ?? 0;
      sum.OG += s.OG ?? 0;
      sum.PW += s.PW ?? 0;
      sum.PC += s.PC ?? 0;
      sum.PS += s.PS ?? 0;
      sum.MP += s.MP ?? 0;
      sum.FK += s.FK ?? 0;
      sum.SXI += s.SXI ?? 0;
      if ((s.MP ?? 0) > 0) {
        sum.roundsPlayed += 1;
        playedPoints.push(r.points ?? 0);
      }
      // FIFA's own SXI stat code is never populated (always 0 — same gap
      // documented on the dashboard), so minutes >= 60 is used as the
      // "started / heavily involved" proxy for rotation-risk instead.
      if ((s.MP ?? 0) >= 60) sum.startedCount += 1;

      cardCount += s.YC ?? 0;
      if (cardCount >= 2) {
        sum.suspendedNextMatch = true;
        cardCount = 0; // ban served — counter resets toward the next threshold
      } else {
        sum.suspendedNextMatch = false;
      }
    }

    // Recency-weighted form for the most recently played rounds (60/40 split
    // on the last two), so a player heating up or cooling off in their last
    // couple of matches moves the projection faster than the season-long
    // avgPoints from players.json does.
    if (playedPoints.length >= 2) {
      const last = playedPoints[playedPoints.length - 1];
      const prev = playedPoints[playedPoints.length - 2];
      sum.recentFormPoints = Math.round((last * 0.6 + prev * 0.4) * 10) / 10;
    } else if (playedPoints.length === 1) {
      sum.recentFormPoints = playedPoints[0];
    }

    aggregates[id] = sum;
  }

  const outPath = path.join(DATA_DIR, 'player_aggregates.json');
  fs.writeFileSync(outPath, JSON.stringify(aggregates, null, 2));
  log(`[aggregates] saved aggregates for ${Object.keys(aggregates).length} players -> ${outPath}`);
}

// Once the group stage ends, an eliminated team's players never score
// another point — scraping all ~1500 players' stats every run wastes most
// of those calls on teams that are already out. This narrows --with-stats'
// default target to only squads still alive: the 32 R32 participants while
// that round is in progress, then automatically tightening to the 16 R16
// participants the moment every R32 match has a confirmed winner. Returns
// null (meaning "no filter, scrape everyone") while the group stage is
// still in progress and r32 slots aren't all resolved to real teams yet.
function resolveActiveSquadIds(squads) {
  let matches;
  try {
    matches = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'matches.json'), 'utf8')).games || [];
  } catch (e) {
    return null;
  }
  const r32Games = matches.filter((g) => g.type === 'r32');

  const r32SquadIds = new Set();
  for (const g of r32Games) {
    const home = squadByNameForH2H(squads, g.home_team_name_en);
    const away = squadByNameForH2H(squads, g.away_team_name_en);
    if (home) r32SquadIds.add(home.id);
    if (away) away && r32SquadIds.add(away.id);
  }
  if (r32SquadIds.size < 32) return null; // group stage not fully resolved yet

  const allR32Finished = r32Games.length > 0 && r32Games.every((g) => g.finished === 'TRUE');
  if (!allR32Finished) return r32SquadIds;

  // R32 fully decided -> narrow further to the 16 confirmed R16 teams.
  const r16SquadIds = new Set();
  for (const g of r32Games) {
    const homeScore = Number(g.home_score);
    const awayScore = Number(g.away_score);
    let winnerName = null;
    if (homeScore !== awayScore) {
      winnerName = homeScore > awayScore ? g.home_team_name_en : g.away_team_name_en;
    } else {
      const homePen = Number(g.home_penalty_score);
      const awayPen = Number(g.away_penalty_score);
      if (Number.isFinite(homePen) && Number.isFinite(awayPen) && homePen !== awayPen) {
        winnerName = homePen > awayPen ? g.home_team_name_en : g.away_team_name_en;
      }
    }
    const winner = squadByNameForH2H(squads, winnerName);
    if (winner) r16SquadIds.add(winner.id);
  }
  return r16SquadIds.size === 16 ? r16SquadIds : r32SquadIds;
}

async function fetchStatsForIds(page, ids) {
  const concurrency = 3;
  let cursor = 0;
  let done = 0;
  const total = ids.length;

  async function worker() {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx];
      const result = await fetchWithRetry(page, STATS_URL(id), `player_stats/${id}.json`);
      done++;
      if (result.ok) {
        const outPath = path.join(STATS_DIR, `${id}.json`);
        fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2));
        log(`[${done}/${total}] fetched player ${id}`);
      } else {
        log(`[${done}/${total}] FAILED player ${id}: ${result.reason}`);
      }
      await randomDelay(300, 800);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, ids.length) }, () => worker());
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDirs();

  // Recomputes data/player_aggregates.json (rotation/suspension/recent-form
  // fields) from the existing data/stats/ files only — no network calls.
  // Useful after changing buildAggregates()'s logic without re-scraping.
  if (args.rebuildAggregatesOnly) {
    buildAggregates();
    return;
  }

  // Refetches data/head_to_head.json only — no other network calls. Useful
  // for picking up newly confirmed knockout fixtures without a full rescrape.
  if (args.h2hOnly) {
    await fetchHeadToHead();
    return;
  }

  // Refetches data/elo.json only — no other network calls. Useful for
  // picking up newly-finished matches' results without a full rescrape.
  if (args.eloOnly) {
    await fetchEloData();
    return;
  }

  await fetchMatches();
  await fetchStadiums();
  await fetchEloData();
  await fetchPolymarketData();
  await fetchHeadToHead();
  const roundsFetched = await fetchRounds();

  let headful = args.headful;
  let players;
  let browser, context, page;
  let abckPresent = false;

  for (let pass = 0; pass < 2; pass++) {
    ({ browser, context, page } = await createBrowserContext(headful));
    abckPresent = await warmUpAkamai(page, context);

    if (!abckPresent && pass === 0 && !headful) {
      log('[fallback] no _abck cookie in headless mode, retrying with --headful behavior (headed browser)...');
      await browser.close();
      headful = true;
      continue;
    }
    break;
  }

  try {
    if (!roundsFetched) {
      await fetchRoundsViaPage(page);
    }
    await fetchSquads(page);
    players = await fetchPlayers(page);
  } catch (e) {
    log(`[fatal] ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  if (args.withStats) {
    let targetIds;
    if (args.ids && args.ids.length) {
      targetIds = args.ids;
    } else {
      let squads = [];
      try {
        squads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'squads.json'), 'utf8'));
      } catch (e) {
        log(`[stats] squads.json not found, scraping all players: ${e.message}`);
      }
      const activeSquadIds = resolveActiveSquadIds(squads);
      if (activeSquadIds) {
        targetIds = players.filter((p) => activeSquadIds.has(p.squadId)).map((p) => p.id);
        log(`[stats] narrowed to ${activeSquadIds.size} active squad(s) (${targetIds.length}/${players.length} players)`);
      } else {
        targetIds = players.map((p) => p.id);
      }
    }
    log(`[stats] fetching stats for ${targetIds.length} player(s)...`);
    await fetchStatsForIds(page, targetIds);
  } else if (args.ids && args.ids.length) {
    log('[info] --ids given without --with-stats; players.json already contains full list, no stats fetched.');
  }

  await browser.close();

  buildAggregates();

  const syncMeta = {
    lastSync: new Date().toISOString(),
    playersCount: players ? players.length : null,
    withStats: !!args.withStats,
  };
  fs.writeFileSync(path.join(DATA_DIR, 'sync_meta.json'), JSON.stringify(syncMeta, null, 2));
  log(`[sync_meta] saved lastSync=${syncMeta.lastSync}`);

  log('[done] scrape complete.');
}

main().catch((e) => {
  log(`[fatal] unhandled error: ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
