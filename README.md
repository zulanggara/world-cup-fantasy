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
- `data/rounds.json` — fixture & hasil **resmi FIFA** (`play.fifa.com/json/fantasy/rounds.json`), selalu di-fetch juga. `homeSquadId`/`awaySquadId` di sini langsung cocok dengan `squads.json` (tidak perlu name-mapping seperti `matches.json`/worldcup26.ir).

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

Ada 7 halaman, dihubungkan lewat tab navigasi konsisten (`Daftar Pemain` / `Compare Tim` / `Best 15 Keseluruhan` / `Prediksi Ronde Depan` / `Best 15 (Riset)` / `Klasemen & Jadwal` / `Aturan & Copilot`) di bagian atas tiap halaman, dengan tab aktif ditandai warna accent.

### Budget squad (semua halaman Best 15)
Setiap halaman yang menyusun Best 15 (`best-xi.html`, `best15-overall.html`, `best15-next-round.html`, `best15-research.html`) sekarang menampilkan **harga** (`price` dari `players.json`) di tiap pemain dan total harga squad, dibandingkan dengan budget standar FIFA Fantasy **100**. Logikanya ada di [squad-builder.js](fifa-fantasy/squad-builder.js) (dipakai bersama lewat `<script src="squad-builder.js">`, tidak didup­likasi per halaman) dan menghasilkan **3 varian** yang bisa dipilih lewat tab:
- **Skor Tertinggi** — susunan terbaik murni berdasarkan metrik halaman tersebut (poin/skor), tanpa peduli budget. Kadang sudah otomatis ≤100, kadang tidak (badge merah kalau melebihi).
- **Dalam Budget** — mulai dari "Skor Tertinggi", lalu menukar pemain termahal dengan alternatif lebih murah di posisi yang sama (cari penukaran dengan kerugian skor paling kecil per harga yang dihemat) sampai total ≤100. Ini default yang ditampilkan.
- **Hemat (Value)** — pilih berdasarkan rasio skor/harga (value pick), biasanya jauh di bawah budget, cocok kalau mau sisa budget untuk transfer berikutnya.
- Di `best-xi.html`, karena satu tim isinya satu negara saja, batas "maksimal 3 per negara" tidak diberlakukan (cap dilonggarkan) — tapi tetap dibatasi formasi 2-5-5-3. Ranking semua tim di halaman itu juga sekarang pakai varian "Dalam Budget" sebagai default biar konsisten dengan tampilan compare.
- Algoritma penukaran budget ini adalah **heuristik greedy**, bukan solver optimal sempurna (true combinatorial optimization) — cukup baik untuk kasus 15 slot + cap 3/negara, tapi bisa saja ada kombinasi lain yang sedikit lebih baik yang tidak ditemukan.

Fitur viewer (`index.html`, vanilla JS, tanpa build step):
- Search nama, filter posisi (GK/DEF/MID/FWD), filter status, sort klik header.
- Klik baris pemain → expand detail stats per ronde (lazy-fetch `data/stats/{id}.json`, di-cache di memori).
- Dark mode default, toggle ke light mode.
- Poin resmi per ronde (field `points`) ditampilkan sebagai angka utama. Di bawahnya ada **breakdown perhitungan sesuai rumus resmi "How to Score"** FIFA Fantasy (Appearance, Assist, Goal, Clean Sheet, Tackles/Chances Created/Shots on Target bonus, dst., dengan bobot berbeda per posisi GK/DEF/MID/FWD). Breakdown ini dihitung dari rumus resmi, bukan tebakan — tervalidasi cocok dengan field `points` di banyak kasus.
  - Kalau ada selisih antara breakdown dan poin resmi, viewer menampilkan catatan selisih. Ini biasanya berasal dari **scouting bonus** (+2 jika pemain raih >4 pts dan dipilih <5% pemain saat pertandingan berlangsung) — bonus ini tidak bisa dihitung ulang secara pasti karena data `percentSelected` yang tersimpan adalah persentase saat scrape dijalankan, bukan snapshot historis saat pertandingan itu berlangsung.

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
- **Kekuatan tim** dihitung dari rata-rata gol dicetak/kebobolan di pertandingan grup yang **sudah selesai** (`data/matches.json`, sumber worldcup26.ir) — bukan odds pasar pra-turnamen.
- **Lawan ronde depan terdeteksi otomatis** per tim dari jadwal nyata (pertandingan grup berikutnya yang belum selesai, diurutkan tanggal) — tidak perlu pilih matchday manual seperti di halaman Prediksi Ronde Depan.
- Proyeksi poin = `avgPoints` historis × faktor kekuatan lawan (GK/DEF naik kalau lawan jarang cetak gol secara historis, MID/FWD naik kalau lawan sering kebobolan), dibatasi 0.5×–1.8×, dibanding rata-rata liga (bukan dibanding tim itu sendiri).
- Tiap chip pemain menampilkan lawan berikutnya (mis. "vs ARG (A) · MD2") untuk transparansi.
- Catatan keterbatasan data ditampilkan otomatis di halaman: pemain dari tim yang lawan berikutnya belum punya riwayat pertandingan (baru akan main pertama kali) dihitung netral (faktor ×1) — saat data ini diambil, ada 2 tim (Uzbekistan, Colombia) yang belum pernah bertanding, jadi 4 tim yang berhadapan dengan mereka (termasuk Portugal & DR Congo) kena efek ini.
- Berlaku batas **maksimal 3 pemain per negara**, sama seperti halaman Best 15 lain.
- **Belum ditangani** (kalau ada yang mau dibantu lengkapi): pencocokan nama pencetak gol (`home_scorers`/`away_scorers`) ke pemain individual — datanya ada di `data/matches.json` tapi belum dipakai karena format nama bisa beda dari `players.json` dan butuh validasi manual biar tidak salah cocok.

