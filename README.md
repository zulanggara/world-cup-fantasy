# FIFA Fantasy Scraper + Viewer

Scraper untuk data FIFA Fantasy (diproteksi Akamai Bot Manager) + viewer tabel HTML lokal.

## Setup

```bash
npm install
npx playwright install chromium
```

## Scrape data

```bash
# test cepat dengan beberapa pemain saja
node scraper.js --ids 1,9,682 --with-stats

# scrape semua pemain (players.json saja, tanpa stats)
node scraper.js

# scrape semua pemain + semua stats (bisa lama, ada rate limiting)
node scraper.js --with-stats

# kalau Akamai memblokir mode headless, paksa browser headed
node scraper.js --with-stats --headful
```

Output:
- `data/players.json` — daftar semua pemain
- `data/stats/{id}.json` — stats per ronde untuk pemain `{id}` (hanya dibuat kalau `--with-stats` dipakai)
- `data/squads.json` — daftar 48 negara
- `data/matches.json` — jadwal & hasil pertandingan Piala Dunia 2026 (selalu di-fetch setiap `node scraper.js` dijalankan, dari `worldcup26.ir/get/games`, request HTTPS langsung tanpa browser karena situsnya tidak diproteksi Akamai)
- `data/rounds.json` — fixture & hasil **resmi FIFA** (`play.fifa.com/json/fantasy/rounds.json`), selalu di-fetch juga. `homeSquadId`/`awaySquadId` di sini langsung cocok dengan `squads.json` (tidak perlu name-mapping seperti `matches.json`/worldcup26.ir), dan tanggalnya ISO 8601 dengan offset yang benar — jadi bisa dikonversi akurat ke WIB.
- `data/sync_meta.json` — ditulis di akhir setiap `node scraper.js` jalan: `{ lastSync, playersCount, withStats }`. Dipakai `footer.js` untuk menampilkan "terakhir disinkronkan" di tiap halaman.

### Cara kerja scraper (Akamai)

1. Buka `https://play.fifa.com/` dengan Playwright Chromium agar sensor JS Akamai jalan dan menanam cookie (`_abck`, `bm_sz`, `ak_bmsc`).
2. Tunggu network idle + 4 detik tambahan, baru fetch endpoint JSON **dari dalam context halaman** (`page.evaluate` + `fetch(credentials:'include')`) supaya cookie & header `sec-fetch-site` ikut terkirim.
3. Spoof `navigator.webdriver`, `navigator.languages`, `navigator.platform` lewat `addInitScript`.
4. Kalau cookie `_abck` tidak muncul setelah load di mode headless, scraper otomatis fallback ke mode headed (browser terlihat) dan mengulang proses warm-up.
5. Tiap fetch yang gagal/non-JSON (kena challenge) di-retry 1x dengan delay lebih lama, lalu di-skip + dicatat ke stderr kalau tetap gagal.
6. Fetch stats per pemain dijalankan dengan concurrency 3 + delay acak 300–800ms antar request untuk menghindari rate-limit.

Progress log dicetak ke stderr, contoh:
```
[init] Akamai cookies present: _abck=true bm_sz=true ak_bmsc=false
[players] saved 1488 players -> data/players.json
[1/3] fetched player 1
[2/3] fetched player 9
[3/3] fetched player 682
[done] scrape complete.
```

## Jalankan viewer

Viewer **harus** dijalankan via HTTP server (bukan `file://`) karena pakai `fetch()` untuk baca file JSON lokal — browser memblokir fetch ke `file://` karena CORS.

```bash
npx serve .
# buka http://localhost:3000 (atau port yang ditampilkan di terminal)
```

Ada 7 halaman, dihubungkan lewat tab navigasi konsisten (`Daftar Pemain` / `Compare Tim` / `Best 15 Keseluruhan` / `Prediksi Ronde Depan` / `Best 15 (Riset)` / `Klasemen & Jadwal` / `Susun Skuad`) di bagian atas tiap halaman, dengan tab aktif ditandai warna accent. Tema visual "Stadium Night" (font Bricolage Grotesque + JetBrains Mono, palet hijau-amber) didefinisikan satu kali di [theme.css](fifa-fantasy/theme.css) dan dipakai bersama lewat `<link>` di semua halaman.

