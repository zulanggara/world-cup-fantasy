// Shared player/team detail modal, used by every fifa-fantasy page.
// Usage: <script src="detail-modal.js"></script>, then DetailModal.openPlayer(id) / DetailModal.openTeam(squadId).
window.DetailModal = (function () {
  const STAT_LABELS = {
    SXI: 'Starting XI', MP: 'Minutes Played', AS: 'Assists', YC: 'Yellow Card',
    RC: 'Red Card', OG: 'Own Goal', PW: 'Penalty Won', PC: 'Penalty Conceded',
    CS: 'Clean Sheet', GS: 'Goals Scored', GC: 'Goals Conceded', PS: 'Penalty Saved',
    T: 'Tackles', CC: 'Chances Created', ST: 'Shots on Target', FK: 'Free Kicks',
    S: 'Saves', SB: 'Substitute',
  };
  const GOAL_POINTS = { GK: 9, DEF: 7, MID: 6, FWD: 5 };
  const CLEAN_SHEET_POINTS = { GK: 5, DEF: 5, MID: 1, FWD: 0 };

  function calcOfficialPoints(position, s) {
    const MP = s?.MP ?? 0, AS = s?.AS ?? 0, YC = s?.YC ?? 0, RC = s?.RC ?? 0, OG = s?.OG ?? 0,
          PW = s?.PW ?? 0, PC = s?.PC ?? 0, CS = s?.CS ?? 0, GS = s?.GS ?? 0, GC = s?.GC ?? 0,
          PS = s?.PS ?? 0, T = s?.T ?? 0, CC = s?.CC ?? 0, ST = s?.ST ?? 0, FK = s?.FK ?? 0, S = s?.S ?? 0;
    const breakdown = [];
    let total = 0;
    function add(label, value) { if (value) { total += value; breakdown.push({ label, value }); } }
    if (MP > 0) add('Appearance (≤60 min)', 1);
    if (MP >= 60) add('Appearance (60+ min)', 1);
    add('Assist', AS * 3);
    add('Yellow Card', YC * -1);
    add('Red Card', RC * -2);
    add('Own Goal', OG * -2);
    add('Winning a Penalty', PW * 2);
    add('Conceding a Penalty', PC * -1);
    add('Goal from Direct Free-Kick (bonus)', FK * 1);
    add('Goal Scored', GS * (GOAL_POINTS[position] ?? 0));
    add('Clean Sheet', CS * (CLEAN_SHEET_POINTS[position] ?? 0));
    if (position === 'GK' || position === 'DEF') add('Goals Conceded (each beyond 1st)', GC > 0 ? -(GC - 1) : 0);
    if (position === 'GK') { add('Penalty Save', PS * 3); add('Saves Bonus (every 3)', Math.floor(S / 3) * 1); }
    if (position === 'MID') { add('Tackles Bonus (every 3)', Math.floor(T / 3) * 1); add('Chances Created Bonus (every 2)', Math.floor(CC / 2) * 1); }
    if (position === 'FWD') add('Shots on Target Bonus (every 2)', Math.floor(ST / 2) * 1);
    return { total, breakdown };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }


  function tt(key, fallback) {
    return window.I18N ? window.I18N.t(key, fallback) : fallback;
  }

  function formatWIB(iso, opts) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', ...opts }) + ' WIB';
  }

  // ---- lazy cached data loading ----
  const cache = { players: null, squads: null, rounds: null, elo: null, stats: new Map() };

  async function loadPlayers() {
    if (!cache.players) {
      const res = await fetch('data/players.json');
      cache.players = res.ok ? await res.json() : [];
    }
    return cache.players;
  }
  async function loadSquads() {
    if (!cache.squads) {
      const res = await fetch('data/squads.json');
      cache.squads = res.ok ? await res.json() : [];
    }
    return cache.squads;
  }
  async function loadRounds() {
    if (!cache.rounds) {
      try {
        const res = await fetch('data/rounds.json');
        cache.rounds = res.ok ? await res.json() : [];
      } catch (e) {
        cache.rounds = [];
      }
    }
    return cache.rounds;
  }
  async function loadElo() {
    if (!cache.elo) {
      try {
        const res = await fetch('data/elo.json');
        cache.elo = res.ok ? await res.json() : { ratings: {}, fixtures: {} };
      } catch (e) {
        cache.elo = { ratings: {}, fixtures: {} };
      }
    }
    return cache.elo;
  }
  async function loadStats(id) {
    if (!cache.stats.has(id)) {
      try {
        const res = await fetch(`data/stats/${id}.json`);
        cache.stats.set(id, res.ok ? await res.json() : []);
      } catch (e) {
        cache.stats.set(id, []);
      }
    }
    return cache.stats.get(id);
  }

  function allTournaments(rounds) {
    return (Array.isArray(rounds) ? rounds : []).flatMap((r) => r.tournaments || []);
  }

  function playerName(p) {
    return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.knownName || `#${p?.id ?? '?'}`;
  }

  function squadAbbr(squads, squadId) {
    return squads.find((s) => s.id === squadId)?.abbr ?? '?';
  }

  function flag(abbr) {
    return window.FLAGS ? window.FLAGS.flagFor(abbr) : '⚽';
  }

  // Match an eloratings.net fixture to a real-world match by team pair +
  // calendar day — the two sources share no common match id, and
  // eloratings.net's date is the host-country local calendar day, which can
  // differ by ±1 day from rounds.json's fixed +01:00 ISO timestamp for
  // late-night kickoffs.
  function nearbyDays(isoDate) {
    const base = new Date(isoDate.slice(0, 10) + 'T00:00:00Z');
    return [-1, 0, 1].map((offset) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + offset);
      return d.toISOString().slice(0, 10);
    });
  }

  function findEloFixture(elo, squadId, opponentId, isoDate) {
    if (!isoDate || !elo?.fixtures?.length) return null;
    const days = nearbyDays(isoDate);
    const fx = elo.fixtures.find((f) => days.includes(f.date)
      && ((f.homeSquadId === squadId && f.awaySquadId === opponentId)
        || (f.homeSquadId === opponentId && f.awaySquadId === squadId)));
    if (!fx) return null;
    const winPct = fx.homeSquadId === squadId ? fx.homeWinPct : fx.awayWinPct;
    return winPct == null ? null : winPct;
  }

  function eloWinExpHtml(winPct) {
    if (winPct == null) return '';
    const oppPct = Math.round((100 - winPct) * 10) / 10;
    return `<span class="dm-winexp" title="Elo win expectancy (eloratings.net)">
      <span class="dm-winexp-pct">${winPct}%</span>
      <span class="dm-winexp-track"><span class="dm-winexp-fill-home" style="flex-grow:${winPct}"></span><span class="dm-winexp-fill-away" style="flex-grow:${oppPct}"></span></span>
      ${tt('modal.winChance', 'win chance')}
    </span>`;
  }

  // Real headshot from play.fifa.com when the player has a fifaId, falling
  // back to a deterministic colored-initials circle on load error or when
  // no fifaId exists (see player-photo.js).
  function avatarHtml(fifaId, name, size) {
    return window.PlayerPhoto ? window.PlayerPhoto.html(fifaId, name, size) : '';
  }

  // ---- modal shell ----
  let overlayEl = null;

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    const style = document.createElement('style');
    style.textContent = `
      .dm-overlay {
        position: fixed; inset: 0; background: rgba(5,8,5,0.72);
        display: none; align-items: center; justify-content: center;
        z-index: 1000; padding: 20px; backdrop-filter: blur(2px);
      }
      .dm-overlay.open { display: flex; }
      .dm-card {
        background: var(--panel); border: 1px solid var(--border); border-radius: 14px;
        max-width: 720px; width: 100%; max-height: 86vh; overflow-y: auto;
        padding: 22px 24px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: dmRise 0.25s cubic-bezier(0.16,1,0.3,1) both;
      }
      @keyframes dmRise { from { opacity:0; transform: translateY(14px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }
      .dm-close {
        position: absolute; top: 14px; right: 14px; background: var(--panel2);
        border: 1px solid var(--border); color: var(--text); border-radius: 8px;
        width: 32px; height: 32px; cursor: pointer; font-size: 16px; line-height: 1;
        font-family: 'JetBrains Mono', monospace;
      }
      .dm-close:hover { background: var(--row-hover); }
      .dm-head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; padding-right: 40px; flex-wrap: wrap; }
      .dm-head h2 { margin: 0; font-size: 22px; font-family: 'Montserrat', sans-serif; font-weight: 800; }
      .dm-flag { font-size: 28px; line-height: 1; }
      .dm-sub { color: var(--text-dim); font-size: 13px; margin-bottom: 16px; }
      .dm-sub a, .dm-link { color: var(--accent2); cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
      .dm-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-dim); margin: 18px 0 8px; }
      .dm-round-card { background: var(--panel2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
      .dm-round-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .dm-round-head .title { font-size: 13px; color: var(--text-dim); }
      .dm-round-head .pts { font-size: 19px; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace; }
      .dm-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 6px; margin-bottom: 8px; }
      .dm-stat-item { display: flex; justify-content: space-between; gap: 6px; font-size: 11.5px; background: var(--panel); border-radius: 6px; padding: 4px 7px; border: 1px solid var(--border); }
      .dm-stat-item .v { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
      .dm-calc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 6px; }
      .dm-calc-item { display: flex; justify-content: space-between; gap: 6px; font-size: 11.5px; border: 1px dashed var(--border); border-radius: 6px; padding: 4px 7px; }
      .dm-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 6px; }
      .dm-table th { text-align: left; color: var(--text-dim); padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 11px; text-transform: uppercase; letter-spacing: .03em; }
      .dm-table td { padding: 6px 8px; border-bottom: 1px solid var(--border); }
      .dm-table td.num { text-align: right; font-family: 'JetBrains Mono', monospace; }
      .dm-table tr:hover td { background: var(--row-hover); cursor: pointer; }
      .dm-match-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-radius: 8px; background: var(--panel2); margin-bottom: 6px; font-size: 13px; }
      .dm-match-row .score { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent); }
      .dm-match-row .scorers { color: var(--text-dim); font-size: 11px; }
      .dm-empty { color: var(--text-dim); font-size: 13px; padding: 6px 2px; }
      .dm-loading { color: var(--text-dim); font-size: 13px; padding: 20px; text-align: center; }
      .dm-winexp { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); }
      .dm-winexp-pct { color: #4a9eff; font-weight: 700; }
      .dm-winexp-track { display: flex; width: 44px; height: 5px; border-radius: 999px; background: var(--panel2); overflow: hidden; flex-shrink: 0; }
      .dm-winexp-fill-home { display: block; height: 100%; background: #4a9eff; }
      .dm-winexp-fill-away { display: block; height: 100%; background: #ff5c5c; }
      .dm-elo-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--panel2); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--text-dim); }
      .dm-elo-badge b { color: var(--text); }
    `;
    document.head.appendChild(style);

    overlayEl = document.createElement('div');
    overlayEl.className = 'dm-overlay';
    overlayEl.innerHTML = `<div class="dm-card" id="dmCard" role="dialog" aria-modal="true">
      <button class="dm-close" id="dmClose" aria-label="Tutup">✕</button>
      <div id="dmBody"></div>
    </div>`;
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) close(); });
    document.getElementById('dmClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    return overlayEl;
  }

  function open(bodyHtml) {
    ensureOverlay();
    document.getElementById('dmBody').innerHTML = bodyHtml;
    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (overlayEl) overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setBody(html) {
    const el = document.getElementById('dmBody');
    if (el) el.innerHTML = html;
  }

  // ---- player modal ----
  // opts.mdIndex (0-based) lets a caller that's showing a specific matchday
  // projection (e.g. best15-next-round.html's MD1/MD2/MD3 selector) pin the
  // shown match to that team's Nth group match by date, instead of always
  // defaulting to whichever match is chronologically next overall. Without
  // it, viewing a player's "next match" while looking at an MD3 projection
  // would wrongly show MD2 if MD2 hasn't been played yet.
  async function openPlayer(playerId, opts) {
    open(`<div class="dm-loading">${tt('modal.loadingPlayer', 'Memuat data pemain...')}</div>`);
    const [players, squads, rounds, elo] = await Promise.all([loadPlayers(), loadSquads(), loadRounds(), loadElo()]);
    const p = players.find((x) => x.id === playerId);
    if (!p) { setBody(`<div class="dm-empty">${tt('modal.playerNotFound', 'Pemain tidak ditemukan.')}</div>`); return; }

    const abbr = squadAbbr(squads, p.squadId);
    const stats = await loadStats(playerId);
    const tournaments = allTournaments(rounds);

    const squadMatches = tournaments
      .filter((t) => t.homeSquadId === p.squadId || t.awaySquadId === p.squadId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const mdIndex = opts?.mdIndex;
    const targetMatch = mdIndex != null
      ? squadMatches[mdIndex]
      : squadMatches.find((t) => t.status !== 'complete');
    let nextMatchHtml = '';
    if (targetMatch) {
      const isHome = targetMatch.homeSquadId === p.squadId;
      const oppId = isHome ? targetMatch.awaySquadId : targetMatch.homeSquadId;
      const oppAbbr = isHome ? targetMatch.awaySquadAbbr : targetMatch.homeSquadAbbr;
      const winPct = findEloFixture(elo, p.squadId, oppId, targetMatch.date);
      const label = mdIndex != null ? `MD${mdIndex + 1}` : tt('modal.nextMatch', 'Pertandingan berikutnya');
      nextMatchHtml = `
        <div class="dm-sub" style="margin-top:-4px;">
          ${label}: ${flag(oppAbbr)}
          <button class="dm-link" onclick="DetailModal.openTeam(${oppId})">${escapeHtml(oppAbbr ?? '?')}</button>
          (${isHome ? tt('modal.home', 'Kandang') : tt('modal.away', 'Tandang')})
          · ${escapeHtml(formatWIB(targetMatch.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}
          ${winPct != null ? `· ${eloWinExpHtml(winPct)}` : ''}
        </div>
      `;
    }

    const roundsHtml = (Array.isArray(stats) && stats.length)
      ? stats.map((r) => {
          const t = tournaments.find((tt) => tt.id === r.tournamentId);
          let matchLine = '';
          if (t) {
            const isHome = t.homeSquadId === p.squadId;
            const oppAbbr = isHome ? t.awaySquadAbbr : t.homeSquadAbbr;
            const venue = isHome ? 'H' : 'A';
            const scoreKnown = t.homeScore != null && t.awayScore != null;
            const scoreText = scoreKnown ? `${t.homeScore}-${t.awayScore}` : 'belum main';
            matchLine = `vs ${escapeHtml(oppAbbr ?? '?')} (${venue}) · ${escapeHtml(scoreText)}`;
          }
          const statsObj = r?.stats ?? {};
          const officialPoints = r?.points ?? 0;
          const statItems = Object.keys(STAT_LABELS).map((code) => {
            const val = statsObj[code] ?? 0;
            return `<div class="dm-stat-item"><span>${STAT_LABELS[code]}</span><span class="v">${val}</span></div>`;
          }).join('');
          const calc = calcOfficialPoints(p.position, statsObj);
          const calcItems = calc.breakdown.map((b) => `<div class="dm-calc-item"><span>${escapeHtml(b.label)}</span><span>${b.value > 0 ? '+' : ''}${b.value}</span></div>`).join('') || '<div class="dm-empty">Tidak ada poin dari rumus ini.</div>';
          const diff = officialPoints - calc.total;
          return `
            <div class="dm-round-card">
              <div class="dm-round-head">
                <span class="title">Round ${r?.roundId ?? '?'} ${matchLine ? '· ' + matchLine : ''}</span>
                <span class="pts">${officialPoints} pts</span>
              </div>
              <div class="dm-stat-grid">${statItems}</div>
              <div class="dm-section-title" style="margin:8px 0 6px;">${tt('modal.officialBreakdown', 'Breakdown rumus resmi')}</div>
              <div class="dm-calc-grid">${calcItems}</div>
              ${diff !== 0 ? `<div class="dm-empty" style="margin-top:6px;">Selisih ${diff > 0 ? '+' : ''}${diff} pts dari poin resmi (kemungkinan scouting bonus).</div>` : ''}
            </div>
          `;
        }).join('')
      : `<div class="dm-empty">${tt('modal.noMatchData', 'Belum ada data pertandingan.')}</div>`;

    setBody(`
      <div class="dm-head">${avatarHtml(p.fifaId, playerName(p), 48)}<h2>${escapeHtml(playerName(p))}</h2></div>
      <div class="dm-sub">
        <span class="dm-flag">${flag(abbr)}</span>
        <button class="dm-link" onclick="DetailModal.openTeam(${p.squadId})">${escapeHtml(abbr)}</button>
        · ${escapeHtml(p.position ?? '?')} · $${Number(p.price ?? 0).toFixed(1)} · ${escapeHtml(p.status ?? 'unknown')}
        · Total ${p.stats?.totalPoints ?? 0} pts · Avg ${p.stats?.avgPoints ?? 0} · Form ${p.stats?.form ?? 0}
      </div>
      ${nextMatchHtml}
      <div class="dm-section-title">${tt('modal.roundsTitle', 'Stats per Ronde & Hasil Pertandingan')}</div>
      ${roundsHtml}
    `);
  }

  // ---- team modal ----
  async function openTeam(squadId) {
    open(`<div class="dm-loading">${tt('modal.loadingTeam', 'Memuat data tim...')}</div>`);
    const [players, squads, rounds, elo] = await Promise.all([loadPlayers(), loadSquads(), loadRounds(), loadElo()]);
    const squad = squads.find((s) => s.id === squadId);
    if (!squad) { setBody(`<div class="dm-empty">${tt('modal.teamNotFound', 'Tim tidak ditemukan.')}</div>`); return; }

    const eloRating = elo?.ratings?.[squadId];
    const eloBadgeHtml = eloRating
      ? `<span class="dm-elo-badge" title="World Football Elo Ratings (eloratings.net)">Elo <b>${eloRating.rating}</b> · #${eloRating.rank}</span>`
      : '';

    const tournaments = allTournaments(rounds)
      .filter((t) => t.homeSquadId === squadId || t.awaySquadId === squadId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const roster = players
      .filter((p) => p.squadId === squadId)
      .sort((a, b) => (b.stats?.totalPoints ?? 0) - (a.stats?.totalPoints ?? 0));

    function scorerNames(list) {
      if (!Array.isArray(list) || !list.length) return '';
      const names = list.map((g) => {
        const pl = players.find((p) => p.id === g.playerId);
        const label = pl ? playerName(pl) : `#${g.playerId}`;
        return g.isOwnGoal ? `${label} (OG)` : label;
      });
      return names.join(', ');
    }

    const matchesHtml = tournaments.length
      ? tournaments.map((t) => {
          const isHome = t.homeSquadId === squadId;
          const oppAbbr = isHome ? t.awaySquadAbbr : t.homeSquadAbbr;
          const oppId = isHome ? t.awaySquadId : t.homeSquadId;
          const scoreKnown = t.homeScore != null && t.awayScore != null;
          const scoreText = scoreKnown ? `${t.homeScore} – ${t.awayScore}` : tt('modal.notPlayedYet', 'Belum main');
          const scorers = scoreKnown ? scorerNames(isHome ? t.homeGoalScorersAssists : t.awayGoalScorersAssists) : '';
          const dateStr = t.date ? formatWIB(t.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
          const winPct = !scoreKnown ? findEloFixture(elo, squadId, oppId, t.date) : null;
          return `
            <div class="dm-match-row">
              <span>${dateStr} · ${isHome ? tt('modal.home', 'Kandang') : tt('modal.away', 'Tandang')} vs ${flag(oppAbbr)} <button class="dm-link" onclick="DetailModal.openTeam(${oppId})">${escapeHtml(oppAbbr ?? '?')}</button>${winPct != null ? ` · ${eloWinExpHtml(winPct)}` : ''}</span>
              <span class="score">${escapeHtml(scoreText)}</span>
            </div>
            ${scorers ? `<div class="dm-match-row" style="background:none;padding:0 10px 6px;"><span class="scorers">${tt('modal.goals', 'Gol')}: ${escapeHtml(scorers)}</span></div>` : ''}
          `;
        }).join('')
      : `<div class="dm-empty">${tt('modal.noMatches', 'Belum ada hasil pertandingan.')}</div>`;

    const rosterHtml = roster.length
      ? `<table class="dm-table">
          <thead><tr><th>${tt('common.colName', 'Nama')}</th><th>${tt('common.colPosition', 'Pos')}</th><th class="num">${tt('bestxi.colPrice', 'Harga')}</th><th class="num">${tt('common.colTotalPts', 'Total Pts')}</th></tr></thead>
          <tbody>${roster.map((p) => `
            <tr onclick="DetailModal.openPlayer(${p.id})">
              <td>${avatarHtml(p.fifaId, playerName(p), 24)} ${escapeHtml(playerName(p))}</td>
              <td>${escapeHtml(p.position ?? '?')}</td>
              <td class="num">$${Number(p.price ?? 0).toFixed(1)}</td>
              <td class="num">${p.stats?.totalPoints ?? 0}</td>
            </tr>
          `).join('')}</tbody>
        </table>`
      : `<div class="dm-empty">${tt('modal.noRoster', 'Tidak ada pemain untuk tim ini.')}</div>`;

    setBody(`
      <div class="dm-head"><span class="dm-flag">${flag(squad.abbr)}</span><h2>${escapeHtml(squad.name)} <span style="color:var(--text-dim); font-weight:400;">(${escapeHtml(squad.abbr)})</span></h2></div>
      <div class="dm-sub">Grup ${escapeHtml((squad.group ?? '?').toUpperCase())} ${squad.isEliminated ? '· Tersingkir' : ''} ${eloBadgeHtml}</div>
      <div class="dm-section-title">${tt('modal.matchesTitle', 'Hasil & Jadwal Pertandingan')}</div>
      ${matchesHtml}
      <div class="dm-section-title">${tt('modal.rosterTitle', 'Roster (diurutkan Total Points)')}</div>
      ${rosterHtml}
    `);
  }

  return { openPlayer, openTeam, openHtml: open, close, formatWIB };
})();
