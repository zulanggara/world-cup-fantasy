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
  log('[done] scrape complete.');
}

main().catch((e) => {
  log(`[fatal] unhandled error: ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