### Detail pemain & tim (klik untuk lihat) — `detail-modal.js`
Shared module (`<script src="detail-modal.js">`) dipakai di semua halaman. Klik nama pemain di mana pun (tabel, chip Best 15, slot skuad) membuka **modal overlay**:
- **Modal pemain**: breakdown poin per ronde (stat mentah + breakdown rumus resmi "How to Score", sama seperti yang dulu ada inline di `index.html`) **plus** konteks hasil pertandingan ronde itu (lawan, skor, home/away) — didapat dari join `stats/{id}.json` (field `tournamentId`) ke `data/rounds.json`.
- **Modal tim**: hasil & jadwal pertandingan tim itu (termasuk pencetak gol, dari `homeGoalScorersAssists`/`awayGoalScorersAssists` di `rounds.json`) + roster lengkap diurutkan `totalPoints` tertinggi ke terendah, tiap nama pemain di roster bisa diklik lagi untuk lihat modal pemain.
- Modal bisa ditutup lewat tombol ✕, klik di luar kartu, atau tombol Esc.

### Last sync footer — `footer.js`
Shared module (`<script src="footer.js">`) dipasang di semua halaman, membaca `data/sync_meta.json` dan menampilkan footer "Data terakhir disinkronkan: `<tanggal WIB>` (`<X menit/jam lalu>`)" dengan indikator titik warna (hijau <2 jam, amber 2–6 jam, merah >6 jam) supaya jelas kalau data sudah basi dan perlu `node scraper.js` ulang.

### Halaman Susun Skuad (`my-squad.html`)
Draft manual: cari & filter pemain di tabel kiri, klik "+ Tambah" untuk masukkan ke skuad di panel kanan. Validasi otomatis menolak penambahan kalau melanggar aturan FIFA Fantasy (komposisi 2 GK–5 DEF–5 MID–3 FWD, budget 100, maksimal 3 pemain/negara) dengan pesan singkat kenapa ditolak. Budget bar, total poin, dan rata-rata poin per pemain ter-update live. Susunan skuad disimpan di `localStorage` (`fifa-fantasy-my-squad`) jadi tetap ada walau browser ditutup/refresh. Klik nama pemain di slot untuk lihat detail atau ✕ untuk hapus.

### Budget squad (semua halaman Best 15)
Setiap halaman yang menyusun Best 15 (`best-xi.html`, `best15-overall.html`, `best15-next-round.html`, `best15-research.html`) sekarang menampilkan **harga** (`price` dari `players.json`) di tiap pemain dan total harga squad, dibandingkan dengan budget standar FIFA Fantasy **100**. Logikanya ada di [squad-builder.js](fifa-fantasy/squad-builder.js) (dipakai bersama lewat `<script src="squad-builder.js">`, tidak didup­likasi per halaman) dan menghasilkan **3 varian** yang bisa dipilih lewat tab:
- **Skor Tertinggi** — susunan terbaik murni berdasarkan metrik halaman tersebut (poin/skor), tanpa peduli budget. Kadang sudah otomatis ≤100, kadang tidak (badge merah kalau melebihi).
- **Dalam Budget** — mulai dari "Skor Tertinggi", lalu menukar pemain termahal dengan alternatif lebih murah di posisi yang sama (cari penukaran dengan kerugian skor paling kecil per harga yang dihemat) sampai total ≤100. Ini default yang ditampilkan.
- **Hemat (Value)** — pilih berdasarkan rasio skor/harga (value pick), biasanya jauh di bawah budget, cocok kalau mau sisa budget untuk transfer berikutnya.
- Di `best-xi.html`, karena satu tim isinya satu negara saja, batas "maksimal 3 per negara" tidak diberlakukan (cap dilonggarkan) — tapi tetap dibatasi formasi 2-5-5-3. Ranking semua tim di halaman itu juga sekarang pakai varian "Dalam Budget" sebagai default biar konsisten dengan tampilan compare.
- Algoritma penukaran budget ini adalah **heuristik greedy**, bukan solver optimal sempurna (true combinatorial optimization) — cukup baik untuk kasus 15 slot + cap 3/negara, tapi bisa saja ada kombinasi lain yang sedikit lebih baik yang tidak ditemukan.

