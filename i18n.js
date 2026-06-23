// Shared i18n: EN (default), ID, AR, MS — persisted in localStorage, with a
// small dropdown language switcher auto-injected into .page-header on every
// page. Arabic flips the document to RTL (dir="rtl") for correct text flow.
window.I18N = (function () {
  const STORAGE_KEY = 'fifa-fantasy-lang';
  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'id', label: 'Indonesia' },
    { code: 'ar', label: 'العربية' },
    { code: 'ms', label: 'Bahasa Melayu' },
  ];
  const RTL_LANGS = ['ar'];

  const DICT = {
    nav: {
      dashboard: { en: 'Dashboard', id: 'Dashboard', ar: 'لوحة التحكم', ms: 'Papan Pemuka' },
      groupPlayers: { en: 'Players', id: 'Pemain', ar: 'اللاعبون', ms: 'Pemain' },
      players: { en: 'Player List', id: 'Daftar Pemain', ar: 'قائمة اللاعبين', ms: 'Senarai Pemain' },
      playerCompare: { en: 'Player Compare', id: 'Compare Pemain', ar: 'مقارنة اللاعبين', ms: 'Banding Pemain' },
      groupSquads: { en: 'Squads', id: 'Skuad & Tim', ar: 'الفرق', ms: 'Skuad & Pasukan' },
      compare: { en: 'Team Compare', id: 'Compare Tim', ar: 'مقارنة الفرق', ms: 'Banding Pasukan' },
      best15overall: { en: 'Best 15 Overall', id: 'Best 15 Keseluruhan', ar: 'أفضل 15 إجمالي', ms: '15 Terbaik Keseluruhan' },
      nextround: { en: 'Next Round Forecast', id: 'Prediksi Ronde Depan', ar: 'توقعات الجولة القادمة', ms: 'Ramalan Pusingan Seterusnya' },
      research: { en: 'Best 15 (Research)', id: 'Best 15 (Riset)', ar: 'أفضل 15 (بحث)', ms: '15 Terbaik (Penyelidikan)' },
      groups: { en: 'Standings & Fixtures', id: 'Klasemen & Jadwal', ar: 'الترتيب والمباريات', ms: 'Kedudukan & Perlawanan' },
      mysquad: { en: 'Build Squad', id: 'Susun Skuad', ar: 'إنشاء التشكيلة', ms: 'Bina Skuad' },
      donate: { en: '❤ Donate', id: '❤ Donasi', ar: '❤ تبرع', ms: '❤ Derma' },
    },
    common: {
      searchPlaceholder: { en: 'Search player name...', id: 'Cari nama pemain...', ar: 'ابحث عن اسم اللاعب...', ms: 'Cari nama pemain...' },
      allPositions: { en: 'All Positions', id: 'Semua Posisi', ar: 'كل المراكز', ms: 'Semua Kedudukan' },
      allStatus: { en: 'All Status', id: 'Semua Status', ar: 'كل الحالات', ms: 'Semua Status' },
      colName: { en: 'Name', id: 'Nama', ar: 'الاسم', ms: 'Nama' },
      colTeam: { en: 'Team', id: 'Tim', ar: 'الفريق', ms: 'Pasukan' },
      colGroup: { en: 'Group', id: 'Grup', ar: 'المجموعة', ms: 'Kumpulan' },
      colPosition: { en: 'Pos', id: 'Posisi', ar: 'المركز', ms: 'Kedudukan' },
      colStatus: { en: 'Status', id: 'Status', ar: 'الحالة', ms: 'Status' },
      colPrice: { en: 'Price', id: 'Harga', ar: 'السعر', ms: 'Harga' },
      colTotalPts: { en: 'Total Pts', id: 'Total Pts', ar: 'إجمالي النقاط', ms: 'Jumlah Mata' },
      colForm: { en: 'Form', id: 'Form', ar: 'الفورمة', ms: 'Bentuk' },
      colAvgPts: { en: 'Avg Pts', id: 'Avg Pts', ar: 'متوسط النقاط', ms: 'Purata Mata' },
      colPctSelected: { en: '% Selected', id: '% Selected', ar: '% المختارين', ms: '% Dipilih' },
      prev: { en: '‹ Prev', id: '‹ Prev', ar: '‹ السابق', ms: '‹ Sebelum' },
      next: { en: 'Next ›', id: 'Next ›', ar: 'التالي ›', ms: 'Seterusnya ›' },
      perPage: { en: '/ page', id: '/ halaman', ar: '/ صفحة', ms: '/ halaman' },
      variantPremium: { en: 'Top Score', id: 'Skor Tertinggi', ar: 'أعلى نتيجة', ms: 'Markah Tertinggi' },
      variantBudget: { en: 'In Budget', id: 'Dalam Budget', ar: 'ضمن الميزانية', ms: 'Dalam Bajet' },
      variantValue: { en: 'Value Pick', id: 'Hemat (Value)', ar: 'أفضل قيمة', ms: 'Pilihan Bernilai' },
      add: { en: '+ Add', id: '+ Tambah', ar: '+ إضافة', ms: '+ Tambah' },
      added: { en: '✓ In squad', id: '✓ Di skuad', ar: '✓ في التشكيلة', ms: '✓ Dalam skuad' },
      remove: { en: 'Remove', id: 'Hapus', ar: 'إزالة', ms: 'Buang' },
      bench: { en: 'Bench', id: 'Bangku Cadangan', ar: 'دكة الاحتياط', ms: 'Bangku Simpanan' },
      total: { en: 'Total', id: 'Total', ar: 'الإجمالي', ms: 'Jumlah' },
      minutesShort: { en: 'min', id: 'menit', ar: 'د', ms: 'min' },
      hoursShort: { en: 'hr', id: 'jam', ar: 'س', ms: 'jam' },
      daysShort: { en: 'days', id: 'hari', ar: 'أيام', ms: 'hari' },
      errLoadData: { en: 'Failed to load data:', id: 'Gagal memuat data:', ar: 'فشل تحميل البيانات:', ms: 'Gagal memuatkan data:' },
      errRunScraperHint: { en: 'Run "node scraper.js" first, then access via an http server.', id: 'Jalankan "node scraper.js" dulu, lalu akses via http server.', ar: 'شغّل "node scraper.js" أولاً، ثم الوصول عبر خادم http.', ms: 'Jalankan "node scraper.js" dahulu, kemudian akses melalui pelayan http.' },
      errHttpServerHint: { en: 'Make sure it is served via an http server, not file://.', id: 'Pastikan dijalankan via http server, bukan file://.', ar: 'تأكد من تشغيله عبر خادم http، وليس file://.', ms: 'Pastikan ia dijalankan melalui pelayan http, bukan file://.' },
      noTeamData: { en: 'No team data.', id: 'Tidak ada data tim.', ar: 'لا توجد بيانات للفريق.', ms: 'Tiada data pasukan.' },
      noPlayers: { en: 'No players.', id: 'Tidak ada pemain.', ar: 'لا يوجد لاعبون.', ms: 'Tiada pemain.' },
      noBenchPlayers: { en: 'No bench players.', id: 'Tidak ada pemain cadangan.', ar: 'لا يوجد لاعبون في دكة الاحتياط.', ms: 'Tiada pemain simpanan.' },
      noData: { en: 'No data.', id: 'Tidak ada data.', ar: 'لا توجد بيانات.', ms: 'Tiada data.' },
      noMatchingPlayers: { en: 'No matching players.', id: 'Tidak ada pemain cocok.', ar: 'لا يوجد لاعبون مطابقون.', ms: 'Tiada pemain yang sepadan.' },
      noThirdPlaceData: { en: 'No third-place data yet.', id: 'Belum ada data peringkat 3.', ar: 'لا توجد بيانات للمركز الثالث بعد.', ms: 'Belum ada data tempat ketiga.' },
      noUpcomingFixtures: { en: 'No upcoming fixtures.', id: 'Tidak ada jadwal mendatang.', ar: 'لا توجد مباريات قادمة.', ms: 'Tiada perlawanan akan datang.' },
      perPageOption: { en: '{n} / page', id: '{n} / halaman', ar: '{n} / صفحة', ms: '{n} / halaman' },
      pageInfo: { en: 'Page {cur} / {total}', id: 'Halaman {cur} / {total}', ar: 'صفحة {cur} / {total}', ms: 'Halaman {cur} / {total}' },
    },
    index: {
      kicker: { en: 'Live · Tournament Dashboard', id: 'Live · Dashboard Turnamen', ar: 'مباشر · لوحة البطولة', ms: 'Live · Papan Pemuka Kejohanan' },
      heroTitle: { en: 'FIFA Fantasy Dashboard', id: 'Dashboard FIFA Fantasy', ar: 'لوحة فانتازي فيفا', ms: 'Papan Pemuka FIFA Fantasy' },
      heroSubtitle: { en: 'Tournament-wide leaders at a glance — points, scoring, and defensive stats updated from live scrape data. Click any player or team for full details. Looking for the full player list? Use Players in the nav.', id: 'Pemuncak statistik turnamen sekilas — poin, gol, dan statistik bertahan ter-update dari data scrape. Klik nama pemain atau tim untuk detail lengkap. Cari daftar lengkap pemain? Buka menu Pemain.', ar: 'أبرز اللاعبين في البطولة بنظرة واحدة — النقاط والتسجيل وإحصاءات الدفاع، محدّثة من بيانات مباشرة. اضغط على أي لاعب أو فريق لمزيد من التفاصيل. تريد قائمة اللاعبين الكاملة؟ استخدم قائمة اللاعبين في التنقل.', ms: 'Peneraju keseluruhan kejohanan sekilas pandang — mata, jaringan, dan statistik pertahanan dikemas kini daripada data scrape secara langsung. Klik mana-mana pemain atau pasukan untuk butiran lengkap. Mencari senarai penuh pemain? Gunakan menu Pemain.' },
      statTotalPlayers: { en: 'Total Players', id: 'Total Pemain', ar: 'إجمالي اللاعبين', ms: 'Jumlah Pemain' },
      statPlaying: { en: 'Playing Status', id: 'Status Playing', ar: 'حالة اللعب', ms: 'Status Bermain' },
      lbTotalPoints: { en: 'Most Points', id: 'Poin Terbanyak', ar: 'أكثر النقاط', ms: 'Mata Terbanyak' },
      lbAvgPoints: { en: 'Best Avg Points', id: 'Rata-rata Poin Terbaik', ar: 'أفضل متوسط نقاط', ms: 'Purata Mata Terbaik' },
      lbForm: { en: 'Highest Form', id: 'Form Terbaik', ar: 'أعلى فورمة', ms: 'Bentuk Terbaik' },
      lbSelected: { en: 'Most Selected', id: 'Paling Banyak Dipilih', ar: 'الأكثر اختياراً', ms: 'Paling Banyak Dipilih' },
      lbGoals: { en: 'Top Scorer', id: 'Top Skor', ar: 'أعلى هداف', ms: 'Penjaring Gol Terbanyak' },
      lbAssists: { en: 'Most Assists', id: 'Assist Terbanyak', ar: 'أكثر التمريرات الحاسمة', ms: 'Bantuan Terbanyak' },
      lbCleanSheets: { en: 'Most Clean Sheets', id: 'Clean Sheet Terbanyak', ar: 'أكثر الشباك النظيفة', ms: 'Clean Sheet Terbanyak' },
      lbTackles: { en: 'Most Tackles', id: 'Tekel Terbanyak', ar: 'أكثر التدخلات', ms: 'Tekel Terbanyak' },
      lbKeyPasses: { en: 'Most Chances Created', id: 'Peluang Tercipta Terbanyak', ar: 'أكثر الفرص المتاحة', ms: 'Peluang Tercipta Terbanyak' },
      lbShots: { en: 'Most Shots', id: 'Tembakan Terbanyak', ar: 'أكثر التسديدات', ms: 'Tendangan Terbanyak' },
      lbMinutesPlayed: { en: 'Most Minutes Played', id: 'Menit Bermain Terbanyak', ar: 'أكثر دقائق اللعب', ms: 'Minit Bermain Terbanyak' },
      lbPenaltyWon: { en: 'Most Penalties Won', id: 'Penalti Didapat Terbanyak', ar: 'أكثر ركلات الجزاء المكتسبة', ms: 'Penalti Diperoleh Terbanyak' },
      lbPenaltyConceded: { en: 'Most Penalties Conceded', id: 'Penalti Diberikan Terbanyak', ar: 'أكثر ركلات الجزاء المرتكبة', ms: 'Penalti Diberikan Terbanyak' },
      lbPenaltySaved: { en: 'Most Penalties Saved', id: 'Penalti Diselamatkan Terbanyak', ar: 'أكثر ركلات الجزاء المتصدى لها', ms: 'Penalti Diselamatkan Terbanyak' },
      lbFreeKicks: { en: 'Most Free-Kick Goals', id: 'Gol Free Kick Terbanyak', ar: 'أكثر أهداف الكرات الثابتة', ms: 'Gol Tendangan Percuma Terbanyak' },
      lbOwnGoals: { en: 'Most Own Goals', id: 'Gol Bunuh Diri Terbanyak', ar: 'أكثر الأهداف في مرمى فريقه', ms: 'Gol Sendiri Terbanyak' },
      lbYellowCards: { en: 'Most Yellow Cards', id: 'Kartu Kuning Terbanyak', ar: 'أكثر البطاقات الصفراء', ms: 'Kad Kuning Terbanyak' },
      lbRedCards: { en: 'Most Red Cards', id: 'Kartu Merah Terbanyak', ar: 'أكثر البطاقات الحمراء', ms: 'Kad Merah Terbanyak' },
      lbStartingXI: { en: 'Most Starting XI Appearances', id: 'Starting XI Terbanyak', ar: 'أكثر مرات التشكيل الأساسي', ms: 'Penampilan XI Bermula Terbanyak' },
      unitPts: { en: 'pts', id: 'pts', ar: 'نقطة', ms: 'mata' },
      unitGoals: { en: 'goals', id: 'gol', ar: 'هدف', ms: 'gol' },
      unitAssists: { en: 'assists', id: 'assist', ar: 'تمريرة حاسمة', ms: 'bantuan' },
      unitCleanSheets: { en: 'clean sheets', id: 'clean sheet', ar: 'شباك نظيفة', ms: 'clean sheet' },
      unitTackles: { en: 'tackles', id: 'tekel', ar: 'تدخلات', ms: 'tekel' },
      unitKeyPasses: { en: 'chances created', id: 'peluang', ar: 'فرصة', ms: 'peluang' },
      unitShots: { en: 'shots', id: 'tembakan', ar: 'تسديدات', ms: 'tendangan' },
      unitMinutes: { en: 'min', id: 'menit', ar: 'دقيقة', ms: 'minit' },
      unitPenaltyWon: { en: 'won', id: 'didapat', ar: 'مكتسبة', ms: 'diperoleh' },
      unitPenaltyConceded: { en: 'conceded', id: 'diberikan', ar: 'مرتكبة', ms: 'diberikan' },
      unitPenaltySaved: { en: 'saved', id: 'diselamatkan', ar: 'متصدى لها', ms: 'diselamatkan' },
      unitFreeKicks: { en: 'free-kick goals', id: 'gol free kick', ar: 'أهداف كرات ثابتة', ms: 'gol tendangan percuma' },
      unitOwnGoals: { en: 'own goals', id: 'gol bunuh diri', ar: 'أهداف عكسية', ms: 'gol sendiri' },
      unitYellowCards: { en: 'yellow cards', id: 'kartu kuning', ar: 'بطاقات صفراء', ms: 'kad kuning' },
      unitRedCards: { en: 'red cards', id: 'kartu merah', ar: 'بطاقات حمراء', ms: 'kad merah' },
      unitStartingXI: { en: 'starts', id: 'starting XI', ar: 'تشكيل أساسي', ms: 'kali bermula' },
      noStatsYet: { en: 'No data yet for this category.', id: 'Belum ada data untuk kategori ini.', ar: 'لا توجد بيانات لهذه الفئة بعد.', ms: 'Belum ada data untuk kategori ini.' },
      visToggleLabel: { en: 'Show / hide categories', id: 'Tampilkan/Sembunyikan Kategori', ar: 'إظهار / إخفاء الفئات', ms: 'Tunjuk / Sembunyi Kategori' },
      visGroup_overall: { en: 'Overall', id: 'Keseluruhan', ar: 'عام', ms: 'Keseluruhan' },
      visGroup_attacking: { en: 'Attacking', id: 'Menyerang', ar: 'الهجوم', ms: 'Menyerang' },
      visGroup_defending: { en: 'Defending', id: 'Bertahan', ar: 'الدفاع', ms: 'Bertahan' },
      visGroup_playingTime: { en: 'Playing Time', id: 'Waktu Bermain', ar: 'وقت اللعب', ms: 'Masa Bermain' },
      visGroup_discipline: { en: 'Discipline', id: 'Disiplin', ar: 'الانضباط', ms: 'Disiplin' },
    },
    players: {
      kicker: { en: 'Live · Player Intel', id: 'Live · Info Pemain', ar: 'مباشر · معلومات اللاعبين', ms: 'Live · Maklumat Pemain' },
      heroTitle: { en: 'Player Database', id: 'Database Pemain', ar: 'قاعدة بيانات اللاعبين', ms: 'Pangkalan Data Pemain' },
      heroSubtitle: { en: 'Complete 2026 World Cup player database — prices, status, and fantasy points, updated from live scrape data. Click a name for the per-round point breakdown, click a team code for match results & roster.', id: 'Database lengkap pemain Piala Dunia 2026 — harga, status, dan poin fantasy, ter-update dari hasil scrape resmi. Klik nama untuk lihat breakdown poin per ronde, klik kode tim untuk lihat hasil pertandingan & roster.', ar: 'قاعدة بيانات كاملة لجميع لاعبي كأس العالم 2026 — الأسعار والحالة ونقاط الفانتازي، محدّثة من بيانات مباشرة. اضغط على اسم لعرض تفصيل النقاط لكل جولة، واضغط على رمز الفريق لعرض نتائج المباريات والتشكيلة.', ms: 'Pangkalan data lengkap pemain Piala Dunia 2026 — harga, status, dan mata fantasi, dikemas kini daripada data scrape sebenar. Klik nama untuk lihat pecahan mata setiap pusingan, klik kod pasukan untuk lihat keputusan perlawanan & senarai pemain.' },
    },
    donate: {
      kicker: { en: 'Support This Project', id: 'Dukung Project Ini', ar: 'دعم هذا المشروع', ms: 'Sokong Projek Ini' },
      heroTitle: { en: 'Support World Cup 2026 Fantasy Stats', id: 'Dukung World Cup 2026 Fantasy Stats', ar: 'دعم موقع إحصائيات فانتازي كأس العالم 2026', ms: 'Sokong World Cup 2026 Fantasy Stats' },
      heroSubtitle: { en: 'This project is built and self-hosted as a fan project. If this site has been useful to you, any support helps cover hosting costs and development time.', id: 'Project ini dikerjakan dan dihosting sendiri sebagai proyek penggemar. Kalau situs ini bermanfaat buat kamu, dukungan sekecil apapun sangat berarti untuk biaya hosting dan waktu pengembangan.', ar: 'هذا المشروع بُني واستُضيف ذاتياً كمشروع لعشاق كرة القدم. إذا كان هذا الموقع مفيداً لك، فإن أي دعم يساعد في تغطية تكاليف الاستضافة ووقت التطوير.', ms: 'Projek ini dibina dan dihoskan sendiri sebagai projek peminat. Jika laman ini bermanfaat untuk anda, sebarang sokongan amat membantu menampung kos hosting dan masa pembangunan.' },
      patreonDesc: { en: 'One-time support via Patreon.', id: 'Dukungan sekali bayar lewat Patreon.', ar: 'دعم لمرة واحدة عبر Patreon.', ms: 'Sokongan sekali bayar melalui Patreon.' },
      patreonCta: { en: 'Support on Patreon', id: 'Dukung di Patreon', ar: 'دعم عبر Patreon', ms: 'Sokong di Patreon' },
      saweriaDesc: { en: 'One-time support — like "buy me a coffee", quick and no account needed.', id: 'Dukungan sekali bayar, cocok untuk "traktir kopi" — cepat dan tanpa perlu akun.', ar: 'دعم لمرة واحدة — مثل "اشترِ لي قهوة"، سريع ولا يحتاج إلى حساب.', ms: 'Sokongan sekali bayar — seperti "belikan saya kopi", pantas dan tidak perlu akaun.' },
      saweriaCta: { en: 'Support on Saweria', id: 'Dukung di Saweria', ar: 'دعم عبر Saweria', ms: 'Sokong di Saweria' },
      footerCta: { en: '❤ Donate', id: '❤ Donasi', ar: '❤ تبرع', ms: '❤ Derma' },
    },
    playerCompare: {
      kicker: { en: 'Head-to-Head', id: 'Head-to-Head', ar: 'مقارنة مباشرة', ms: 'Head-to-Head' },
      heroTitle: { en: 'Player Compare', id: 'Compare Pemain', ar: 'مقارنة اللاعبين', ms: 'Banding Pemain' },
      heroSubtitle: { en: 'Pick up to 5 players to compare price, points, form, and full stat breakdown side by side. Click a player name or team code for full details.', id: 'Pilih sampai 5 pemain untuk dibandingkan harga, poin, form, dan statistik lengkap secara berdampingan. Klik nama pemain atau kode tim untuk detail lengkap.', ar: 'اختر حتى 5 لاعبين لمقارنة السعر والنقاط والفورمة وتفصيل الإحصاءات الكاملة جنباً إلى جنب. اضغط على اسم اللاعب أو رمز الفريق لمزيد من التفاصيل.', ms: 'Pilih sehingga 5 pemain untuk membandingkan harga, mata, bentuk, dan pecahan statistik lengkap secara bersebelahan. Klik nama pemain atau kod pasukan untuk butiran lengkap.' },
      emptyMsg: { en: 'Select at least 2 players above to compare.', id: 'Pilih minimal 2 pemain di atas untuk membandingkan.', ar: 'اختر لاعبين على الأقل أعلاه للمقارنة.', ms: 'Pilih sekurang-kurangnya 2 pemain di atas untuk membandingkan.' },
      slotLabel: { en: 'Player', id: 'Pemain', ar: 'لاعب', ms: 'Pemain' },
      slotEmpty: { en: '— None —', id: '— Tidak Ada —', ar: '— لا أحد —', ms: '— Tiada —' },
      noResults: { en: 'No matching players', id: 'Tidak ada pemain cocok', ar: 'لا يوجد لاعبون مطابقون', ms: 'Tiada pemain yang sepadan' },
      rowLabel: { en: 'Stat', id: 'Statistik', ar: 'إحصائية', ms: 'Statistik' },
      rowPosition: { en: 'Position', id: 'Posisi', ar: 'المركز', ms: 'Kedudukan' },
      rowPrice: { en: 'Price', id: 'Harga', ar: 'السعر', ms: 'Harga' },
      rowTotalPoints: { en: 'Total Points', id: 'Total Poin', ar: 'إجمالي النقاط', ms: 'Jumlah Mata' },
      rowAvgPoints: { en: 'Avg Points', id: 'Rata-rata Poin', ar: 'متوسط النقاط', ms: 'Purata Mata' },
      rowForm: { en: 'Form', id: 'Form', ar: 'الفورمة', ms: 'Bentuk' },
      rowSelected: { en: '% Selected', id: '% Dipilih', ar: '% المختارين', ms: '% Dipilih' },
      rowGoals: { en: 'Goals', id: 'Gol', ar: 'الأهداف', ms: 'Gol' },
      rowAssists: { en: 'Assists', id: 'Assist', ar: 'التمريرات الحاسمة', ms: 'Bantuan' },
      rowCleanSheets: { en: 'Clean Sheets', id: 'Clean Sheet', ar: 'الشباك النظيفة', ms: 'Clean Sheet' },
      rowTackles: { en: 'Tackles', id: 'Tekel', ar: 'التدخلات', ms: 'Tekel' },
      rowKeyPasses: { en: 'Key Passes', id: 'Umpan Kunci', ar: 'التمريرات المفتاحية', ms: 'Hantaran Kunci' },
      rowShots: { en: 'Shots', id: 'Tembakan', ar: 'التسديدات', ms: 'Tendangan' },
    },
    bestxi: {
      kicker: { en: 'Head-to-Head', id: 'Head-to-Head', ar: 'مقارنة مباشرة', ms: 'Head-to-Head' },
      heroTitle: { en: 'Matchday Showdown', id: 'Matchday Showdown', ar: 'مواجهة يوم المباراة', ms: 'Pertembungan Hari Perlawanan' },
      heroSubtitle: { en: 'Compare two countries’ Best 15 by accumulated fantasy points. Click a team or player name for details.', id: 'Bandingkan Best 15 dua negara berdasarkan akumulasi poin fantasy. Klik nama tim atau pemain untuk lihat detail.', ar: 'قارن أفضل 15 لاعباً من دولتين بناءً على إجمالي نقاط الفانتازي. اضغط على اسم الفريق أو اللاعب لمزيد من التفاصيل.', ms: 'Bandingkan 15 Terbaik dua negara berdasarkan jumlah mata fantasi. Klik nama pasukan atau pemain untuk butiran.' },
      teamA: { en: 'Team A', id: 'Tim A', ar: 'الفريق أ', ms: 'Pasukan A' },
      teamB: { en: 'Team B', id: 'Tim B', ar: 'الفريق ب', ms: 'Pasukan B' },
      rankingTitle: { en: 'All Teams Best 15 Ranking ("In Budget" variant)', id: 'Ranking Best 15 Semua Tim/Negara (varian "Dalam Budget")', ar: 'ترتيب أفضل 15 لجميع الفرق (نسخة "ضمن الميزانية")', ms: 'Kedudukan 15 Terbaik Semua Pasukan/Negara (varian "Dalam Bajet")' },
      colRank: { en: '#', id: '#', ar: '#', ms: '#' },
      colPrice: { en: 'Price', id: 'Harga', ar: 'السعر', ms: 'Harga' },
      colBest15Pts: { en: 'Best 15 Points', id: 'Poin Best 15', ar: 'نقاط أفضل 15', ms: 'Mata 15 Terbaik' },
      nextMatchLabel: { en: 'Next match', id: 'Pertandingan berikutnya', ar: 'المباراة القادمة', ms: 'Perlawanan seterusnya' },
      formationLabel: { en: 'Composition 2-5-5-3 (15 players) · sorted by Total Points', id: 'Komposisi 2-5-5-3 (15 pemain) · diurutkan berdasarkan Total Points', ar: 'تركيبة 2-5-5-3 (15 لاعباً) · مرتبة حسب إجمالي النقاط', ms: 'Komposisi 2-5-5-3 (15 pemain) · disusun mengikut Jumlah Mata' },
      benchTitle: { en: 'Bench (rest of the squad)', id: 'Bangku cadangan (sisanya di squad)', ar: 'دكة الاحتياط (بقية التشكيلة)', ms: 'Bangku simpanan (selebihnya dalam skuad)' },
      disclaimer: {
        en: 'This page builds each team\'s best 15 players from accumulated fantasy points (local scrape data), not an official FIFA match prediction. The 2 GK – 5 DEF – 5 MID – 3 FWD split is purely a heuristic for comparison; players with a status other than "playing" are still shown as-is from the source data.',
        id: 'Halaman ini menyusun 15 pemain terbaik per tim berdasarkan akumulasi poin pemain (data lokal hasil scrape), bukan prediksi hasil pertandingan resmi FIFA. Komposisi 2 GK – 5 DEF – 5 MID – 3 FWD murni heuristik untuk perbandingan; pemain dengan status selain "playing" tetap ditampilkan apa adanya dari data sumber.',
        ar: 'تبني هذه الصفحة أفضل 15 لاعباً لكل فريق بناءً على إجمالي نقاط الفانتازي (بيانات محلية)، وليست تنبؤاً رسمياً من فيفا لنتيجة المباراة. تقسيم 2 حارس – 5 دفاع – 5 وسط – 3 هجوم هو تقريب بسيط لأغراض المقارنة فقط؛ يظهر اللاعبون بحالة غير "يلعب" كما هي من البيانات المصدرية.',
        ms: 'Halaman ini membina 15 pemain terbaik bagi setiap pasukan berdasarkan jumlah mata fantasi (data scrape tempatan), bukan ramalan rasmi perlawanan FIFA. Susunan 2 GK – 5 DEF – 5 MID – 3 FWD hanyalah heuristik untuk perbandingan; pemain dengan status selain "playing" tetap dipaparkan seadanya daripada data sumber.',
      },
    },
    overall: {
      kicker: { en: 'Power Rankings', id: 'Power Rankings', ar: 'تصنيف القوة', ms: 'Kedudukan Kuasa' },
      heroTitle: { en: 'Best 15 of the Tournament', id: 'Best 15 of the Tournament', ar: 'أفضل 15 في البطولة', ms: '15 Terbaik Kejohanan' },
      heroSubtitle: { en: 'The 15 best players across every nation by accumulated points. Click a player or country code for details.', id: '15 pemain terbaik lintas semua negara berdasarkan akumulasi poin. Klik nama pemain atau kode negara untuk lihat detail.', ar: 'أفضل 15 لاعباً من جميع الدول بناءً على إجمالي النقاط. اضغط على اسم اللاعب أو رمز الدولة لمزيد من التفاصيل.', ms: '15 pemain terbaik merentasi semua negara berdasarkan jumlah mata. Klik nama pemain atau kod negara untuk butiran.' },
      disclaimer: {
        en: '15 players with the highest accumulated points from <b>across every team/nation</b> (not per squad), built with a 2 GK – 5 DEF – 5 MID – 3 FWD split, capped at <b>max 3 players per nation</b> (FIFA Fantasy group-stage rule). This is purely a cross-tournament top-performer combination from local scrape data, not an official FIFA prediction or line-up. FIFA Fantasy squad budget is <b>100</b> — 3 variants: <b>Top Score</b> (ignores budget, for reference), <b>In Budget</b> (best score that still fits ≤100, via cheapest-player swaps), and <b>Value Pick</b> (points-per-price efficiency, usually well under budget).',
        id: '15 pemain dengan akumulasi poin tertinggi dari <b>seluruh tim/negara</b> (bukan per squad), disusun dengan komposisi 2 GK – 5 DEF – 5 MID – 3 FWD, dengan batas <b>maksimal 3 pemain per negara</b> (aturan FIFA Fantasy di babak grup). Ini murni gabungan top performer lintas turnamen berdasarkan data lokal hasil scrape, bukan prediksi atau line-up resmi FIFA. Budget squad FIFA Fantasy <b>100</b> — ada 3 varian: <b>Skor Tertinggi</b> (abaikan budget, buat referensi), <b>Dalam Budget</b> (skor terbaik yang masih ≤100, lewat penukaran pemain termurah), dan <b>Hemat (Value)</b> (efisiensi poin per harga, biasanya jauh di bawah budget).',
        ar: '15 لاعباً بأعلى إجمالي نقاط من <b>جميع الفرق/الدول</b> (وليس لكل فريق على حدة)، بتقسيم 2 حارس – 5 دفاع – 5 وسط – 3 هجوم، بحد أقصى <b>3 لاعبين لكل دولة</b> (قاعدة فانتازي فيفا في دور المجموعات). هذا مجرد تجميع لأفضل اللاعبين عبر البطولة من بيانات محلية، وليس تنبؤاً أو تشكيلة رسمية من فيفا. ميزانية تشكيلة فانتازي فيفا هي <b>100</b> — وهناك 3 نسخ: <b>أعلى نتيجة</b> (تتجاهل الميزانية، للمرجعية)، <b>ضمن الميزانية</b> (أفضل نتيجة ضمن حد ≤100، عبر استبدال اللاعبين الأرخص)، و<b>أفضل قيمة</b> (كفاءة النقاط مقابل السعر، عادة أقل من الميزانية بكثير).',
        ms: '15 pemain dengan jumlah mata tertinggi merentasi <b>semua pasukan/negara</b> (bukan setiap skuad), disusun dengan komposisi 2 GK – 5 DEF – 5 MID – 3 FWD, dihadkan kepada <b>maksimum 3 pemain setiap negara</b> (peraturan FIFA Fantasy peringkat kumpulan). Ini hanyalah gabungan pemain terbaik merentasi kejohanan daripada data scrape tempatan, bukan ramalan atau susunan pemain rasmi FIFA. Bajet skuad FIFA Fantasy ialah <b>100</b> — terdapat 3 varian: <b>Markah Tertinggi</b> (mengabaikan bajet, untuk rujukan), <b>Dalam Bajet</b> (markah terbaik yang masih ≤100, melalui penukaran pemain paling murah), dan <b>Pilihan Bernilai</b> (kecekapan mata-per-harga, biasanya jauh di bawah bajet).',
      },
      formationLabel: { en: 'Composition 2-5-5-3 (15 players) · sorted by Total Points, no team cap', id: 'Komposisi 2-5-5-3 (15 pemain) · diurutkan berdasarkan Total Points, tanpa batasan tim', ar: 'تركيبة 2-5-5-3 (15 لاعباً) · مرتبة حسب إجمالي النقاط، دون حد للفريق', ms: 'Komposisi 2-5-5-3 (15 pemain) · disusun mengikut Jumlah Mata, tanpa had pasukan' },
      benchTitle: { en: 'Honourable mentions (top bench per position)', id: 'Honourable mentions (top cadangan per posisi)', ar: 'إشارات تقدير (أفضل الاحتياط لكل مركز)', ms: 'Sebutan istimewa (simpanan terbaik setiap kedudukan)' },
    },
    nextround: {
      kicker: { en: 'Forecast', id: 'Forecast', ar: 'التوقعات', ms: 'Ramalan' },
      heroTitle: { en: 'Next Round Projection', id: 'Next Round Projection', ar: 'توقعات الجولة القادمة', ms: 'Unjuran Pusingan Seterusnya' },
      heroSubtitle: { en: 'Best 15 projection for the next round based on player form + fixture index. Click a player or country code for details.', id: 'Proyeksi Best 15 ronde depan berdasarkan form pemain + indeks fixture. Klik nama pemain atau kode negara untuk lihat detail.', ar: 'توقع أفضل 15 لاعباً للجولة القادمة بناءً على فورمة اللاعب ومؤشر المباراة. اضغط على اسم اللاعب أو رمز الدولة لمزيد من التفاصيل.', ms: 'Unjuran 15 Terbaik untuk pusingan seterusnya berdasarkan bentuk pemain + indeks perlawanan. Klik nama pemain atau kod negara untuk butiran.' },
      disclaimer: {
        en: '<b>The 15-player pick</b> uses a 0–100 index score: 60% current player form (FIFA\'s <code>form</code>/<code>avgPoints</code> fields) + 40% next-round fixture index (Clean Sheet % for GK/DEF, Projected Goals for MID/FWD — from SBOBET/Betfair market projection charts via FPLJoe.com, static manual input as of 27.05.26, <b>not live</b>). <b>The "pts" number per player</b> is a <b>projected fantasy point estimate</b> (not an official score): the player\'s historical average points (<code>avgPoints</code>) multiplied by a fixture factor (up if the team is projected above the 48-team average for that matchday, down if below, capped 0.5×–1.8×). Pick a matchday that team hasn\'t played yet from the dropdown. Capped at <b>max 3 players per nation</b> (FIFA Fantasy group-stage rule). This is neither an official FIFA prediction nor a line-up guarantee.',
        id: '<b>Pemilihan 15 pemain</b> pakai skor indeks 0–100: 60% form pemain terkini (field <code>form</code>/<code>avgPoints</code> dari FIFA) + 40% indeks fixture ronde depan (Clean Sheet % untuk GK/DEF, Projected Goals tim untuk MID/FWD — dari grafik proyeksi pasar SBOBET/Betfair via FPLJoe.com, input manual statis per 27.05.26, <b>tidak live</b>). <b>Angka "pts" di tiap pemain</b> adalah <b>proyeksi poin fantasy</b> (estimasi, bukan poin resmi): rata-rata poin historis pemain (<code>avgPoints</code>) dikalikan faktor fixture (naik kalau tim diproyeksikan di atas rata-rata 48 tim untuk matchday itu, turun kalau di bawah rata-rata, dibatasi 0.5×–1.8×). Pilih matchday yang belum dimainkan tim tersebut di dropdown. Berlaku batas <b>maksimal 3 pemain per negara</b> (aturan FIFA Fantasy di babak grup). Ini bukan prediksi resmi FIFA maupun garansi line-up.',
        ar: '<b>اختيار 15 لاعباً</b> يستخدم مؤشر نتيجة من 0 إلى 100: 60% فورمة اللاعب الحالية (حقول <code>form</code>/<code>avgPoints</code> من فيفا) + 40% مؤشر مباراة الجولة القادمة (نسبة الشباك النظيفة لحراس/مدافعين، الأهداف المتوقعة لوسط/هجوم — من مخططات توقعات سوق SBOBET/Betfair عبر FPLJoe.com، إدخال يدوي ثابت بتاريخ 27.05.26، <b>غير مباشر</b>). <b>رقم "pts" لكل لاعب</b> هو <b>تقدير نقاط فانتازي متوقع</b> (ليس نتيجة رسمية): متوسط نقاط اللاعب التاريخي (<code>avgPoints</code>) مضروباً في عامل المباراة (يرتفع إذا كان الفريق متوقعاً أعلى من متوسط 48 فريقاً لتلك الجولة، ويقل إذا كان أدنى، بحد 0.5×–1.8×). اختر جولة لم يلعبها الفريق بعد من القائمة. بحد أقصى <b>3 لاعبين لكل دولة</b> (قاعدة فانتازي فيفا في دور المجموعات). هذا ليس تنبؤاً رسمياً من فيفا ولا ضماناً للتشكيلة.',
        ms: '<b>Pemilihan 15 pemain</b> menggunakan skor indeks 0–100: 60% bentuk pemain semasa (medan <code>form</code>/<code>avgPoints</code> daripada FIFA) + 40% indeks perlawanan pusingan seterusnya (% Clean Sheet untuk GK/DEF, Unjuran Gol untuk MID/FWD — daripada carta unjuran pasaran SBOBET/Betfair melalui FPLJoe.com, input manual statik setakat 27.05.26, <b>bukan live</b>). <b>Nombor "pts" bagi setiap pemain</b> adalah <b>anggaran mata fantasi unjuran</b> (bukan mata rasmi): purata mata sejarah pemain (<code>avgPoints</code>) didarab dengan faktor perlawanan (naik jika pasukan diunjurkan melebihi purata 48 pasukan untuk matchday itu, turun jika di bawah, dihadkan 0.5×–1.8×). Pilih matchday yang belum dimainkan pasukan itu dalam dropdown. Dihadkan kepada <b>maksimum 3 pemain setiap negara</b> (peraturan FIFA Fantasy peringkat kumpulan). Ini bukan ramalan rasmi FIFA mahupun jaminan susunan pemain.',
      },
      matchdayLabel: { en: 'Projection matchday:', id: 'Matchday proyeksi:', ar: 'جولة التوقع:', ms: 'Matchday unjuran:' },
      unmatchedNote: { en: '{n} players with no team projection data (scored neutral 50)', id: '{n} pemain tanpa data proyeksi tim (dihitung netral 50)', ar: '{n} لاعب بدون بيانات توقع للفريق (يُحسب محايداً 50)', ms: '{n} pemain tanpa data unjuran pasukan (dikira neutral 50)' },
      scoreLabel: { en: 'Score', id: 'Skor', ar: 'النتيجة', ms: 'Skor' },
      estimateSuffix: { en: '(estimate)', id: '(estimasi)', ar: '(تقديري)', ms: '(anggaran)' },
      projectedSquadTitle: { en: 'Projected Best 15', id: 'Best 15 Proyeksi', ar: 'أفضل 15 المتوقع', ms: '15 Terbaik Unjuran' },
      formationLabel: { en: 'Composition {formation} (15 players) · selected from index score (60% form + 40% fixture, average: {avg}/100) · "pts" = projected fantasy points, not an official score', id: 'Komposisi {formation} (15 pemain) · diseleksi dari skor indeks (60% form + 40% fixture, rata-rata: {avg}/100) · "pts" = proyeksi poin fantasy, bukan poin resmi', ar: 'تركيبة {formation} (15 لاعباً) · مختارة من مؤشر النتيجة (60% فورمة + 40% مباراة، المتوسط: {avg}/100) · "pts" = نقاط فانتازي متوقعة، ليست نقاطاً رسمية', ms: 'Komposisi {formation} (15 pemain) · dipilih daripada skor indeks (60% bentuk + 40% perlawanan, purata: {avg}/100) · "pts" = mata fantasi unjuran, bukan mata rasmi' },
      benchTitle: { en: 'Second-tier candidates (top bench per position)', id: 'Kandidat lapis kedua (top cadangan per posisi)', ar: 'مرشحو الصف الثاني (أفضل الاحتياط لكل مركز)', ms: 'Calon lapisan kedua (simpanan terbaik setiap kedudukan)' },
      colScore: { en: 'Score', id: 'Skor', ar: 'النتيجة', ms: 'Skor' },
      colProjPts: { en: 'Proj. pts', id: 'Proyeksi pts', ar: 'النقاط المتوقعة', ms: 'Anggaran pts' },
    },
    research: {
      kicker: { en: 'Deep Dive', id: 'Deep Dive', ar: 'تحليل معمق', ms: 'Analisis Mendalam' },
      heroTitle: { en: 'Best 15 — Research Data', id: 'Best 15 — Data Riset', ar: 'أفضل 15 — بيانات بحثية', ms: '15 Terbaik — Data Penyelidikan' },
      heroSubtitle: { en: 'The most accurate projection: team strength from real match results + next opponent auto-detected from the official FIFA schedule.', id: 'Proyeksi paling akurat: kekuatan tim dari hasil pertandingan nyata + lawan ronde depan terdeteksi otomatis dari jadwal resmi FIFA.', ar: 'التوقع الأكثر دقة: قوة الفريق من نتائج مباريات حقيقية + الخصم القادم يُكتشف تلقائياً من الجدول الرسمي لفيفا.', ms: 'Unjuran paling tepat: kekuatan pasukan daripada keputusan perlawanan sebenar + lawan pusingan seterusnya dikesan secara automatik daripada jadual rasmi FIFA.' },
      disclaimer: {
        en: 'The most accurate version so far: team strength is computed from <b>this tournament\'s real match results</b> (average goals scored/conceded from <code>data/rounds.json</code>, the official FIFA schedule), not pre-tournament market odds. Each team\'s next opponent is also <b>auto-detected</b> from the real schedule (next unplayed group match, kickoff time in WIB) — no manual matchday selection needed. Projected points = player\'s historical <code>avgPoints</code> × opponent strength factor (GK/DEF up if the opponent rarely scores, MID/FWD up if the opponent concedes often), capped 0.5×–1.8×, averaged with an <b>Elo win-expectancy factor</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>) when that match is already published there. Only ever affects the player\'s next unplayed match — a round that has already been played is never recalculated. Capped at max 3 players per nation.',
        id: 'Versi paling akurat sejauh ini: kekuatan tim dihitung dari <b>hasil pertandingan nyata turnamen ini</b> (gol dicetak/kebobolan rata-rata dari <code>data/rounds.json</code>, jadwal resmi FIFA), bukan dari odds pasar sebelum turnamen mulai. Lawan ronde depan untuk tiap tim juga <b>otomatis terdeteksi</b> dari jadwal nyata (pertandingan grup berikutnya yang belum selesai, waktu kickoff dalam WIB) — tidak perlu pilih matchday manual. Proyeksi poin = <code>avgPoints</code> historis pemain × faktor kekuatan lawan (GK/DEF naik kalau lawan jarang cetak gol, MID/FWD naik kalau lawan sering kebobolan), dibatasi 0.5×–1.8×, dirata-rata dengan <b>faktor win expectancy Elo</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>) kalau pertandingan itu sudah dipublikasikan di sana. Hanya memengaruhi pertandingan berikutnya yang belum dimainkan tiap pemain — ronde yang sudah selesai tidak pernah dihitung ulang. Berlaku maksimal 3 pemain per negara.',
        ar: 'الإصدار الأكثر دقة حتى الآن: تُحسب قوة الفريق من <b>نتائج مباريات حقيقية في هذه البطولة</b> (متوسط الأهداف المسجلة/المستقبلة من <code>data/rounds.json</code>، الجدول الرسمي لفيفا)، وليس من احتمالات السوق قبل البطولة. يُكتشف أيضاً <b>تلقائياً</b> خصم كل فريق القادم من الجدول الحقيقي (مباراة المجموعة القادمة غير الملعوبة، بتوقيت WIB) — لا حاجة لاختيار جولة يدوياً. النقاط المتوقعة = <code>avgPoints</code> التاريخي للاعب × عامل قوة الخصم (يرتفع لحراس/مدافعين إذا كان الخصم نادراً ما يسجل، ويرتفع لوسط/هجوم إذا كان الخصم كثيراً ما يستقبل أهدافاً)، بحد 0.5×–1.8×، ويُحسب متوسطه مع <b>عامل احتمالية الفوز من Elo</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>) عندما تكون تلك المباراة منشورة هناك. يؤثر فقط على المباراة القادمة غير الملعوبة لكل لاعب — لا تُعاد حساب جولة لُعبت بالفعل أبداً. بحد أقصى 3 لاعبين لكل دولة.',
        ms: 'Versi paling tepat setakat ini: kekuatan pasukan dikira daripada <b>keputusan perlawanan sebenar kejohanan ini</b> (purata gol dijaringkan/dikebobolkan daripada <code>data/rounds.json</code>, jadual rasmi FIFA), bukan daripada odds pasaran sebelum kejohanan bermula. Lawan pusingan seterusnya bagi setiap pasukan juga <b>dikesan secara automatik</b> daripada jadual sebenar (perlawanan kumpulan seterusnya yang belum selesai, masa baling mula dalam WIB) — tidak perlu pilih matchday secara manual. Unjuran mata = <code>avgPoints</code> sejarah pemain × faktor kekuatan lawan (GK/DEF naik jika lawan jarang menjaringkan gol, MID/FWD naik jika lawan kerap dikebobolkan), dihadkan 0.5×–1.8×, dipuratakan dengan <b>faktor jangkaan menang Elo</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>) jika perlawanan itu sudah diterbitkan di sana. Hanya menjejaskan perlawanan seterusnya yang belum dimainkan bagi setiap pemain — pusingan yang sudah selesai tidak sekali-kali dikira semula. Dihadkan kepada maksimum 3 pemain setiap negara.',
      },
      gapNoOpponent: { en: '{n} players from teams with no detected next group match (group stage may already be over, or team data mismatch) — counted as neutral (×1 factor).', id: '{n} pemain dari tim tanpa pertandingan grup berikutnya yang terdeteksi (mungkin sudah selesai fase grup atau data tim tidak cocok) — dihitung netral (faktor ×1).', ar: '{n} لاعب من فرق دون مباراة مجموعة قادمة مكتشفة (قد تكون مرحلة المجموعات انتهت، أو تعارض في بيانات الفريق) — تُحسب كعامل محايد (×1).', ms: '{n} pemain daripada pasukan tanpa perlawanan kumpulan seterusnya yang dikesan (peringkat kumpulan mungkin sudah tamat, atau data pasukan tidak sepadan) — dikira neutral (faktor ×1).' },
      gapNoTeamData: { en: '{n} players whose next opponent has no match-result history yet (×1 factor).', id: '{n} pemain dengan lawan berikutnya yang belum punya riwayat hasil pertandingan (faktor ×1).', ar: '{n} لاعب لخصمهم القادم لا يوجد سجل نتائج مباريات بعد (عامل ×1).', ms: '{n} pemain dengan lawan seterusnya yang belum mempunyai sejarah keputusan perlawanan (faktor ×1).' },
      gapNotePrefix: { en: 'Data note: ', id: 'Catatan data: ', ar: 'ملاحظة البيانات: ', ms: 'Nota data: ' },
      gapNoteAllMapped: { en: 'All players were successfully mapped to their next opponent with match-result history.', id: 'Semua pemain berhasil dipetakan ke lawan berikutnya dengan data riwayat pertandingan.', ar: 'تم ربط جميع اللاعبين بنجاح بخصومهم القادمين مع سجل نتائج المباريات.', ms: 'Semua pemain berjaya dipadankan dengan lawan seterusnya yang mempunyai sejarah keputusan perlawanan.' },
      winLabel: { en: 'win', id: 'menang', ar: 'فوز', ms: 'menang' },
      noOpponentDetected: { en: 'opponent not detected yet', id: 'lawan belum terdeteksi', ar: 'الخصم غير محدد بعد', ms: 'lawan belum dikesan' },
      formationLabel: { en: 'Composition 2-5-5-3 (15 players) · projection based on actual team strength + auto-detected next-round opponent', id: 'Komposisi 2-5-5-3 (15 pemain) · proyeksi berbasis kekuatan tim aktual + lawan ronde depan otomatis', ar: 'تركيبة 2-5-5-3 (15 لاعباً) · توقع مبني على قوة الفريق الفعلية + خصم الجولة القادمة المكتشف تلقائياً', ms: 'Komposisi 2-5-5-3 (15 pemain) · unjuran berdasarkan kekuatan pasukan sebenar + lawan pusingan seterusnya dikesan automatik' },
      benchTitle: { en: 'Second-tier candidates (top bench per position)', id: 'Kandidat lapis kedua (top cadangan per posisi)', ar: 'مرشحو الصف الثاني (أفضل الاحتياط لكل مركز)', ms: 'Calon lapisan kedua (simpanan terbaik setiap kedudukan)' },
      colNextOpponent: { en: 'Next Opponent', id: 'Lawan depan', ar: 'الخصم القادم', ms: 'Lawan Seterusnya' },
    },
    groups: {
      kicker: { en: 'Group Stage Live', id: 'Group Stage Live', ar: 'دور المجموعات مباشر', ms: 'Peringkat Kumpulan Live' },
      heroTitle: { en: 'Standings & Fixtures', id: 'Klasemen & Jadwal', ar: 'الترتيب والمباريات', ms: 'Kedudukan & Perlawanan' },
      heroSubtitle: { en: '12 group standings, real-time Round-of-32 projection, and upcoming fixtures — all times in WIB (Indonesia time). Click a team code for match results & roster.', id: 'Klasemen 12 grup, proyeksi babak 32 besar real-time, dan jadwal mendatang — semua jam dalam WIB. Klik kode tim untuk lihat hasil pertandingan & roster.', ar: 'ترتيب 12 مجموعة، توقع دور الـ32 لحظي، والمباريات القادمة — جميع الأوقات بتوقيت WIB (توقيت إندونيسيا). اضغط على رمز الفريق لعرض نتائج المباريات والتشكيلة.', ms: 'Kedudukan 12 kumpulan, unjuran Pusingan 32 masa nyata, dan perlawanan akan datang — semua masa dalam WIB (waktu Indonesia). Klik kod pasukan untuk lihat keputusan perlawanan & senarai pemain.' },
      tabStandings: { en: 'Standings', id: 'Klasemen', ar: 'الترتيب', ms: 'Kedudukan' },
      tabThirds: { en: 'Third-Place Ranking', id: 'Ranking Peringkat 3', ar: 'ترتيب المركز الثالث', ms: 'Kedudukan Tempat Ketiga' },
      tabBracket: { en: 'R32 Projection', id: 'Proyeksi 32 Besar', ar: 'توقع دور الـ32', ms: 'Unjuran Pusingan 32' },
      tabFixtures: { en: 'Upcoming Fixtures', id: 'Jadwal Mendatang', ar: 'المباريات القادمة', ms: 'Perlawanan Akan Datang' },
      thirdsTitle: { en: 'Third-Place Ranking (Best 8 Qualify)', id: 'Ranking Peringkat 3 (8 Terbaik Lolos)', ar: 'ترتيب المركز الثالث (أفضل 8 يتأهلون)', ms: 'Kedudukan Tempat Ketiga (8 Terbaik Layak)' },
      bracketTitle: { en: 'Knockout Bracket Projection', id: 'Proyeksi Bracket Babak Gugur', ar: 'توقع شجرة دور خروج المغلوب', ms: 'Unjuran Bracket Pusingan Kalah Mati' },
      legendConfirmed: { en: 'Confirmed team (final standings / official result)', id: 'Tim pasti (klasemen final / hasil resmi)', ar: 'فريق مؤكد (ترتيب نهائي / نتيجة رسمية)', ms: 'Pasukan pasti (kedudukan akhir / keputusan rasmi)' },
      legendLive: { en: 'Current position (standings not final yet, may change)', id: 'Posisi saat ini (klasemen belum final, bisa berubah)', ar: 'الموضع الحالي (الترتيب غير نهائي، قد يتغير)', ms: 'Kedudukan semasa (kedudukan belum muktamad, boleh berubah)' },
      thirdPlaceTitle: { en: 'Third Place Play-off', id: 'Perebutan Juara 3', ar: 'مباراة تحديد المركز الثالث', ms: 'Perlawanan Tempat Ketiga' },
      bracketTimeNote: { en: 'Kickoff times shown are as published by the source (venue/organizer timezone), not yet converted to WIB.', id: 'Jam pada bagan ini sesuai sumber data asli (zona waktu venue/penyelenggara), belum dikonversi ke WIB.', ar: 'أوقات بدء المباريات المعروضة هي كما نشرها المصدر (توقيت الملعب/المنظم)، ولم تُحوَّل بعد إلى WIB.', ms: 'Masa baling mula yang dipaparkan adalah seperti yang diterbitkan oleh sumber (zon waktu venue/penganjur), belum ditukar ke WIB.' },
      fixturesTitle: { en: 'Upcoming Fixtures (Group Stage)', id: 'Jadwal Pertandingan Mendatang (Fase Grup)', ar: 'المباريات القادمة (دور المجموعات)', ms: 'Perlawanan Akan Datang (Peringkat Kumpulan)' },
      legendDirect: { en: 'Direct qualifier (1st/2nd place)', id: 'Lolos langsung (juara/runner-up)', ar: 'تأهل مباشر (المركز الأول/الثاني)', ms: 'Layak terus (tempat pertama/kedua)' },
      legendThird: { en: '3rd place — qualification candidate', id: 'Peringkat 3 — kandidat lolos', ar: 'المركز الثالث — مرشح للتأهل', ms: 'Tempat ketiga — calon layak' },
      colDateTimeWIB: { en: 'Date & Time (WIB)', id: 'Tanggal & Waktu (WIB)', ar: 'التاريخ والوقت (WIB)', ms: 'Tarikh & Masa (WIB)' },
      colFixture: { en: 'Fixture', id: 'Pertandingan', ar: 'المباراة', ms: 'Perlawanan' },
      colWinExp: { en: 'Win Expectancy', id: 'Win Expectancy', ar: 'احتمالية الفوز', ms: 'Jangkaan Menang' },
      eloSourceNote: { en: 'Win expectancy from <b>World Football Elo Ratings</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>), based on each team\'s Elo rating — not an official FIFA forecast.', id: 'Win expectancy dari <b>World Football Elo Ratings</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>), berdasarkan rating Elo tiap tim — bukan prediksi resmi FIFA.', ar: 'احتمالية الفوز من <b>World Football Elo Ratings</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>)، بناءً على تصنيف Elo لكل فريق — وليست تنبؤاً رسمياً من فيفا.', ms: 'Jangkaan menang daripada <b>World Football Elo Ratings</b> (<a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer">eloratings.net</a>), berdasarkan rating Elo setiap pasukan — bukan ramalan rasmi FIFA.' },
      thirdSlotsTitle: { en: 'R32 Slot Assignment (3rd-Place per Slot)', id: 'R32 Slot Assignment (Peringkat-3 per Slot)', ar: 'توزيع مقاعد دور الـ32 (المركز الثالث لكل مقعد)', ms: 'Penetapan Slot R32 (Tempat Ketiga setiap Slot)' },
      thirdSlotsNote: { en: 'Each R32 slot for a 3rd-placed team only draws from a fixed set of groups (see each table\'s label). Since a group can appear in more than one slot, a single 3rd-placed team can only represent one slot — if it\'s already taken by an earlier slot, the next slot automatically falls to the next-best available team.', id: 'Tiap slot babak 32 besar untuk peringkat-3 hanya mengambil dari grup tertentu (lihat label tiap tabel). Karena satu grup bisa muncul di lebih dari satu slot, satu tim peringkat-3 hanya bisa jadi wakil di salah satu slot — kalau sudah terpakai di slot lain, slot berikutnya otomatis jatuh ke peringkat berikutnya yang masih tersedia.', ar: 'كل مقعد في دور الـ32 لفريق المركز الثالث يُسحب فقط من مجموعة ثابتة من المجموعات (انظر عنوان كل جدول). وبما أن مجموعة واحدة قد تظهر في أكثر من مقعد، فإن فريق المركز الثالث الواحد لا يمكن أن يمثل إلا مقعداً واحداً — إذا كان قد أُخذ في مقعد سابق، ينتقل المقعد التالي تلقائياً إلى أفضل فريق متاح بعده.', ms: 'Setiap slot pusingan 32 untuk pasukan tempat ketiga hanya diambil daripada set kumpulan tertentu (lihat label setiap jadual). Oleh kerana satu kumpulan boleh muncul dalam lebih daripada satu slot, satu pasukan tempat ketiga hanya boleh mewakili satu slot — jika sudah diambil oleh slot lebih awal, slot seterusnya secara automatik jatuh kepada pasukan terbaik seterusnya yang masih tersedia.' },
      thirdSlotLabel: { en: '3rd Place — Group {groups}', id: 'Peringkat-3 Grup {groups}', ar: 'المركز الثالث — مجموعة {groups}', ms: 'Tempat Ketiga — Kumpulan {groups}' },
      r32Rep: { en: 'R32 Representative', id: 'Wakil R32', ar: 'ممثل دور الـ32', ms: 'Wakil R32' },
      r32UsedElsewhere: { en: 'Already used in another slot', id: 'Sudah wakil slot lain', ar: 'مستخدَم بالفعل في مقعد آخر', ms: 'Sudah menjadi wakil slot lain' },
      disclaimer: {
        en: 'Group standings & schedule from <b>official FIFA data</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). Ranking <b>does not yet account for head-to-head</b> among teams tied on points — only Points → Goal Difference → Goals For. The Round-of-32 projection is computed automatically from the <b>current</b> standings (group winners/runners-up + the 8 best 3rd-placed teams, per the 2026 World Cup format) — <b>will change</b> as matches are played, and is only final once the group stage ends.',
        id: 'Klasemen & jadwal grup dari <b>data resmi FIFA</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). Urutan <b>belum memperhitungkan head-to-head</b> antar tim dengan poin sama — hanya Poin → Selisih Gol → Gol Memasukkan. Proyeksi babak 32 besar dihitung otomatis dari klasemen <b>saat ini</b> (juara & runner-up tiap grup + 8 tim peringkat-3 terbaik, sesuai format Piala Dunia 2026) — <b>akan berubah</b> seiring pertandingan berjalan, baru final setelah fase grup selesai.',
        ar: 'ترتيب وجدول المجموعات من <b>بيانات فيفا الرسمية</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). الترتيب <b>لا يأخذ بعين الاعتبار حتى الآن المواجهة المباشرة</b> بين الفرق المتساوية بالنقاط — فقط النقاط ← فرق الأهداف ← الأهداف المسجلة. يُحسب توقع دور الـ32 تلقائياً من الترتيب <b>الحالي</b> (أبطال ووصيف كل مجموعة + أفضل 8 فرق بالمركز الثالث، وفق نظام كأس العالم 2026) — <b>سيتغير</b> مع تقدم المباريات، ولن يكون نهائياً إلا بعد انتهاء دور المجموعات.',
        ms: 'Kedudukan & jadual kumpulan daripada <b>data rasmi FIFA</b> (<code>play.fifa.com/json/fantasy/rounds.json</code>). Susunan <b>belum mengambil kira pertembungan langsung</b> antara pasukan yang sama mata — hanya Mata → Perbezaan Gol → Gol Dijaringkan. Unjuran Pusingan 32 dikira secara automatik daripada kedudukan <b>semasa</b> (juara & naib juara setiap kumpulan + 8 pasukan tempat ketiga terbaik, mengikut format Piala Dunia 2026) — <b>akan berubah</b> seiring perlawanan berlangsung, dan hanya muktamad selepas peringkat kumpulan tamat.',
      },
    },
    mysquad: {
      kicker: { en: 'Draft Room', id: 'Draft Room', ar: 'غرفة الاختيار', ms: 'Bilik Draf' },
      heroTitle: { en: 'Build Your Squad', id: 'Susun Skuad Kamu', ar: 'بناء تشكيلتك', ms: 'Bina Skuad Anda' },
      heroSubtitle: { en: 'Pick 15 players (2 GK – 5 DEF – 5 MID – 3 FWD) within a 100 budget. Click "+" to add, click a squad player for details or to remove. Saved automatically in this browser.', id: 'Pilih 15 pemain (2 GK – 5 DEF – 5 MID – 3 FWD) dengan budget 100. Klik "+" untuk menambah, klik pemain di skuad untuk lihat detail atau hapus. Tersimpan otomatis di browser ini.', ar: 'اختر 15 لاعباً (2 حارس – 5 دفاع – 5 وسط – 3 هجوم) بميزانية 100. اضغط "+" للإضافة، واضغط على لاعب في التشكيلة لعرض التفاصيل أو إزالته. يُحفظ تلقائياً في هذا المتصفح.', ms: 'Pilih 15 pemain (2 GK – 5 DEF – 5 MID – 3 FWD) dalam bajet 100. Klik "+" untuk menambah, klik pemain dalam skuad untuk butiran atau membuang. Disimpan secara automatik dalam pelayar ini.' },
      sortTotalPoints: { en: 'Sort: Total Points', id: 'Urut: Total Points', ar: 'ترتيب: إجمالي النقاط', ms: 'Susun: Jumlah Mata' },
      sortPrice: { en: 'Sort: Price', id: 'Urut: Harga', ar: 'ترتيب: السعر', ms: 'Susun: Harga' },
      sortForm: { en: 'Sort: Form', id: 'Urut: Form', ar: 'ترتيب: الفورمة', ms: 'Susun: Bentuk' },
      budget: { en: 'Budget', id: 'Budget', ar: 'الميزانية', ms: 'Bajet' },
      players: { en: 'Players', id: 'Pemain', ar: 'اللاعبون', ms: 'Pemain' },
      totalPts: { en: 'Total Pts', id: 'Total Pts', ar: 'إجمالي النقاط', ms: 'Jumlah Mata' },
      avgPerPlayer: { en: 'Avg/Player', id: 'Avg/Pemain', ar: 'المتوسط/لاعب', ms: 'Purata/Pemain' },
      clearSquad: { en: 'Clear Squad', id: 'Kosongkan Skuad', ar: 'تفريغ التشكيلة', ms: 'Kosongkan Skuad' },
      clearConfirm: { en: 'Clear the entire squad?', id: 'Kosongkan seluruh skuad?', ar: 'تفريغ التشكيلة بالكامل؟', ms: 'Kosongkan seluruh skuad?' },
    },
    modal: {
      roundsTitle: { en: 'Per-Round Stats & Match Results', id: 'Stats per Ronde & Hasil Pertandingan', ar: 'إحصاءات كل جولة ونتائج المباريات', ms: 'Statistik Setiap Pusingan & Keputusan Perlawanan' },
      noMatchData: { en: 'No match data yet.', id: 'Belum ada data pertandingan.', ar: 'لا توجد بيانات مباريات بعد.', ms: 'Belum ada data perlawanan.' },
      officialBreakdown: { en: 'Official scoring breakdown', id: 'Breakdown rumus resmi', ar: 'تفصيل النقاط الرسمي', ms: 'Pecahan formula rasmi' },
      matchesTitle: { en: 'Match Results & Fixtures', id: 'Hasil & Jadwal Pertandingan', ar: 'نتائج وجدول المباريات', ms: 'Keputusan & Jadual Perlawanan' },
      noMatches: { en: 'No match results yet.', id: 'Belum ada hasil pertandingan.', ar: 'لا توجد نتائج مباريات بعد.', ms: 'Belum ada keputusan perlawanan.' },
      rosterTitle: { en: 'Roster (sorted by Total Points)', id: 'Roster (diurutkan Total Points)', ar: 'التشكيلة (مرتبة بإجمالي النقاط)', ms: 'Senarai Pemain (disusun mengikut Jumlah Mata)' },
      noRoster: { en: 'No players for this team.', id: 'Tidak ada pemain untuk tim ini.', ar: 'لا يوجد لاعبون لهذا الفريق.', ms: 'Tiada pemain untuk pasukan ini.' },
      loading: { en: 'Loading...', id: 'Memuat...', ar: 'جارٍ التحميل...', ms: 'Memuatkan...' },
      loadingPlayer: { en: 'Loading player data...', id: 'Memuat data pemain...', ar: 'جارٍ تحميل بيانات اللاعب...', ms: 'Memuatkan data pemain...' },
      loadingTeam: { en: 'Loading team data...', id: 'Memuat data tim...', ar: 'جارٍ تحميل بيانات الفريق...', ms: 'Memuatkan data pasukan...' },
      home: { en: 'Home', id: 'Kandang', ar: 'أرض الفريق', ms: 'Rumah' },
      away: { en: 'Away', id: 'Tandang', ar: 'أرض الخصم', ms: 'Tandang' },
      goals: { en: 'Goals', id: 'Gol', ar: 'الأهداف', ms: 'Gol' },
      playerNotFound: { en: 'Player not found.', id: 'Pemain tidak ditemukan.', ar: 'اللاعب غير موجود.', ms: 'Pemain tidak dijumpai.' },
      teamNotFound: { en: 'Team not found.', id: 'Tim tidak ditemukan.', ar: 'الفريق غير موجود.', ms: 'Pasukan tidak dijumpai.' },
      notPlayedYet: { en: 'Not played yet', id: 'Belum main', ar: 'لم تُلعب بعد', ms: 'Belum dimainkan' },
      winChance: { en: 'win chance', id: 'kesempatan menang', ar: 'فرصة الفوز', ms: 'peluang menang' },
      nextMatch: { en: 'Next match', id: 'Pertandingan berikutnya', ar: 'المباراة القادمة', ms: 'Perlawanan seterusnya' },
    },
    footer: {
      lastSync: { en: 'Data last synced', id: 'Data terakhir disinkronkan', ar: 'آخر مزامنة للبيانات', ms: 'Data terakhir disegerakkan' },
      ago: { en: 'ago', id: 'lalu', ar: 'مضت', ms: 'lalu' },
      justNow: { en: 'just now', id: 'baru saja', ar: 'الآن', ms: 'baru sahaja' },
      players: { en: 'players', id: 'pemain', ar: 'لاعب', ms: 'pemain' },
      noSync: { en: 'Sync time unavailable — run', id: 'Waktu sinkronisasi data tidak tersedia — jalankan', ar: 'وقت المزامنة غير متوفر — شغّل', ms: 'Masa penyegerakan tidak tersedia — jalankan' },
      toCreate: { en: 'to generate', id: 'untuk membuat', ar: 'لإنشاء', ms: 'untuk menjana' },
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

  function applyDirection(lang) {
    document.documentElement.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyDirection(lang);
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
    const current = LANGS.find((l) => l.code === lang) || LANGS[0];
    document.querySelectorAll('.lang-switch').forEach((wrap) => {
      const trigger = wrap.querySelector('.lang-switch-trigger');
      if (trigger) trigger.textContent = current.code.toUpperCase();
      wrap.querySelectorAll('.lang-switch-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.lang === lang);
      });
    });
  }

  function injectSwitcher() {
    const style = document.createElement('style');
    style.textContent = `
      .lang-switch { position: relative; display: inline-block; }
      .lang-switch-trigger {
        background: var(--panel); color: var(--text-dim); border: 1px solid var(--border);
        border-radius: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer;
        font-family: 'JetBrains Mono', monospace; font-weight: 700; display: inline-flex;
        align-items: center; gap: 5px;
      }
      .lang-switch-trigger:hover { background: var(--row-hover); color: var(--text); }
      .lang-switch-caret { font-size: 9px; opacity: .75; }
      .lang-switch-menu {
        display: none; flex-direction: column; gap: 2px;
        position: absolute; top: calc(100% + 6px); right: 0; min-width: 160px;
        background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
        padding: 6px; z-index: 1100; box-shadow: 0 10px 28px rgba(0,0,0,0.3);
      }
      [dir="rtl"] .lang-switch-menu { right: auto; left: 0; }
      .lang-switch.open .lang-switch-menu { display: flex; }
      .lang-switch-item {
        padding: 8px 12px; border-radius: 6px; font-size: 13px; color: var(--text-dim);
        cursor: pointer; font-family: 'JetBrains Mono', monospace; white-space: nowrap; text-align: left;
        background: none; border: none;
      }
      [dir="rtl"] .lang-switch-item { text-align: right; }
      .lang-switch-item:hover { background: var(--row-hover); color: var(--text); }
      .lang-switch-item.active { background: var(--accent); color: #1a1500; font-weight: 700; }
      .page-header-actions { display: flex; gap: 8px; align-items: center; }
    `;
    document.head.appendChild(style);

    const header = document.querySelector('.page-header');
    if (!header) return;
    const switcher = document.createElement('div');
    switcher.className = 'lang-switch';
    switcher.innerHTML = `
      <button type="button" class="lang-switch-trigger">EN <span class="lang-switch-caret">▾</span></button>
      <div class="lang-switch-menu">
        ${LANGS.map((l) => `<button type="button" class="lang-switch-item" data-lang="${l.code}">${l.label}</button>`).join('')}
      </div>
    `;
    switcher.querySelector('.lang-switch-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      switcher.classList.toggle('open');
    });
    switcher.querySelectorAll('.lang-switch-item').forEach((item) => {
      item.addEventListener('click', () => {
        setLang(item.dataset.lang);
        switcher.classList.remove('open');
      });
    });
    document.addEventListener('click', () => switcher.classList.remove('open'));

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
    applyDirection(getLang());
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
