// Shared i18n: EN (default) + ID, persisted in localStorage, with a small
// language switcher auto-injected into .page-header on every page.
window.I18N = (function () {
  const STORAGE_KEY = 'fifa-fantasy-lang';

  const DICT = {
    nav: {
      dashboard: { en: 'Dashboard', id: 'Dashboard' },
      groupPlayers: { en: 'Players', id: 'Pemain' },
      players: { en: 'Player List', id: 'Daftar Pemain' },
      playerCompare: { en: 'Player Compare', id: 'Compare Pemain' },
      groupSquads: { en: 'Squads', id: 'Skuad & Tim' },
      compare: { en: 'Team Compare', id: 'Compare Tim' },
      best15overall: { en: 'Best 15 Overall', id: 'Best 15 Keseluruhan' },
      nextround: { en: 'Next Round Forecast', id: 'Prediksi Ronde Depan' },
      research: { en: 'Best 15 (Research)', id: 'Best 15 (Riset)' },
      groups: { en: 'Standings & Fixtures', id: 'Klasemen & Jadwal' },
      mysquad: { en: 'Build Squad', id: 'Susun Skuad' },
    },
    common: {
      searchPlaceholder: { en: 'Search player name...', id: 'Cari nama pemain...' },
      allPositions: { en: 'All Positions', id: 'Semua Posisi' },
      allStatus: { en: 'All Status', id: 'Semua Status' },
      colName: { en: 'Name', id: 'Nama' },
      colTeam: { en: 'Team', id: 'Tim' },
      colPosition: { en: 'Pos', id: 'Posisi' },
      colStatus: { en: 'Status', id: 'Status' },
      colPrice: { en: 'Price', id: 'Harga' },
      colTotalPts: { en: 'Total Pts', id: 'Total Pts' },
      colForm: { en: 'Form', id: 'Form' },
      colAvgPts: { en: 'Avg Pts', id: 'Avg Pts' },
      colPctSelected: { en: '% Selected', id: '% Selected' },
      prev: { en: '‹ Prev', id: '‹ Prev' },
      next: { en: 'Next ›', id: 'Next ›' },
      perPage: { en: '/ page', id: '/ halaman' },
      variantPremium: { en: 'Top Score', id: 'Skor Tertinggi' },
      variantBudget: { en: 'In Budget', id: 'Dalam Budget' },
      variantValue: { en: 'Value Pick', id: 'Hemat (Value)' },
      add: { en: '+ Add', id: '+ Tambah' },
      added: { en: '✓ In squad', id: '✓ Di skuad' },
      remove: { en: 'Remove', id: 'Hapus' },
      bench: { en: 'Bench', id: 'Bangku Cadangan' },
      total: { en: 'Total', id: 'Total' },
      minutesShort: { en: 'min', id: 'menit' },
      hoursShort: { en: 'hr', id: 'jam' },
      daysShort: { en: 'days', id: 'hari' },
      errLoadData: { en: 'Failed to load data:', id: 'Gagal memuat data:' },
      errRunScraperHint: { en: 'Run "node scraper.js" first, then access via an http server.', id: 'Jalankan "node scraper.js" dulu, lalu akses via http server.' },
      errHttpServerHint: { en: 'Make sure it is served via an http server, not file://.', id: 'Pastikan dijalankan via http server, bukan file://.' },
      noTeamData: { en: 'No team data.', id: 'Tidak ada data tim.' },
      noPlayers: { en: 'No players.', id: 'Tidak ada pemain.' },
      noBenchPlayers: { en: 'No bench players.', id: 'Tidak ada pemain cadangan.' },
      noData: { en: 'No data.', id: 'Tidak ada data.' },
      noMatchingPlayers: { en: 'No matching players.', id: 'Tidak ada pemain cocok.' },
      noThirdPlaceData: { en: 'No third-place data yet.', id: 'Belum ada data peringkat 3.' },
      noUpcomingFixtures: { en: 'No upcoming fixtures.', id: 'Tidak ada jadwal mendatang.' },
      perPageOption: { en: '{n} / page', id: '{n} / halaman' },
      pageInfo: { en: 'Page {cur} / {total}', id: 'Halaman {cur} / {total}' },
    },
    index: {
      kicker: { en: 'Live · Tournament Dashboard', id: 'Live · Dashboard Turnamen' },
      heroTitle: { en: 'FIFA Fantasy Dashboard', id: 'Dashboard FIFA Fantasy' },
      heroSubtitle: { en: 'Tournament-wide leaders at a glance — points, scoring, and defensive stats updated from live scrape data. Click any player or team for full details. Looking for the full player list? Use Players in the nav.', id: 'Pemuncak statistik turnamen sekilas — poin, gol, dan statistik bertahan ter-update dari data scrape. Klik nama pemain atau tim untuk detail lengkap. Cari daftar lengkap pemain? Buka menu Pemain.' },
      statTotalPlayers: { en: 'Total Players', id: 'Total Pemain' },
      statPlaying: { en: 'Playing Status', id: 'Status Playing' },
      lbTotalPoints: { en: 'Most Points', id: 'Poin Terbanyak' },
      lbAvgPoints: { en: 'Best Avg Points', id: 'Rata-rata Poin Terbaik' },
      lbForm: { en: 'Highest Form', id: 'Form Terbaik' },
      lbSelected: { en: 'Most Selected', id: 'Paling Banyak Dipilih' },
      lbGoals: { en: 'Top Scorer', id: 'Top Skor' },
      lbAssists: { en: 'Most Assists', id: 'Assist Terbanyak' },
      lbCleanSheets: { en: 'Most Clean Sheets', id: 'Clean Sheet Terbanyak' },
      lbTackles: { en: 'Most Tackles', id: 'Tekel Terbanyak' },
      lbKeyPasses: { en: 'Most Key Passes', id: 'Umpan Kunci Terbanyak' },
      lbShots: { en: 'Most Shots', id: 'Tembakan Terbanyak' },
      unitPts: { en: 'pts', id: 'pts' },
      unitGoals: { en: 'goals', id: 'gol' },
      unitAssists: { en: 'assists', id: 'assist' },
      unitCleanSheets: { en: 'clean sheets', id: 'clean sheet' },
      unitTackles: { en: 'tackles', id: 'tekel' },
      unitKeyPasses: { en: 'key passes', id: 'umpan kunci' },
      unitShots: { en: 'shots', id: 'tembakan' },
      noStatsYet: { en: 'No data yet for this category.', id: 'Belum ada data untuk kategori ini.' },
    },
    players: {
      kicker: { en: 'Live · Player Intel', id: 'Live · Info Pemain' },
      heroTitle: { en: 'Player Database', id: 'Database Pemain' },
      heroSubtitle: { en: 'Complete 2026 World Cup player database — prices, status, and fantasy points, updated from live scrape data. Click a name for the per-round point breakdown, click a team code for match results & roster.', id: 'Database lengkap pemain Piala Dunia 2026 — harga, status, dan poin fantasy, ter-update dari hasil scrape resmi. Klik nama untuk lihat breakdown poin per ronde, klik kode tim untuk lihat hasil pertandingan & roster.' },
    },
    playerCompare: {
      kicker: { en: 'Head-to-Head', id: 'Head-to-Head' },
      heroTitle: { en: 'Player Compare', id: 'Compare Pemain' },
      heroSubtitle: { en: 'Pick up to 5 players to compare price, points, form, and full stat breakdown side by side. Click a player name or team code for full details.', id: 'Pilih sampai 5 pemain untuk dibandingkan harga, poin, form, dan statistik lengkap secara berdampingan. Klik nama pemain atau kode tim untuk detail lengkap.' },
      emptyMsg: { en: 'Select at least 2 players above to compare.', id: 'Pilih minimal 2 pemain di atas untuk membandingkan.' },
      slotLabel: { en: 'Player', id: 'Pemain' },
      slotEmpty: { en: '— None —', id: '— Tidak Ada —' },
      noResults: { en: 'No matching players', id: 'Tidak ada pemain cocok' },
      rowLabel: { en: 'Stat', id: 'Statistik' },
      rowPosition: { en: 'Position', id: 'Posisi' },
      rowPrice: { en: 'Price', id: 'Harga' },
      rowTotalPoints: { en: 'Total Points', id: 'Total Poin' },
      rowAvgPoints: { en: 'Avg Points', id: 'Rata-rata Poin' },
      rowForm: { en: 'Form', id: 'Form' },
      rowSelected: { en: '% Selected', id: '% Dipilih' },
      rowGoals: { en: 'Goals', id: 'Gol' },
      rowAssists: { en: 'Assists', id: 'Assist' },
      rowCleanSheets: { en: 'Clean Sheets', id: 'Clean Sheet' },
      rowTackles: { en: 'Tackles', id: 'Tekel' },
      rowKeyPasses: { en: 'Key Passes', id: 'Umpan Kunci' },
      rowShots: { en: 'Shots', id: 'Tembakan' },
    },
    bestxi: {
      kicker: { en: 'Head-to-Head', id: 'Head-to-Head' },
      heroTitle: { en: 'Matchday Showdown', id: 'Matchday Showdown' },
      heroSubtitle: { en: 'Compare two countries’ Best 15 by accumulated fantasy points. Click a team or player name for details.', id: 'Bandingkan Best 15 dua negara berdasarkan akumulasi poin fantasy. Klik nama tim atau pemain untuk lihat detail.' },
      teamA: { en: 'Team A', id: 'Tim A' },
      teamB: { en: 'Team B', id: 'Tim B' },
      rankingTitle: { en: 'All Teams Best 15 Ranking ("In Budget" variant)', id: 'Ranking Best 15 Semua Tim/Negara (varian "Dalam Budget")' },
      colRank: { en: '#', id: '#' },
      colPrice: { en: 'Price', id: 'Harga' },
      colBest15Pts: { en: 'Best 15 Points', id: 'Poin Best 15' },
      disclaimer: {
        en: 'This page builds each team\'s best 15 players from accumulated fantasy points (local scrape data), not an official FIFA match prediction. The 2 GK – 5 DEF – 5 MID – 3 FWD split is purely a heuristic for comparison; players with a status other than "playing" are still shown as-is from the source data.',
        id: 'Halaman ini menyusun 15 pemain terbaik per tim berdasarkan akumulasi poin pemain (data lokal hasil scrape), bukan prediksi hasil pertandingan resmi FIFA. Komposisi 2 GK – 5 DEF – 5 MID – 3 FWD murni heuristik untuk perbandingan; pemain dengan status selain "playing" tetap ditampilkan apa adanya dari data sumber.',
      },
    },
    overall: {
      kicker: { en: 'Power Rankings', id: 'Power Rankings' },
      heroTitle: { en: 'Best 15 of the Tournament', id: 'Best 15 of the Tournament' },
      heroSubtitle: { en: 'The 15 best players across every nation by accumulated points. Click a player or country code for details.', id: '15 pemain terbaik lintas semua negara berdasarkan akumulasi poin. Klik nama pemain atau kode negara untuk lihat detail.' },
      disclaimer: {
        en: '15 players with the highest accumulated points from <b>across every team/nation</b> (not per squad), built with a 2 GK – 5 DEF – 5 MID – 3 FWD split, capped at <b>max 3 players per nation</b> (FIFA Fantasy group-stage rule). This is purely a cross-tournament top-performer combination from local scrape data, not an official FIFA prediction or line-up. FIFA Fantasy squad budget is <b>100</b> — 3 variants: <b>Top Score</b> (ignores budget, for reference), <b>In Budget</b> (best score that still fits ≤100, via cheapest-player swaps), and <b>Value Pick</b> (points-per-price efficiency, usually well under budget).',
        id: '15 pemain dengan akumulasi poin tertinggi dari <b>seluruh tim/negara</b> (bukan per squad), disusun dengan komposisi 2 GK – 5 DEF – 5 MID – 3 FWD, dengan batas <b>maksimal 3 pemain per negara</b> (aturan FIFA Fantasy di babak grup). Ini murni gabungan top performer lintas turnamen berdasarkan data lokal hasil scrape, bukan prediksi atau line-up resmi FIFA. Budget squad FIFA Fantasy <b>100</b> — ada 3 varian: <b>Skor Tertinggi</b> (abaikan budget, buat referensi), <b>Dalam Budget</b> (skor terbaik yang masih ≤100, lewat penukaran pemain termurah), dan <b>Hemat (Value)</b> (efisiensi poin per harga, biasanya jauh di bawah budget).',
      },
    },
    nextround: {
      kicker: { en: 'Forecast', id: 'Forecast' },
      heroTitle: { en: 'Next Round Projection', id: 'Next Round Projection' },
      heroSubtitle: { en: 'Best 15 projection for the next round based on player form + fixture index. Click a player or country code for details.', id: 'Proyeksi Best 15 ronde depan berdasarkan form pemain + indeks fixture. Klik nama pemain atau kode negara untuk lihat detail.' },
      disclaimer: {
        en: '<b>The 15-player pick</b> uses a 0–100 index score: 60% current player form (FIFA\'s <code>form</code>/<code>avgPoints</code> fields) + 40% next-round fixture index (Clean Sheet % for GK/DEF, Projected Goals for MID/FWD — from SBOBET/Betfair market projection charts via FPLJoe.com, static manual input as of 27.05.26, <b>not live</b>). <b>The "pts" number per player</b> is a <b>projected fantasy point estimate</b> (not an official score): the player\'s historical average points (<code>avgPoints</code>) multiplied by a fixture factor (up if the team is projected above the 48-team average for that matchday, down if below, capped 0.5×–1.8×). Pick a matchday that team hasn\'t played yet from the dropdown. Capped at <b>max 3 players per nation</b> (FIFA Fantasy group-stage rule). This is neither an official FIFA prediction nor a line-up guarantee.',
        id: '<b>Pemilihan 15 pemain</b> pakai skor indeks 0–100: 60% form pemain terkini (field <code>form</code>/<code>avgPoints</code> dari FIFA) + 40% indeks fixture ronde depan (Clean Sheet % untuk GK/DEF, Projected Goals tim untuk MID/FWD — dari grafik proyeksi pasar SBOBET/Betfair via FPLJoe.com, input manual statis per 27.05.26, <b>tidak live</b>). <b>Angka "pts" di tiap pemain</b> adalah <b>proyeksi poin fantasy</b> (estimasi, bukan poin resmi): rata-rata poin historis pemain (<code>avgPoints</code>) dikalikan faktor fixture (naik kalau tim diproyeksikan di atas rata-rata 48 tim untuk matchday itu, turun kalau di bawah rata-rata, dibatasi 0.5×–1.8×). Pilih matchday yang belum dimainkan tim tersebut di dropdown. Berlaku batas <b>maksimal 3 pemain per negara</b> (aturan FIFA Fantasy di babak grup). Ini bukan prediksi resmi FIFA maupun garansi line-up.',
      },
    },
    research: {
      kicker: { en: 'Deep Dive', id: 'Deep Dive' },
      heroTitle: { en: 'Best 15 — Research Data', id: 'Best 15 — Data Riset' },
      heroSubtitle: { en: 'The most accurate projection: team strength from real match results + next opponent auto-detected from the official FIFA schedule.', id: 'Proyeksi paling akurat: kekuatan tim dari hasil pertandingan nyata + lawan ronde depan terdeteksi otomatis dari jadwal resmi FIFA.' },
      disclaimer: {
        en: 'The most accurate version so far: team strength is computed from <b>this tournament\'s real match results</b> (average goals scored/conceded from <code>data/rounds.json</code>, the official FIFA schedule), not pre-tournament market odds. Each team\'s next opponent is also <b>auto-detected</b> from the real schedule (next unplayed group match, kickoff time in WIB) — no manual matchday selection needed. Projected points = player\'s historical <code>avgPoints</code> × opponent strength factor (GK/DEF up if the opponent rarely scores, MID/FWD up if the opponent concedes often), capped 0.5×–1.8×. Capped at max 3 players per nation.',
        id: 'Versi paling akurat sejauh ini: kekuatan tim dihitung dari <b>hasil pertandingan nyata turnamen ini</b> (gol dicetak/kebobolan rata-rata dari <code>data/rounds.json</code>, jadwal resmi FIFA), bukan dari odds pasar sebelum turnamen mulai. Lawan ronde depan untuk tiap tim juga <b>otomatis terdeteksi</b> dari jadwal nyata (pertandingan grup berikutnya yang belum selesai, waktu kickoff dalam WIB) — tidak perlu pilih matchday manual. Proyeksi poin = <code>avgPoints</code> historis pemain × faktor kekuatan lawan (GK/DEF naik kalau lawan jarang cetak gol, MID/FWD naik kalau lawan sering kebobolan), dibatasi 0.5×–1.8×. Berlaku maksimal 3 pemain per negara.',
      },
      gapNoOpponent: { en: '{n} players from teams with no detected next group match (group stage may already be over, or team data mismatch) — counted as neutral (×1 factor).', id: '{n} pemain dari tim tanpa pertandingan grup berikutnya yang terdeteksi (mungkin sudah selesai fase grup atau data tim tidak cocok) — dihitung netral (faktor ×1).' },
      gapNoTeamData: { en: '{n} players whose next opponent has no match-result history yet (×1 factor).', id: '{n} pemain dengan lawan berikutnya yang belum punya riwayat hasil pertandingan (faktor ×1).' },
      gapNotePrefix: { en: 'Data note: ', id: 'Catatan data: ' },
      gapNoteAllMapped: { en: 'All players were successfully mapped to their next opponent with match-result history.', id: 'Semua pemain berhasil dipetakan ke lawan berikutnya dengan data riwayat pertandingan.' },
    },
    groups: {
      kicker: { en: 'Group Stage Live', id: 'Group Stage Live' },
      heroTitle: { en: 'Standings & Fixtures', id: 'Klasemen & Jadwal' },
      heroSubtitle: { en: '12 group standings, real-time Round-of-32 projection, and upcoming fixtures — all times in WIB (Indonesia time). Click a team code for match results & roster.', id: 'Klasemen 12 grup, proyeksi babak 32 besar real-time, dan jadwal mendatang — semua jam dalam WIB. Klik kode tim untuk lihat hasil pertandingan & roster.' },
      tabStandings: { en: 'Standings', id: 'Klasemen' },
      tabThirds: { en: 'Third-Place Ranking', id: 'Ranking Peringkat 3' },
      tabBracket: { en: 'R32 Projection', id: 'Proyeksi 32 Besar' },
      tabFixtures: { en: 'Upcoming Fixtures', id: 'Jadwal Mendatang' },
      thirdsTitle: { en: 'Third-Place Ranking (Best 8 Qualify)', id: 'Ranking Peringkat 3 (8 Terbaik Lolos)' },
      bracketTitle: { en: 'Knockout Bracket Projection', id: 'Proyeksi Bracket Babak Gugur' },
      legendConfirmed: { en: 'Confirmed team (final standings / official result)', id: 'Tim pasti (klasemen final / hasil resmi)' },
      legendLive: { en: 'Current position (standings not final yet, may change)', id: 'Posisi saat ini (klasemen belum final, bisa berubah)' },
      thirdPlaceTitle: { en: 'Third Place Play-off', id: 'Perebutan Juara 3' },
      bracketTimeNote: { en: 'Kickoff times shown are as published by the source (venue/organizer timezone), not yet converted to WIB.', id: 'Jam pada bagan ini sesuai sumber data asli (zona waktu venue/penyelenggara), belum dikonversi ke WIB.' },
      fixturesTitle: { en: 'Upcoming Fixtures (Group Stage)', id: 'Jadwal Pertandingan Mendatang (Fase Grup)' },
      legendDirect: { en: 'Direct qualifier (1st/2nd place)', id: 'Lolos langsung (juara/runner-up)' },
      legendThird: { en: '3rd place — qualification candidate', id: 'Peringkat 3 — kandidat lolos' },
      colDateTimeWIB: { en: 'Date & Time (WIB)', id: 'Tanggal & Waktu (WIB)' },
      colFixture: { en: 'Fixture', id: 'Pertandingan' },
      disclaimer: {
        en: 'Group standings & schedule from <b>official FIFA data</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). Ranking <b>does not yet account for head-to-head</b> among teams tied on points — only Points → Goal Difference → Goals For. The Round-of-32 projection is computed automatically from the <b>current</b> standings (group winners/runners-up + the 8 best 3rd-placed teams, per the 2026 World Cup format) — <b>will change</b> as matches are played, and is only final once the group stage ends.',
        id: 'Klasemen & jadwal grup dari <b>data resmi FIFA</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). Urutan <b>belum memperhitungkan head-to-head</b> antar tim dengan poin sama — hanya Poin → Selisih Gol → Gol Memasukkan. Proyeksi babak 32 besar dihitung otomatis dari klasemen <b>saat ini</b> (juara & runner-up tiap grup + 8 tim peringkat-3 terbaik, sesuai format Piala Dunia 2026) — <b>akan berubah</b> seiring pertandingan berjalan, baru final setelah fase grup selesai.',
      },
    },
    mysquad: {
      kicker: { en: 'Draft Room', id: 'Draft Room' },
      heroTitle: { en: 'Build Your Squad', id: 'Susun Skuad Kamu' },
      heroSubtitle: { en: 'Pick 15 players (2 GK – 5 DEF – 5 MID – 3 FWD) within a 100 budget. Click "+" to add, click a squad player for details or to remove. Saved automatically in this browser.', id: 'Pilih 15 pemain (2 GK – 5 DEF – 5 MID – 3 FWD) dengan budget 100. Klik "+" untuk menambah, klik pemain di skuad untuk lihat detail atau hapus. Tersimpan otomatis di browser ini.' },
      sortTotalPoints: { en: 'Sort: Total Points', id: 'Urut: Total Points' },
      sortPrice: { en: 'Sort: Price', id: 'Urut: Harga' },
      sortForm: { en: 'Sort: Form', id: 'Urut: Form' },
      budget: { en: 'Budget', id: 'Budget' },
      players: { en: 'Players', id: 'Pemain' },
      totalPts: { en: 'Total Pts', id: 'Total Pts' },
      avgPerPlayer: { en: 'Avg/Player', id: 'Avg/Pemain' },
      clearSquad: { en: 'Clear Squad', id: 'Kosongkan Skuad' },
      clearConfirm: { en: 'Clear the entire squad?', id: 'Kosongkan seluruh skuad?' },
    },
    modal: {
      roundsTitle: { en: 'Per-Round Stats & Match Results', id: 'Stats per Ronde & Hasil Pertandingan' },
      noMatchData: { en: 'No match data yet.', id: 'Belum ada data pertandingan.' },
      officialBreakdown: { en: 'Official scoring breakdown', id: 'Breakdown rumus resmi' },
      matchesTitle: { en: 'Match Results & Fixtures', id: 'Hasil & Jadwal Pertandingan' },
      noMatches: { en: 'No match results yet.', id: 'Belum ada hasil pertandingan.' },
      rosterTitle: { en: 'Roster (sorted by Total Points)', id: 'Roster (diurutkan Total Points)' },
      noRoster: { en: 'No players for this team.', id: 'Tidak ada pemain untuk tim ini.' },
      loading: { en: 'Loading...', id: 'Memuat...' },
      loadingPlayer: { en: 'Loading player data...', id: 'Memuat data pemain...' },
      loadingTeam: { en: 'Loading team data...', id: 'Memuat data tim...' },
      home: { en: 'Home', id: 'Kandang' },
      away: { en: 'Away', id: 'Tandang' },
      goals: { en: 'Goals', id: 'Gol' },
      playerNotFound: { en: 'Player not found.', id: 'Pemain tidak ditemukan.' },
      teamNotFound: { en: 'Team not found.', id: 'Tim tidak ditemukan.' },
    },
    footer: {
      lastSync: { en: 'Data last synced', id: 'Data terakhir disinkronkan' },
      ago: { en: 'ago', id: 'lalu' },
      justNow: { en: 'just now', id: 'baru saja' },
      players: { en: 'players', id: 'pemain' },
      noSync: { en: 'Sync time unavailable — run', id: 'Waktu sinkronisasi data tidak tersedia — jalankan' },
      toCreate: { en: 'to generate', id: 'untuk membuat' },
    },
  };

  function flatten(dict, prefix, out) {
    for (const key of Object.keys(dict)) {
      const val = dict[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === 'object' && ('en' in val || 'id' in val)) {
        out[fullKey] = val;
      } else if (val && typeof val === 'object') {
        flatten(val, fullKey, out);
      }
    }
    return out;
  }
  const FLAT = flatten(DICT, '', {});

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyStaticTranslations();
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
    updateSwitcherUI();
  }

  function t(key, fallback, params) {
    const entry = FLAT[key];
    let str = entry ? (entry[getLang()] ?? entry.en ?? fallback ?? key) : (fallback ?? key);
    if (params) {
      for (const k of Object.keys(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      }
    }
    return str;
  }

  function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // For blocks that need inline <b>/<code> formatting (e.g. methodology
    // disclaimers) — dictionary value is trusted static HTML, not user input.
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function updateSwitcherUI() {
    const lang = getLang();
    document.querySelectorAll('.lang-switch button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function injectSwitcher() {
    const style = document.createElement('style');
    style.textContent = `
      .lang-switch { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
      .lang-switch button {
        background: var(--panel); color: var(--text-dim); border: none; padding: 8px 10px;
        font-size: 12px; cursor: pointer; font-family: 'JetBrains Mono', monospace;
      }
      .lang-switch button.active { background: var(--accent); color: #14180a; font-weight: 700; }
      .lang-switch button:hover:not(.active) { background: var(--row-hover); color: var(--text); }
      .page-header-actions { display: flex; gap: 8px; align-items: center; }
    `;
    document.head.appendChild(style);

    const header = document.querySelector('.page-header');
    if (!header) return;
    const switcher = document.createElement('div');
    switcher.className = 'lang-switch';
    switcher.innerHTML = `<button data-lang="en">EN</button><button data-lang="id">ID</button>`;
    switcher.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    const themeBtn = header.querySelector('#themeToggle');
    if (themeBtn && !themeBtn.parentElement.classList.contains('page-header-actions')) {
      const actions = document.createElement('div');
      actions.className = 'page-header-actions';
      themeBtn.parentElement.insertBefore(actions, themeBtn);
      actions.appendChild(switcher);
      actions.appendChild(themeBtn);
    } else {
      header.appendChild(switcher);
    }
    updateSwitcherUI();
  }

  function init() {
    injectSwitcher();
    applyStaticTranslations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { t, getLang, setLang };
})();