Fitur viewer (`index.html`, vanilla JS, tanpa build step):
- Hero "FIFA Fantasy Newsroom" dengan ringkasan live (total pemain, jumlah status `playing`, poin tertinggi saat ini).
- Search nama, filter posisi (GK/DEF/MID/FWD), filter status, sort klik header, kolom **Tim** (klik → modal tim).
- Klik nama pemain → modal breakdown stats per ronde + konteks hasil pertandingan (lihat bagian `detail-modal.js` di atas) — menggantikan mekanisme expand-row inline yang dulu dipakai.
- Dark mode default, toggle ke light mode.
- Poin resmi per ronde (field `points`) ditampilkan sebagai angka utama di modal. Di bawahnya ada **breakdown perhitungan sesuai rumus resmi "How to Score"** FIFA Fantasy (Appearance, Assist, Goal, Clean Sheet, Tackles/Chances Created/Shots on Target bonus, dst., dengan bobot berbeda per posisi GK/DEF/MID/FWD). Breakdown ini dihitung dari rumus resmi, bukan tebakan — tervalidasi cocok dengan field `points` di banyak kasus.
  - Kalau ada selisih antara breakdown dan poin resmi, modal menampilkan catatan selisih. Ini biasanya berasal dari **scouting bonus** (+2 jika pemain raih >4 pts dan dipilih <5% pemain saat pertandingan berlangsung) — bonus ini tidak bisa dihitung ulang secara pasti karena data `percentSelected` yang tersimpan adalah persentase saat scrape dijalankan, bukan snapshot historis saat pertandingan itu berlangsung.

### Halaman Compare Best 15 Antar Tim (`best-xi.html`)
- Pilih dua tim (squad) dari dropdown (data dari `data/squads.json`), lalu halaman menyusun **Best 15 per tim** dengan komposisi heuristik 2 GK – 5 DEF – 5 MID – 3 FWD, diambil dari pemain dengan `totalPoints` tertinggi di posisi masing-masing.
- Menampilkan starting line-up di tampilan "lapangan", sisa pemain di tabel bangku cadangan, dan ringkasan "verdict" perbandingan total poin kedua Best 15.
- Di bawahnya ada **ranking Best 15 semua tim/negara** (bukan cuma 2 yang dipilih) — tabel berisi seluruh squad yang punya pemain, diurutkan dari poin Best 15 tertinggi ke terendah.
- **Ini bukan prediksi hasil pertandingan resmi** — murni perbandingan akumulasi poin fantasy pemain antar squad.

### Halaman Best 15 Keseluruhan (`best15-overall.html`)
- Menyusun **15 pemain terbaik dari seluruh tim/negara** (lintas squad, bukan per tim), dengan komposisi yang sama 2 GK – 5 DEF – 5 MID – 3 FWD, diambil murni dari `totalPoints` tertinggi per posisi tanpa peduli squad asal.
- Menerapkan batas **maksimal 3 pemain per negara** (aturan FIFA Fantasy babak grup) — kalau slot ke-4 dari negara yang sama muncul, pemain itu otomatis turun ke daftar cadangan, lanjut ke kandidat berikutnya.
- Tiap chip pemain menampilkan kode tim asal (abbr dari `squads.json`) agar tetap jelas dari negara mana.
- Ada tabel "honourable mentions" — top kandidat per posisi yang tidak masuk 15 besar.

### Halaman Prediksi Best 15 Ronde Depan (`best15-next-round.html`)
- Menyusun Best 15 (2 GK – 5 DEF – 5 MID – 3 FWD) berdasarkan **skor proyeksi gabungan**, bukan `totalPoints` akumulasi seperti 2 halaman sebelumnya:
  - **60% form pemain** — dari field `form` (fallback ke `avgPoints` kalau `form` tidak ada).
  - **40% indeks fixture ronde depan** — untuk GK/DEF pakai Clean Sheet % tim lawan berikutnya, untuk MID/FWD pakai Projected Goals tim sendiri. Sumber: `data/team_projections.json`, hasil input manual dari grafik proyeksi pasar SBOBET/Betfair via FPLJoe.com (snapshot per 27.05.26, **statis, bukan live**).
  - Kedua komponen dinormalisasi 0–100 per grup posisi sebelum digabung, supaya skala form dan skala fixture sebanding.
