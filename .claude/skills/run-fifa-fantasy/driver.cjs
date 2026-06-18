#!/usr/bin/env node
// Driver for the fifa-fantasy static viewer. Starts `npx serve .`, drives every
// page with Playwright headless Chromium, exercises one real interaction per
// page, screenshots, and reports console errors. See SKILL.md one level up.
'use strict';

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // fifa-fantasy/
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PID_FILE = path.join(__dirname, '.serve.pid');

function log(...args) {
  process.stderr.write(args.join(' ') + '\n');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function portIsUp(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function startServer() {
  if (await portIsUp(PORT)) {
    log(`[serve] port ${PORT} already up, reusing it`);
    return null;
  }
  log(`[serve] launching "npx serve . -p ${PORT}" in ${ROOT}`);
  const child = spawn('npx', ['serve', '.', '-p', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
    detached: true,
  });
  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await portIsUp(PORT)) {
      log(`[serve] up after ${30000 - (deadline - Date.now())}ms, pid ${child.pid}`);
      return child.pid;
    }
    await sleep(500);
  }
  throw new Error(`server did not come up on port ${PORT} within 30s`);
}

function stopServer() {
  if (!fs.existsSync(PID_FILE)) {
    log('[serve] no pid file, nothing to stop');
    return;
  }
  const pid = Number(fs.readFileSync(PID_FILE, 'utf8').trim());
  try {
    process.kill(pid);
    log(`[serve] killed pid ${pid}`);
  } catch (e) {
    log(`[serve] kill failed (already dead?): ${e.message}`);
  }
  fs.unlinkSync(PID_FILE);
}

// One real interaction per page, proving the JS actually runs (not just that
// the HTML shell loads).
const PAGES = [
  {
    path: 'index.html',
    name: 'index',
    async interact(page) {
      await page.waitForSelector('tbody tr.player-row', { timeout: 10000 });
      const rowsBefore = await page.locator('tbody tr.player-row').count();
      await page.fill('#search', 'Messi');
      await page.waitForTimeout(300);
      const rowsAfter = await page.locator('tbody tr.player-row').count();
      await page.locator('tbody tr.player-row').first().click();
      await page.waitForTimeout(800);
      const detailVisible = await page.locator('tr.detail-row .detail-inner').count();
      return { rowsBefore, rowsAfterSearch: rowsAfter, detailExpanded: detailVisible > 0 };
    },
  },
  {
    path: 'best-xi.html',
    name: 'best-xi',
    async interact(page) {
      await page.waitForSelector('.player-chip', { timeout: 10000 });
      const chipsBefore = await page.locator('.player-chip').count();
      await page.click('.variant-tab[data-key="value"]');
      await page.waitForTimeout(400);
      const badge = await page.locator('.budget-badge').first().textContent();
      return { chipsBefore, valueVariantBadge: badge?.trim() };
    },
  },
  {
    path: 'best15-overall.html',
    name: 'best15-overall',
    async interact(page) {
      await page.waitForSelector('.player-chip', { timeout: 10000 });
      const chips = await page.locator('.player-chip').count();
      const badge = await page.locator('.budget-badge').first().textContent();
      return { chips, defaultBudgetBadge: badge?.trim() };
    },
  },
  {
    path: 'best15-next-round.html',
    name: 'best15-next-round',
    async interact(page) {
      await page.waitForSelector('.player-chip', { timeout: 10000 });
      await page.selectOption('#mdSelect', '0');
      await page.waitForTimeout(500);
      const chips = await page.locator('.player-chip').count();
      return { chipsAfterMD1: chips };
    },
  },
  {
    path: 'best15-research.html',
    name: 'best15-research',
    async interact(page) {
      await page.waitForSelector('.player-chip', { timeout: 10000 });
      const chips = await page.locator('.player-chip').count();
      const gapNote = await page.locator('#gapNote').textContent();
      return { chips, gapNote: gapNote?.trim().slice(0, 120) };
    },
  },
  {
    path: 'groups.html',
    name: 'groups',
    async interact(page) {
      await page.waitForSelector('.group-card', { timeout: 10000 });
      const groupCards = await page.locator('.group-card').count();
      const fixtureRows = await page.locator('#fixturesBody tr').count();
      return { groupCards, fixtureRows };
    },
  },
  {
    path: 'copilot.html',
    name: 'copilot',
    async interact(page) {
      await page.waitForSelector('#stageLimitsBody tr', { timeout: 10000 });
      const stageRows = await page.locator('#stageLimitsBody tr').count();
      const current = await page.locator('#stageLimitsBody tr.current').textContent();
      return { stageRows, currentStage: current?.trim().replace(/\s+/g, ' ') };
    },
  },
];

async function runSmoke() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await startServer();

  const browser = await chromium.launch();
  const results = [];

  for (const def of PAGES) {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    const url = `${BASE_URL}/${def.path}`;
    let interactionResult = null;
    let error = null;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      interactionResult = await def.interact(page);
    } catch (e) {
      error = e.message;
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, `${def.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    results.push({
      page: def.path,
      ok: !error && consoleErrors.length === 0,
      interaction: interactionResult,
      consoleErrors,
      error,
      screenshot: path.relative(ROOT, screenshotPath),
    });

    await page.close();
  }

  await browser.close();

  const allOk = results.every((r) => r.ok);
  console.log(JSON.stringify({ allOk, results }, null, 2));
  if (!allOk) process.exitCode = 1;
}

async function runShot(targetPath) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/${targetPath}`, { waitUntil: 'networkidle', timeout: 20000 });
  const name = targetPath.replace(/[^a-z0-9.-]/gi, '_');
  const out = path.join(SCREENSHOT_DIR, `adhoc-${name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log(JSON.stringify({ screenshot: path.relative(ROOT, out) }, null, 2));
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'serve') {
    await startServer();
    console.log(JSON.stringify({ baseUrl: BASE_URL }));
  } else if (cmd === 'stop') {
    stopServer();
  } else if (cmd === 'smoke') {
    await runSmoke();
  } else if (cmd === 'shot') {
    if (!arg) throw new Error('usage: driver.cjs shot <page.html>');
    await runShot(arg);
  } else {
    console.error('usage: driver.cjs <serve|stop|smoke|shot <page.html>>');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.stack || String(e));
  process.exitCode = 1;
});