### Halaman Klasemen & Jadwal (`groups.html`)
- **Klasemen 12 grup** (A–L) dihitung dari pertandingan grup yang sudah selesai di `data/matches.json`: P/W/D/L/GF/GA/GD/Pts, diurutkan Poin → Selisih Gol → Gol Memasukkan.
  - **Belum memperhitungkan head-to-head** antar tim dengan poin sama (aturan resmi FIFA) — kalau butuh akurasi penuh untuk kasus 2-3 tim seri poin, perlu effort tambahan untuk mengecek hasil pertemuan langsung.
- **Jadwal ronde berikutnya** (fase grup) — semua pertandingan yang belum selesai, diurutkan tanggal, dengan kode matchday.
- Data sumber (worldcup26.ir, bukan API resmi FIFA) kadang punya salah ketik nama pencetak gol/skor — kalau ketemu yang aneh, kabari saja untuk dikoreksi.

### Halaman Aturan Resmi & AI Copilot (`copilot.html`)
Halaman ini mengintegrasikan isi repo [`fantasy-world-cup-skill`](https://github.com/manavm12/fantasy-world-cup-skill) (kalau sudah di-clone secara terpisah) ke app ini. Penting dipahami: **repo itu bukan library JS atau API web** — itu adalah *skill* untuk AI agent (instruksi `SKILL.md` + data lokal + CLI Tinyfish untuk riset live), jadi tidak bisa "ditombolkan" di halaman statis tanpa backend yang menjalankan LLM + CLI.

Yang diintegrasikan secara nyata ke app ini:
- **Aturan resmi lengkap** dari `references/game-rules.md` milik skill itu, dirender rapi: budget 100m, komposisi skuad 2-5-5-3 (sesuai yang sudah dipakai di app ini), **limit pemain per negara per babak** (Group Stage/R32: 3, R16: 4, QF: 5, SF: 6, Final: 8 — bukan selalu 3 seperti yang kita asumsikan sebelumnya untuk seluruh turnamen), aturan transfer per periode, booster, kapten, dan substitusi.
- **`data/rounds.json`** — endpoint resmi FIFA (`play.fifa.com/json/fantasy/rounds.json`) yang juga dipakai skill itu untuk fixture, sekarang ikut di-fetch oleh `scraper.js` kita (lihat bagian Output di atas).
- Halaman ini otomatis membaca `data/rounds.json` untuk mendeteksi babak turnamen saat ini (Group Stage) dan highlight limit pemain/negara yang berlaku.

Yang **tidak** bisa dijalankan dari halaman ini (butuh agent, bukan browser): fitur chat seperti "help me build my team", "compare Lautaro Martinez vs Isak". Itu hanya bisa dipakai dengan bertanya langsung ke AI agent (Claude Code) di repo `fantasy-world-cup-skill` — panduan & contoh prompt-nya ada di halaman ini.

## Verifikasi yang sudah dilakukan

- `node scraper.js --ids 1,9,682 --with-stats` berhasil jalan end-to-end: `data/players.json` (1488 pemain), `data/squads.json` (48 tim), `data/stats/682.json` & lainnya terisi data ronde nyata (lihat contoh di bawah).
- Viewer diuji headless via Playwright: 1488 baris ter-render, search/filter/sort + pagination jalan, klik baris memunculkan detail ronde dengan breakdown rumus resmi, **tanpa error console**.
- `best-xi.html` diuji headless: ranking 48 tim ter-render (urutan benar, tim teratas Germany 97 pts saat data scrape ini diambil), comparison panel 2 tim jalan, **tanpa error console**.
- `best15-overall.html` diuji headless: 15 chip pemain ter-render lintas tim, total poin terhitung benar (204 pts pada data scrape ini), **tanpa error console**.
- Breakdown rumus tervalidasi terhadap data nyata: pemain DEF dengan `points=0` (MP=90, GC=3) cocok persis (Appearance +1+1, GC penalty -2 = 0); pemain MID dengan `points=11` (GS=1, T=3) menghasilkan breakdown 9 pts + selisih +2 yang teridentifikasi sebagai scouting bonus.
- Halaman `best-xi.html` diuji headless: 48 squad muncul di dropdown, verdict perbandingan muncul, **tanpa error console**.
- `best15-next-round.html` diuji headless: 15 chip ter-render, 0 pemain tanpa data proyeksi (semua 48 squad cocok dengan `team_projections.json`), skor berubah saat dropdown matchday diganti (MD2→MD1 mengubah skor sampel dari 82.1 ke 80.9 di test ini), **tanpa error console**.
- Navigasi: ke-7 halaman diuji headless, masing-masing menampilkan 7 tab dengan tab aktif yang benar sesuai halaman, **tanpa error console** di seluruh halaman.
- `copilot.html` diuji headless: status panel berhasil baca `data/rounds.json` (8 ronde, 3 ronde fase grup, 1 selesai), mendeteksi babak "Group Stage" dengan limit 3 pemain/negara, **tanpa error console**.

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

## Catatan

- Field nyata di `players.json` lebih banyak dari spesifikasi awal (mis. `roundsSelected`, `roundPoints`, `nextFixtureFromActiveRound`, `oneToWatch`, `fifaId`) — viewer hanya memakai field yang relevan dan mengakses semuanya dengan optional chaining + default value, jadi aman walau ada field tambahan/hilang.
- Kalau scrape full (`--with-stats` tanpa `--ids`) untuk ~1500 pemain, proses bisa makan waktu cukup lama karena rate limiting sengaja dibuat pelan supaya tidak memicu blokir Akamai.