- Dropdown pemilihan matchday (MD1/MD2/MD3) — pilih matchday yang **belum dimainkan** tim terkait (cek dulu jadwal aktual, mis. dari `world_cup_2026_group_stage.json` atau grafik fixtures), karena halaman ini tidak otomatis mendeteksi matchday mana yang sudah lewat.
- **Pemilihan** 15 pemain pakai skor indeks 0–100 (bukan satuan poin). **Ditampilkan terpisah**: proyeksi poin fantasy per pemain (`avgPoints` historis × faktor fixture, dibatasi 0.5×–1.8×) — dilabeli jelas sebagai estimasi, bukan poin resmi.
- Pemain dari tim yang tidak ada di `team_projections.json` (semua 48 tim sudah lengkap saat ini) akan dapat skor fixture netral 50 sebagai fallback, dan dihitung jumlahnya di pojok toolbar.
- Sama seperti Best 15 Keseluruhan, berlaku batas **maksimal 3 pemain per negara**.

### Halaman Best 15 (Riset) (`best15-research.html`)
Versi paling akurat sejauh ini, menggantikan asumsi statis dengan data nyata turnamen:
- **Kekuatan tim** dihitung dari rata-rata gol dicetak/kebobolan di pertandingan grup yang **sudah selesai**, sumber `data/rounds.json` (resmi FIFA, join langsung lewat `squadId` — sebelumnya pakai `data/matches.json`/worldcup26.ir + name-mapping, sudah dimigrasikan ke `rounds.json` karena lebih akurat) — bukan odds pasar pra-turnamen.
- **Lawan ronde depan terdeteksi otomatis** per tim dari jadwal nyata (pertandingan grup berikutnya yang belum selesai di `rounds.json`, diurutkan tanggal, ditampilkan dalam WIB) — tidak perlu pilih matchday manual seperti di halaman Prediksi Ronde Depan.
- Proyeksi poin = `avgPoints` historis × faktor kekuatan lawan (GK/DEF naik kalau lawan jarang cetak gol secara historis, MID/FWD naik kalau lawan sering kebobolan), dibatasi 0.5×–1.8×, dibanding rata-rata liga (bukan dibanding tim itu sendiri).
- Tiap chip pemain menampilkan lawan berikutnya (mis. "vs ARG (A) · MD2") untuk transparansi.
- Catatan keterbatasan data ditampilkan otomatis di halaman: pemain dari tim yang lawan berikutnya belum punya riwayat pertandingan (baru akan main pertama kali) dihitung netral (faktor ×1) — saat data ini diambil, ada 2 tim (Uzbekistan, Colombia) yang belum pernah bertanding, jadi 4 tim yang berhadapan dengan mereka (termasuk Portugal & DR Congo) kena efek ini.
- Berlaku batas **maksimal 3 pemain per negara**, sama seperti halaman Best 15 lain.
- **Belum ditangani** (kalau ada yang mau dibantu lengkapi): pencocokan nama pencetak gol (`home_scorers`/`away_scorers`) ke pemain individual — datanya ada di `data/matches.json` tapi belum dipakai karena format nama bisa beda dari `players.json` dan butuh validasi manual biar tidak salah cocok.

### Halaman Klasemen & Jadwal (`groups.html`)
Di-overhaul total: sumber data sekarang **`data/rounds.json`** (resmi FIFA, bukan lagi `matches.json`/worldcup26.ir untuk standings & jadwal — lebih akurat dan tidak butuh name-mapping), dengan 4 tab:
- **Klasemen** — 12 grup (A–L), P/W/D/L/GF/GA/GD/Pts, diurutkan Poin → Selisih Gol → Gol Memasukkan. Highlight warna: amber = lolos langsung (peringkat 1–2), teal = peringkat 3 (kandidat lolos). Klik kode tim → modal tim.
  - **Belum memperhitungkan head-to-head** antar tim dengan poin sama (aturan resmi FIFA) — kalau butuh akurasi penuh untuk kasus 2-3 tim seri poin, perlu effort tambahan untuk mengecek hasil pertemuan langsung.
