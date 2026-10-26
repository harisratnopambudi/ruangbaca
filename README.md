<div align="center">

<img src="public/og-image.png" alt="Ruang Bacaan" width="100%" />

# Ruang Bacaan

**Perpustakaan digital pribadi untuk membaca dan membeli ebook EPUB berbahasa Indonesia.**
Rak buku di cloud, progres baca tersinkron di semua perangkat, tersedia di web dan Android,
dengan aplikasi admin Windows untuk mengelola pesanan.

[![Situs](https://img.shields.io/website?url=https%3A%2F%2Fruangbacaan.my.id&style=for-the-badge&label=ruangbacaan.my.id&up_message=online&down_message=offline&color=426c5b)](https://ruangbacaan.my.id)
[![Android](https://img.shields.io/badge/Android-2.1.0-426c5b?style=for-the-badge&logo=android&logoColor=white)](https://ruangbacaan.my.id)
[![Admin Windows](https://img.shields.io/badge/Admin_Windows-1.0.0-2f4a3e?style=for-the-badge&logo=windows&logoColor=white)](#aplikasi-admin-windows)

[![Deploy Web](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/deploy.yml/badge.svg)](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/deploy.yml)
[![Build APK](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/android.yml/badge.svg)](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/android.yml)
[![Build Admin Windows](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/windows-admin.yml/badge.svg)](https://github.com/harisratnopambudi/ruangbaca/actions/workflows/windows-admin.yml)

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_2-24C8D8?style=flat-square&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=githubpages&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

[Buka Situs](https://ruangbacaan.my.id) · [Unduh Aplikasi Android](https://ruangbacaan.my.id) · [Lapor Masalah](https://github.com/harisratnopambudi/ruangbaca/issues)

</div>

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Menjalankan di Komputer](#menjalankan-di-komputer)
- [Menyiapkan Supabase](#menyiapkan-supabase)
- [Deploy Situs](#deploy-situs)
- [Aplikasi Android](#aplikasi-android)
- [Aplikasi Admin Windows](#aplikasi-admin-windows)
- [Keamanan](#keamanan)
- [Rilis Versi Baru](#rilis-versi-baru)

---

## Fitur

### Membaca

| | |
|---|---|
| **Pembaca EPUB** | Mode halaman, gulir, dan dua halaman; efek balik kertas dan swipe |
| **Tampilan nyaman** | Tema terang, sepia, gelap; 10 pilihan huruf; atur ukuran teks, jarak baris, margin, perataan |
| **Bookmark & stabilo** | Tandai halaman dan sorot kutipan dengan enam warna, tersinkron ke cloud |
| **Sinkron antarperangkat** | Lanjutkan bacaan dari posisi terakhir di HP, tablet, atau laptop |
| **Layar tetap menyala** | Layar tidak mati sendiri selama membaca |

### Rak & Katalog

| | |
|---|---|
| **Rak buku pribadi** | Sampul otomatis, cari, urutkan, dan atur urutan dengan seret dan lepas |
| **Katalog ebook** | Harga mulai Rp5.000, paket hemat 3 dan 10 ebook |
| **Pembayaran QRIS** | Unggah bukti bayar, admin memverifikasi, buku langsung masuk rak |
| **Unggah EPUB sendiri** | Terbuka setelah pembelian pertama, mendukung banyak file sekaligus |

### Admin

| | |
|---|---|
| **Kelola pesanan** | Pesanan masuk secara realtime, lihat bukti bayar, terima atau tolak |
| **Kelola akses** | Beri atau cabut akses buku per email |
| **Buku contoh** | Tandai buku sebagai contoh gratis untuk pengguna baru |
| **Aplikasi admin Windows** | Popup pesanan baru di pojok layar, suara notifikasi, angka di ikon tray |

---

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Antarmuka | React 18, Vite 6, Lucide Icons |
| Pembaca EPUB | epub.js (dimuat terpisah saat dibutuhkan) |
| Backend | Supabase: Auth, PostgreSQL dengan Row Level Security, Storage, Realtime |
| Aplikasi Android | Capacitor 8 |
| Aplikasi admin Windows | Tauri 2 (Rust + WebView2), installer NSIS |
| Hosting & CI/CD | GitHub Pages, GitHub Actions |

---

## Struktur Proyek

```text
ruangbaca/
├── .github/workflows/
│   ├── deploy.yml            # Deploy situs ke GitHub Pages setiap push ke main
│   ├── android.yml           # Build APK Android yang sudah ditandatangani
│   └── windows-admin.yml     # Build installer aplikasi admin Windows
├── admin-desktop/            # Aplikasi admin Windows (Tauri), proyek terpisah
│   ├── src/                  # Antarmuka React: pesanan, popup, suara
│   └── src-tauri/            # Sisi Windows: tray, popup, mulai otomatis
├── assets/                   # Sumber ikon & splash screen aplikasi Android
├── public/                   # File statis: CNAME, sitemap, robots, QRIS, og-image
├── src/
│   ├── main.jsx              # Seluruh aplikasi React
│   └── styles.css
├── supabase/
│   ├── schema.sql            # Tabel dasar, RLS, dan bucket Storage
│   └── security_hardening.sql# Lapisan keamanan tambahan (jalankan setelah schema)
├── capacitor.config.json     # Konfigurasi aplikasi Android
├── index.html                # SEO, Open Graph, CSP
└── vite.config.js
```

---

## Menjalankan di Komputer

**Kebutuhan:** Node.js 22 atau lebih baru.

```bash
git clone https://github.com/harisratnopambudi/ruangbaca.git
cd ruangbaca
npm install
```

Buat file `.env` di root proyek:

```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=KUNCI_PUBLISHABLE_ATAU_ANON
```

Lalu jalankan:

```bash
npm run dev       # server pengembangan di http://localhost:5173
npm run build     # build produksi ke folder dist/
npm run preview   # pratinjau hasil build
```

> [!WARNING]
> Jangan pernah memasukkan `service_role` key ke `.env` atau kode frontend. Gunakan hanya anon/publishable key.

---

## Menyiapkan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan `supabase/schema.sql`.
3. Jalankan `supabase/security_hardening.sql`. Ganti dulu email admin di bagian atas file.
4. Buka **Authentication → Sign In / Providers → Email**, aktifkan **Confirm email** dan **Secure email change**, lalu atur panjang kata sandi minimal 8 karakter.
5. Buka **Authentication → URL Configuration**:
   - Site URL: `https://ruangbacaan.my.id`
   - Redirect URLs: `https://ruangbacaan.my.id/**`

> [!IMPORTANT]
> Akses buku diberikan berdasarkan email, jadi **Confirm email wajib aktif**. Tanpa itu, orang lain bisa mendaftar dengan email pembeli.

---

## Deploy Situs

Situs otomatis ter-deploy ke GitHub Pages setiap ada push ke branch `main` melalui `deploy.yml`.

Isi **Settings → Secrets and variables → Actions → Variables**:

| Variable | Isi |
|---|---|
| `VITE_SUPABASE_URL` | URL proyek Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key |
| `VITE_ADMIN_WHATSAPP` | Nomor WhatsApp admin (opsional) |

Domain kustom diatur lewat `public/CNAME`.

---

## Aplikasi Android

Aplikasi Android dibangun dengan Capacitor dari kode yang sama dengan situs, lalu di-build dan ditandatangani otomatis oleh GitHub Actions. Android Studio tidak diperlukan.

**Fitur khusus aplikasi:** tombol Back Android, unduh EPUB lewat menu Bagikan, layar tetap menyala dengan plugin native, ikon dan splash screen sendiri.

### Secrets yang dibutuhkan

Isi di **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Isi |
|---|---|
| `KEYSTORE_BASE64` | File keystore `.jks` dalam bentuk base64 |
| `KEYSTORE_PASSWORD` | Kata sandi keystore |
| `KEY_ALIAS` | Alias kunci |
| `KEY_PASSWORD` | Kata sandi kunci |

> [!CAUTION]
> Simpan cadangan file keystore di tempat aman dan **jangan pernah commit ke repo**. Jika kunci hilang, aplikasi tidak bisa diperbarui tanpa pengguna menghapus versi lama.

### Membuat APK

1. Buka tab **Actions → Build APK Android → Run workflow**.
2. Tunggu sampai selesai, lalu unduh **RuangBacaan-apk** dari bagian **Artifacts**.

Nomor versi aplikasi diambil dari `version` di `package.json`.

---

## Aplikasi Admin Windows

Aplikasi desktop khusus admin untuk menerima dan menolak pesanan, dibangun dengan Tauri dari folder `admin-desktop/`. Installer berukuran kecil dan memakai Supabase yang sama dengan situs.

| Fitur | Keterangan |
|---|---|
| **Popup pesanan baru** | Muncul di pojok kanan bawah, selalu di atas, dan tetap tampil sampai admin menekan **Buka & proses** atau **Nanti**. Tidak merebut fokus dari aplikasi lain |
| **Suara notifikasi** | Berbunyi setiap ada pesanan baru, bisa dimatikan dari ikon lonceng |
| **Angka di tray & taskbar** | Jumlah pesanan menunggu tampil sebagai lencana merah |
| **Kelola pesanan** | Ringkasan harian, lihat bukti bayar, terima atau tolak dengan konfirmasi |
| **Berjalan di latar** | Tombol X menyembunyikan ke tray; opsi mulai otomatis saat Windows menyala |
| **Khusus admin** | Akun non-admin otomatis ditolak; semua aksi tetap dicek di server |

### Membuat installer

1. Buka tab **Actions → Build Admin Windows → Run workflow**.
2. Unduh **RuangBacaanAdmin-Windows** dari bagian **Artifacts**, lalu jalankan file `*-setup.exe`.

Workflow memakai variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` yang sama dengan situs, jadi tidak perlu secret tambahan.

> [!NOTE]
> Installer tidak ditandatangani sertifikat berbayar, sehingga Windows menampilkan *"Windows protected your PC"* saat pertama dipasang. Klik **More info → Run anyway**.

Detail pengembangan ada di [`admin-desktop/README.md`](admin-desktop/README.md).

---

## Keamanan

- **Row Level Security** di semua tabel: pengguna hanya bisa membaca dan mengubah datanya sendiri.
- **Harga dihitung di server**: total pesanan tidak bisa dimanipulasi dari browser.
- **Status pesanan dan akses buku** hanya bisa diubah admin, dicek dengan trigger database.
- **Storage terkunci**: file EPUB hanya di folder pemilik, bukti bayar hanya bisa dilihat admin dan dihapus setelah diproses.
- **Content Security Policy** di `index.html` membatasi sumber script dan koneksi.
- **Konten EPUB dijalankan tanpa script** (`allowScriptedContent: false`).

Menemukan celah keamanan? Mohon laporkan secara pribadi ke pengelola, jangan lewat issue publik.

---

## Rilis Versi Baru

1. Naikkan `version` di `package.json`, misalnya `2.1.1`.
2. Tambahkan entri baru di **paling atas** `CHANGELOG` di `src/main.jsx`.
3. Naikkan `APP_VERSION` di `src/main.jsx` agar label *update* muncul lagi di tab Aplikasi Android.
4. Push, jalankan **Build APK Android**, lalu perbarui file APK di Google Drive dengan **Upload new version** agar link unduhan di situs tetap sama.

Untuk aplikasi admin Windows, naikkan `version` di `admin-desktop/package.json`, `admin-desktop/src-tauri/Cargo.toml`, dan `admin-desktop/src-tauri/tauri.conf.json`, lalu jalankan **Build Admin Windows**.

---

<div align="center">

Dibuat dan dikelola oleh **[Haris DevLab](https://harisdevlab.online)**

<sub>© 2026 Haris DevLab. Seluruh hak cipta dilindungi.</sub>

</div>
