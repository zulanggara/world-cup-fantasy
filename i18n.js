// Shared i18n: EN (default) + ID, persisted in localStorage, with a small
// language switcher auto-injected into .page-header on every page.
window.I18N = (function () {
  const STORAGE_KEY = 'fifa-fantasy-lang';

  const DICT = {
    nav: {
      players: { en: 'Player List', id: 'Daftar Pemain' },
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
    },
    index: {
      kicker: { en: 'Live · Player Intel', id: 'Live · Info Pemain' },
      heroTitle: { en: 'FIFA Fantasy Newsroom', id: 'FIFA Fantasy Newsroom' },
      heroSubtitle: { en: 'Complete 2026 World Cup player database — prices, status, and fantasy points, updated from live scrape data. Click a name for the per-round point breakdown, click a team code for match results & roster.', id: 'Database lengkap pemain Piala Dunia 2026 — harga, status, dan poin fantasy, ter-update dari hasil scrape resmi. Klik nama untuk lihat breakdown poin per ronde, klik kode tim untuk lihat hasil pertandingan & roster.' },
      statTotalPlayers: { en: 'Total Players', id: 'Total Pemain' },
      statPlaying: { en: 'Playing Status', id: 'Status Playing' },
      statTopPoints: { en: 'Top Points', id: 'Poin Tertinggi' },
      statTopForm: { en: 'Highest Form', id: 'Form Terbesar' },
      statTopAvg: { en: 'Highest Avg Points', id: 'Avg Poin Terbesar' },
      statTopSelected: { en: 'Most Selected', id: 'Paling Banyak Dipilih' },
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
    },
    overall: {
      kicker: { en: 'Power Rankings', id: 'Power Rankings' },
      heroTitle: { en: 'Best 15 of the Tournament', id: 'Best 15 of the Tournament' },
      heroSubtitle: { en: 'The 15 best players across every nation by accumulated points. Click a player or country code for details.', id: '15 pemain terbaik lintas semua negara berdasarkan akumulasi poin. Klik nama pemain atau kode negara untuk lihat detail.' },
    },
    nextround: {
      kicker: { en: 'Forecast', id: 'Forecast' },
      heroTitle: { en: 'Next Round Projection', id: 'Next Round Projection' },
      heroSubtitle: { en: 'Best 15 projection for the next round based on player form + fixture index. Click a player or country code for details.', id: 'Proyeksi Best 15 ronde depan berdasarkan form pemain + indeks fixture. Klik nama pemain atau kode negara untuk lihat detail.' },
    },
    research: {
      kicker: { en: 'Deep Dive', id: 'Deep Dive' },
      heroTitle: { en: 'Best 15 — Research Data', id: 'Best 15 — Data Riset' },
      heroSubtitle: { en: 'The most accurate projection: team strength from real match results + next opponent auto-detected from the official FIFA schedule.', id: 'Proyeksi paling akurat: kekuatan tim dari hasil pertandingan nyata + lawan ronde depan terdeteksi otomatis dari jadwal resmi FIFA.' },
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
      fixturesTitle: { en: 'Upcoming Fixtures (Group Stage)', id: 'Jadwal Pertandingan Mendatang (Fase Grup)' },
      legendDirect: { en: 'Direct qualifier (1st/2nd place)', id: 'Lolos langsung (juara/runner-up)' },
      legendThird: { en: '3rd place — qualification candidate', id: 'Peringkat 3 — kandidat lolos' },
      colDateTimeWIB: { en: 'Date & Time (WIB)', id: 'Tanggal & Waktu (WIB)' },
      colFixture: { en: 'Fixture', id: 'Pertandingan' },
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

  function t(key, fallback) {
    const entry = FLAT[key];
    if (!entry) return fallback ?? key;
    return entry[getLang()] ?? entry.en ?? fallback ?? key;
  }

  function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
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
