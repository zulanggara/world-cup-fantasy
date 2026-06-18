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

const DATA_DIR = path.join(__dirname, 'data');
const STATS_DIR = path.join(DATA_DIR, 'stats');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const args = { withStats: false, headful: false, ids: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--with-stats') args.withStats = true;
    else if (a === '--headful') args.headful = true;
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

    const sum = { GS: 0, CS: 0, AS: 0, T: 0, CC: 0, ST: 0, S: 0, YC: 0, RC: 0, OG: 0, PW: 0, PC: 0, PS: 0, MP: 0, roundsPlayed: 0 };
    for (const r of rounds) {
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
      if ((s.MP ?? 0) > 0) sum.roundsPlayed += 1;
    }
    aggregates[id] = sum;
  }

  const outPath = path.join(DATA_DIR, 'player_aggregates.json');
  fs.writeFileSync(outPath, JSON.stringify(aggregates, null, 2));
  log(`[aggregates] saved aggregates for ${Object.keys(aggregates).length} players -> ${outPath}`);
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

  await fetchMatches();
  await fetchStadiums();
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
      targetIds = players.map((p) => p.id);
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
