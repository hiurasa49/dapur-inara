# 👩‍🍳 Dapur Ceria Inara — Game Edukasi Memasak & Belajar Interaktif (PWA)

Game edukasi memasak interaktif khusus untuk **Koki Cilik Inara (4 tahun 2 bulan)** di tablet Android miliknya. Dirancang dengan arsitektur **100% Gratis ($0) Fullscreen Offline-First Progressive Web App (PWA)**.

---

## 🌟 Fitur Utama

1. **🗺️ Peta Petualangan 5 Kedai Level & 25 Menu Masakan Unik**:
   - **Level 1 — 🏠 Dapur Sarapan Inara** (Terbuka dari awal • Angka `1–10` • Huruf Vokal & Suku Kata Keluarga)
   - **Level 2 — 🧁 Toko Kue & Es Krim Pastel** (3 ⭐ • Angka `11–20` • Suku Kata Terbuka `BA-CA` • Penjumlahan Awal `+`)
   - **Level 3 — 🍕 Restoran Pizza & Burger Abi** (7 ⭐ • Angka `21–50` • Keranjang Puluhan `10` + Satuan `1` • Tambah `+` & Kurang `-` Mochi)
   - **Level 4 — 🍓 Kedai Jus & Buah Segar Umi** (12 ⭐ • Angka `51–80` • Kosakata Bilingual ID/EN • Hitung `+`/`-` s.d. 15)
   - **Level 5 — 🍱 Kedai Bento & Ramen Jepang** (18 ⭐ • Angka `81–100` *Seratus!* • Bonus Bahasa Jepang • Master Hitung `+`/`-`)
2. **🍳 4-in-1 Tahap Memasak & Belajar di Setiap Pesanan**:
   - **Tahap 1 — 🔪 Potong Suku Kata (`BA-CA`)**: Memotong bahan di talenan kayu sambil mengeja suku kata berwarna (`RO-TI`, `SU-SU`, `I-NA-RA`, `A-BI`, `U-MI`).
   - **Tahap 2A — 🔢 Takar Angka (`1–100`)**: Menghitung satuan (`1–10`) atau menggunakan **🧺 Keranjang Puluhan (`+10`) + Satuan (`+1`)** serta **🔥 Takaran Digital (`1–100`)**.
   - **Tahap 2B — ➕➖ Masak Tambah (`+`) & Cicip Kurang Mochi (`-`)**: Penjumlahan visual menambah bahan ke mangkuk dan pengurangan visual saat Mochi Kucing mencicipi kue.
   - **Tahap 3 — 🫧 Gelembung Bumbu Huruf (`A–Z`)**: Memecahkan gelembung huruf untuk mengeja kata.
   - **Tahap 4 — ✍️ Lukis Saus & Tepung (`Tracing`)**: Menulis huruf `A–Z`, angka `1–100` (termasuk 2–3 digit), dan `INARA`/`ABI`/`UMI` mengikuti bintang berkilau.
3. **🎮 5 Stasiun Latihan Mandiri di Lobby**:
   - 🔢 **Papan Angka Pintar `1–100`** (Grid 10×10 interaktif + Inspektor Puluhan/Satuan + Mini-Game *Cari Angka*).
   - ➕➖ **Mesin Hitung Kue (`+` Tambah & `-` Kurang)**.
   - 🔤 **Kartu Baca Suku Kata (`BA-CA`) & Huruf `A–Z`** (75+ kata & 110+ suku kata).
   - ✍️ **Papan Tulis Tepung & Saus (`Tracing` Studio)**.
   - ⭐ **Buku Stiker (54 Stiker) & Lemari Kostum Chef Inara**.
4. **🔒 Pojok Abi & Umi (Parent Gate)**:
   - Toggle **Buka Semua 5 Kedai & 25 Menu** secara instan.
   - **Studio Rekaman Suara Asli Abi & Umi** (tersimpan secara offline di `IndexedDB` tablet).
   - **Pengatur Fokus Matematika (`1–10`, `11–20`, `21–50`, `51–100`, `+`/`-`)** & **Timer Dapur Mengantuk**.
   - **Form Tambah Kata Suku Kata Baru** & Dashboard Progres Belajar.

---

## 🚀 Cara Menjalankan & Memasang di Tablet Android Inara

### 1. Menjalankan di Laptop (Lokal / Wi-Fi Rumah)
```bash
python3 -m http.server 8080
```
Buka `http://localhost:8080` di laptop, atau buka `http://<IP-LAPTOP-ABI>:8080` dari browser Chrome di tablet Android Inara.

### 2. Memasang sebagai Aplikasi Fullscreen Offline (PWA) di Tablet Android
1. Buka alamat game di **Google Chrome** pada tablet Android Inara (bisa di-host gratis $0 di GitHub Pages / Cloudflare Pages / Netlify).
2. Ketuk tombol **"📲 Pasang App"** di pojok atas game (atau menu titik tiga Chrome $\rightarrow$ **"Tambahkan ke Layar Utama / Install App"**).
3. Buka ikon **"Dapur Inara"** dari layar utama tablet — game akan berjalan **Fullscreen Landscape** dan **100% Offline** (termasuk 485 klip suara Bahasa Indonesia, Inggris, dan Jepang yang sudah ter-cache).