- **Ranking Peringkat 3** — semua 12 tim peringkat-3 diurutkan Pts → GD → GF, 8 teratas ditandai "lolos" sesuai format resmi Piala Dunia 2026 (juara + runner-up tiap grup otomatis lolos ke 32 besar, ditambah 8 peringkat-3 terbaik — referensi: format yang dijelaskan di [Wikipedia: Piala Dunia FIFA 2026](https://id.wikipedia.org/wiki/Piala_Dunia_FIFA_2026)).
- **Proyeksi 32 Besar** — 16 partai babak 32 besar dari `data/matches.json` (slot placeholder seperti "Winner Group A", "3rd Group A/B/C/D/F"), **diresolusi otomatis** ke nama tim asli berdasarkan klasemen real-time begitu grup terkait sudah selesai (3 pertandingan lengkap); kalau belum, ditampilkan placeholder seperti "Juara Grup A" (italic, belum pasti). **Ini proyeksi, bukan hasil resmi** — akan berubah sampai fase grup benar-benar selesai, dan posisi penempatan bisa direvisi kalau pola FIFA berbeda dari yang diasumsikan di sini.
- **Jadwal Mendatang** — seluruh pertandingan fase grup yang belum dimainkan dari `rounds.json`, waktu kickoff dikonversi akurat ke **WIB** (pakai `Intl`/`toLocaleString` dengan `timeZone: 'Asia/Jakarta'`, bukan asumsi offset manual). Klik kode tim → modal tim.
  - Catatan: jadwal **babak 32 besar** di tab "Proyeksi 32 Besar" sengaja **tidak** dikonversi ke WIB — `local_date` di `data/matches.json` untuk partai itu belum punya info zona waktu venue yang reliable (beda dari `rounds.json` yang sudah ISO 8601 lengkap dengan offset), jadi ditampilkan apa adanya dengan catatan "belum dikonversi" supaya tidak mengklaim akurasi palsu.

## Verifikasi yang sudah dilakukan

- `node scraper.js --ids 1,9,682 --with-stats` berhasil jalan end-to-end: `data/players.json` (1488 pemain), `data/squads.json` (48 tim), `data/stats/682.json` & lainnya terisi data ronde nyata (lihat contoh di bawah).
- Breakdown rumus tervalidasi terhadap data nyata: pemain DEF dengan `points=0` (MP=90, GC=3) cocok persis (Appearance +1+1, GC penalty -2 = 0); pemain MID dengan `points=11` (GS=1, T=3) menghasilkan breakdown 9 pts + selisih +2 yang teridentifikasi sebagai scouting bonus.
- Skill agen `run-fifa-fantasy` (lihat [.claude/skills/run-fifa-fantasy/SKILL.md](fifa-fantasy/.claude/skills/run-fifa-fantasy/SKILL.md)) dipakai untuk smoke-test otomatis ke semua 7 halaman tiap kali ada perubahan — `node .claude/skills/run-fifa-fantasy/driver.cjs smoke` membuka tiap halaman dengan Playwright, jalankan 1 interaksi nyata, screenshot, dan cek console error.
- Hasil smoke-test terakhir (`allOk: true`, ke-7 halaman): `index.html` (search "Messi" + klik nama → modal pemain terbuka), `best-xi.html` (ganti varian budget → badge `$71.7 / 100`), `best15-overall.html` (15 chip, badge `$84.9 / 100`), `best15-next-round.html` (ganti MD → 15 chip tetap valid), `best15-research.html` (15 chip, gap-note "semua pemain terpetakan"), `groups.html` (12 group card, 16 partai bracket), `my-squad.html` (tambah pemain → slot `1/15`) — semua **tanpa error console**.
- `groups.html` diuji manual: klasemen 12 grup dari `rounds.json` (cross-check Grup A: MEX 3pt/+2 GD, KOR 3pt/+1 GD, sesuai hasil nyata MD1), ranking peringkat-3 12 baris, bracket 32 besar 16 partai dengan label terresolusi/placeholder yang benar (mis. "Runner-up Grup A vs Runner-up Grup B" tetap placeholder karena grup belum selesai), jadwal mendatang 48 baris dengan WIB yang tervalidasi manual (`17:00+01:00` → `23:00 WIB`, selisih 6 jam dari UTC+1 ditambah 7 jam WIB offset = cocok), modal tim terbuka dari klik klasemen, footer last-sync tampil benar.
- Modal pemain/tim (`detail-modal.js`) diuji di 7 halaman: klik nama pemain di tabel/chip/slot skuad semuanya berhasil membuka modal dengan judul yang benar, tanpa error console di satu pun.

Contoh `data/stats/682.json`:
```json
[
  {
    "roundId": 1,
    "tournamentId": 10,
    "points": 11,
    "stats": {
      "SXI": 0, "MP": 90, "AS": 0, "YC": 0, "RC": 0, "OG": 0,
      "PW": 0, "PC": 0, "CS": 0, "GS": 1, "GC": 2, "PS": 0,
      "T": 3, "CC": 0, "ST": 1, "FK": 0, "S": 0, "SB": 1
    }
  }
]
```

## SEO & Bahasa (EN/ID)

### Bahasa (i18n)

Semua halaman sekarang punya **pemilih bahasa EN/ID** (pill switcher kecil di pojok kanan atas, sebelah tombol dark/light), default **English**, tersimpan di `localStorage` (`fifa-fantasy-lang`) jadi konsisten di semua halaman begitu user pindah bahasa sekali.

- Logic & dictionary di [i18n.js](fifa-fantasy/i18n.js) — shared module yang dipasang via `<script src="i18n.js">` di semua halaman, dengan dua cara translate:
  - **Statis**: tag HTML dengan `data-i18n="key"` (teks), `data-i18n-placeholder="key"` (placeholder input), otomatis di-translate saat halaman load atau bahasa diganti.
  - **Dinamis**: konten yang di-generate JS (mis. tab varian budget, hero stats, tab label klasemen) panggil `I18N.t('key', fallback)` langsung di kode render, lalu tiap halaman listen ke event `i18n:change` untuk re-render saat bahasa diganti.
- **Cakupan**: navigasi, judul/subjudul hero, header tabel, label tombol (+Tambah/✓Di skuad/Hapus), filter & placeholder, judul section, footer last-sync, dan judul/label utama modal pemain & tim — semuanya diterjemahkan.
- **Belum diterjemahkan** (keterbatasan yang disengaja karena scope): label stat mentah di modal pemain (`Starting XI`, `Minutes Played`, dst — kode resmi FIFA scoring, lazim tetap Inggris bahkan di komunitas ID), breakdown rumus poin resmi ("Appearance", "Assist", dst.), dan sejumlah kalimat disclaimer panjang yang detail/teknis di tiap halaman Best 15 — ini tetap dalam Bahasa Indonesia apa pun pilihan bahasa, karena menerjemahkan ulang seluruh paragraf teknis itu di luar scope sesi ini. Kabari kalau perlu dilengkapi.

### SEO

Tiap halaman punya `<title>` & `<meta name="description">` unik berbahasa Inggris (karena default bahasa adalah EN), plus `meta keywords`, Open Graph (`og:title/description/url/type`), Twitter Card, dan `<link rel="canonical">`. Kata kunci difokuskan ke istilah World Cup 2026 + fantasy football (mis. "World Cup 2026 fantasy", "FIFA Fantasy 2026", "World Cup squad builder", "World Cup 2026 standings").

`robots.txt` dan `sitemap.xml` sudah dibuat di root — **ganti `https://example.com` dengan domain asli kamu** di kedua file itu plus tag `canonical`/`og:url` di tiap halaman (cari-ganti `example.com`) sebelum deploy.

### Cara muncul di pencarian Google (langkah lanjutan, di luar kode)

1. **Deploy ke domain publik** (Vercel/Netlify/GitHub Pages/dst.) — Google tidak bisa index `localhost`.
2. **Update domain** — ganti `https://example.com` di `robots.txt`, `sitemap.xml`, dan tag `canonical`/`og:url` di ke-7 file HTML dengan domain asli.
3. Daftar di **[Google Search Console](https://search.google.com/search-console)** (gratis), verifikasi kepemilikan domain (lewat DNS TXT record atau upload file HTML yang disediakan Search Console).
4. Di Search Console, submit `sitemap.xml` (menu **Sitemaps** → masukkan `https://domainkamu.com/sitemap.xml`).
5. Pakai **URL Inspection** tool di Search Console untuk minta Google crawl `index.html` lebih cepat ("Request Indexing").
6. Indexing biasanya butuh beberapa hari–minggu. Untuk pantau performa pencarian (klik, impresi, kata kunci yang membawa traffic), cek tab **Performance** di Search Console secara berkala.
7. Opsional: submit juga ke [Bing Webmaster Tools](https://www.bing.com/webmasters) dengan cara serupa.

## Desain "Global Pitch" & Aset

Tema visual mengikuti `DESIGN.md` (token warna/tipografi yang diberikan): base navy/charcoal gelap, aksen **gold** (primary) + **vibrant green** (secondary), font **Montserrat** (judul/headline), **Inter** (body), **JetBrains Mono** (data/angka, tidak berubah dari sebelumnya). Semua didefinisikan satu kali di [theme.css](fifa-fantasy/theme.css) sehingga otomatis konsisten di semua halaman.

- **Logo brand** ("World Cup 2026 Fantasy Stats") — diinjeksi via [brand.js](fifa-fantasy/brand.js) di atas nav setiap halaman.
- **Bendera negara** — [flags.js](fifa-fantasy/flags.js), pakai **emoji bendera Unicode** (bukan file gambar) sehingga tidak perlu hosting aset terpisah dan tetap ringan untuk static hosting seperti Vercel. Inggris & Skotlandia pakai emoji bendera subdivisi resmi (`🏴󠁧󠁢󠁥󠁮󠁧󠁿` / `🏴󠁧󠁢󠁳󠁣󠁴󠁿`) — bisa tidak tampil di font/OS yang belum mendukung sequence ini, fallback otomatis ke kode 3-huruf saja.
- **Foto pemain** — **tidak ada foto asli** (tidak punya lisensi/sumber resmi untuk foto pemain Piala Dunia 2026). Sebagai pengganti, modal & roster menampilkan **avatar inisial** (lingkaran warna deterministik dari nama pemain + 1-2 huruf inisial) lewat helper di `detail-modal.js`. Kalau nanti ada sumber foto resmi yang legal dipakai, helper `avatarHtml()` bisa diganti jadi `<img>` tanpa mengubah pemanggilnya.
- Tombol "Login"/"Join League" yang ada di desain referensi **sudah dihapus** sesuai permintaan — saat ini app tidak punya sistem akun/liga, jadi tombol itu tidak relevan.
- **Tidak dibuat**: bagan bracket multi-tahap (Babak 32 Besar → 16 Besar → Perempat Final → Semifinal → Final) seperti di salah satu referensi gambar, karena tahap setelah Babak 32 Besar **belum bisa diproyeksikan** dari data nyata (siapa lawan di 16 Besar baru diketahui setelah hasil 32 Besar ada) — menampilkannya akan berarti mengarang skor/matchup palsu. Halaman "Proyeksi 32 Besar" yang sudah ada tetap satu-satunya bagan resmi yang didukung data.

### Kompatibilitas Vercel

App ini 100% file statis (HTML/CSS/JS + JSON di `data/`) tanpa server-side rendering atau API route, jadi bisa langsung di-deploy ke Vercel tanpa konfigurasi khusus:

```bash
npx vercel deploy   # dari folder fifa-fantasy/, ikuti prompt
# atau hubungkan repo ke Vercel dashboard, biarkan "Framework Preset" = Other / Static
```

Catatan: jalankan `node scraper.js --with-stats` dulu **sebelum deploy** supaya folder `data/` terisi (Vercel hanya menyajikan file statis, tidak menjalankan scraper saat build/runtime). Untuk refresh data berkala, jalankan scraper secara lokal lalu re-deploy, atau setup scraper sebagai cron job terpisah (di luar Vercel, karena scraper butuh Playwright/browser yang tidak girang di environment serverless Vercel).

## Catatan

- Field nyata di `players.json` lebih banyak dari spesifikasi awal (mis. `roundsSelected`, `roundPoints`, `nextFixtureFromActiveRound`, `oneToWatch`, `fifaId`) — viewer hanya memakai field yang relevan dan mengakses semuanya dengan optional chaining + default value, jadi aman walau ada field tambahan/hilang.
- Kalau scrape full (`--with-stats` tanpa `--ids`) untuk ~1500 pemain, proses bisa makan waktu cukup lama karena rate limiting sengaja dibuat pelan supaya tidak memicu blokir Akamai.
