---
name: run-fifa-fantasy
description: Build, serve, and drive the fifa-fantasy static viewer (7-page HTML/JS app). Use when asked to run fifa-fantasy, start its server, screenshot any of its pages (player table, compare-tim, best-15 variants, klasemen, copilot), or verify a UI change actually renders.
---

This is a static, no-build HTML/CSS/vanilla-JS app (7 pages: `index.html`,
`best-xi.html`, `best15-overall.html`, `best15-next-round.html`,
`best15-research.html`, `groups.html`, `copilot.html`) that reads local JSON
from `data/`. It cannot be opened via `file://` (the pages `fetch()` local
JSON, which the browser blocks under `file://`) — it must be served over
HTTP. Drive it via Playwright headless Chromium through
`.claude/skills/run-fifa-fantasy/driver.cjs`, which also owns starting and
stopping the static server.

All paths below are relative to `fifa-fantasy/` (this unit's root).

## Prerequisites

Verified on macOS (Darwin arm64) in this session — no OS packages needed
beyond Node.js. Playwright's bundled Chromium must be downloaded once:

```bash
npm install
npx playwright install chromium
```

(`npx playwright install chromium` is a one-time ~170MB download into
`~/Library/Caches/ms-playwright/` on macOS / `~/.cache/ms-playwright/` on
Linux. The driver does not re-download it — if it's missing, Playwright's
`chromium.launch()` will fail with a clear "executable doesn't exist" error
telling you to run this command.)

## Build

No build step. The HTML files are served as-is.

## Run (agent path)

The driver (`driver.cjs`, CommonJS — note the project's `package.json` has
`"type": "commonjs"`, so it is **not** `.mjs`) owns the whole loop: start
`npx serve .` on port 4173, open each page with Playwright, run one real
interaction per page, screenshot, check console errors, stop the server.

```bash
cd fifa-fantasy
node .claude/skills/run-fifa-fantasy/driver.cjs smoke
```

This is the command that was actually run to verify this skill (see
Troubleshooting for the one-line fix it took to get there). Sample output
from this session:

```json
{
  "allOk": true,
  "results": [
    { "page": "index.html", "ok": true,
      "interaction": { "rowsBefore": 50, "rowsAfterSearch": 1, "detailExpanded": true },
      "consoleErrors": [], "screenshot": ".claude/skills/run-fifa-fantasy/screenshots/index.png" },
    { "page": "groups.html", "ok": true,
      "interaction": { "groupCards": 12, "fixtureRows": 48 },
      "consoleErrors": [], "screenshot": ".claude/skills/run-fifa-fantasy/screenshots/groups.png" }
  ]
}
```

(Full output has all 7 pages; truncated here.) `allOk: false` or a non-zero
exit code means a page either threw a console error or its interaction
assertion failed — read the `error`/`consoleErrors` field for that page.

Screenshots land in `.claude/skills/run-fifa-fantasy/screenshots/<page-name>.png`,
overwritten each run. **Actually look at them** (e.g. via the Read tool) —
`allOk: true` only proves no JS exception fired, not that the layout looks
right.

| driver command | what it does |
|---|---|
| `node driver.cjs serve` | starts `npx serve . -p 4173` in the background if not already up, prints `{"baseUrl": "..."}`, returns immediately |
| `node driver.cjs stop` | kills the server the driver started (reads `.serve.pid` next to the driver) |
| `node driver.cjs smoke` | full loop: serve → visit all 7 pages → interact → screenshot → report JSON → **leaves the server running** (call `stop` after) |
| `node driver.cjs shot <page.html>` | serve (or reuse) → screenshot one page → `.claude/skills/run-fifa-fantasy/screenshots/adhoc-<page>.png` |

For ad hoc debugging of one page instead of the full suite:

```bash
node .claude/skills/run-fifa-fantasy/driver.cjs shot best15-research.html
node .claude/skills/run-fifa-fantasy/driver.cjs stop   # clean up when done
```

`smoke` and `shot` both call `startServer()` internally, which reuses an
already-running server on port 4173 instead of double-launching — safe to
call repeatedly without `stop` in between, but call `stop` when you're
actually finished so the port is free for the next run.

## Run (human path)

```bash
npx serve .
# open http://localhost:3000 (or whatever port it prints) in a real browser
# Ctrl-C to stop
```

Note `npx serve .` with no `-p` picks an arbitrary free port (usually 3000)
and prints it — the driver pins `-p 4173` instead so it can poll a known
port.

## Test

No automated test suite (`package.json` has no `test` script). The `smoke`
driver command above is the closest equivalent — it's what catches a
regression before commit.

## Gotchas

- **`driver.mjs` would have been wrong.** This project's `package.json`
  declares `"type": "commonjs"`, but the obvious file name for a
  standalone script is `.mjs`. Node treats `.mjs` as ESM unconditionally
  regardless of `package.json`, so a `.mjs` file using `require()` throws
  `ReferenceError: require is not defined in ES module scope`. Fixed by
  naming it `driver.cjs` instead, which forces CommonJS regardless of the
  nearest `package.json`.
- **`file://` won't work, ever.** Every page does `fetch('data/players.json')`
  etc. Opening any `.html` file directly in a browser (or via Playwright's
  `page.goto('file://...')`) gets a CORS error on the fetch and the page
  renders its "Gagal memuat data" empty-state instead of content. This is
  why the driver always goes through an HTTP server.
- **`npx serve .` with no `-p` is non-deterministic** about which port it
  picks if 3000 is busy (it'll try 3000, then 3001, ...). The driver avoids
  this entirely by pinning `-p 4173` and polling that exact port instead of
  scraping stdout for whichever port got chosen.
- **One page (`best15-research.html`) depends on data freshness.** Its
  `interact()` reads `#gapNote`, whose text changes based on how many teams
  in `data/matches.json` haven't played their first match yet (0 right now
  in this dataset → "Semua pemain berhasil dipetakan..."). That's expected
  drift, not a bug — don't treat a different gapNote string as a failure.

## Troubleshooting

- **`Error: browserType.launch: Executable doesn't exist at .../chromium-*/...`**:
  Playwright's browser binary was never downloaded. Run
  `npx playwright install chromium` (see Prerequisites).
- **`Error: listen EADDRINUSE: address already in use :::4173`** when calling
  `driver.cjs serve` or `smoke` directly after a previous run that wasn't
  `stop`ped: the driver's own `portIsUp()` check should make this a no-op
  (it reuses the live server) — if you still see this, a *different*
  process is squatting on 4173; find it with `lsof -i :4173` and kill it,
  or change `PORT` at the top of `driver.cjs`.
- **`smoke` reports `ok: false` with `consoleErrors` mentioning `HTTP 404`
  for one specific page**: check that the corresponding `data/*.json` file
  actually exists (e.g. `best15-research.html` needs `data/matches.json`
  and `data/team_name_map.json`, `copilot.html` needs `data/rounds.json`) —
  run `node scraper.js` from `fifa-fantasy/` to (re)generate them.
