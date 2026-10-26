# Ruang Bacaan Admin (Windows)

Aplikasi desktop khusus admin untuk menerima dan menolak pesanan Ruang Bacaan.
Dibangun dengan [Tauri 2](https://tauri.app) dan React, memakai Supabase yang sama dengan situs.

## Fitur

- Login khusus akun admin (akun biasa otomatis ditolak)
- Daftar pesanan realtime, lihat bukti bayar, terima atau tolak
- Popup pesanan baru di pojok kanan bawah layar, selalu di atas dan tetap tampil sampai admin
  menekan **Buka & proses** atau **Nanti**, tanpa merebut fokus dari aplikasi lain
- Suara notifikasi pesanan baru (`src/assets/new-order.mp3`), bisa dimatikan dari ikon lonceng
- Angka jumlah pesanan menunggu di ikon tray dan ikon taskbar
- Tombol X menyembunyikan jendela ke tray agar pemantauan tetap berjalan
- Opsi mulai otomatis saat Windows menyala (langsung tersembunyi di tray)

Untuk mengganti suara notifikasi, timpa `src/assets/new-order.mp3` dengan file MP3 lain (nama tetap sama).

## Build installer

Installer `.exe` dibuat otomatis oleh workflow **Build Admin Windows** di GitHub Actions.
Buka **Actions → Build Admin Windows → Run workflow**, lalu unduh
**RuangBacaanAdmin-Windows** dari bagian **Artifacts**.

Workflow memakai variable repo yang sama dengan situs: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

## Pengembangan lokal (opsional)

Butuh Node.js 22 dan Rust.

```bash
cd admin-desktop
npm install
npx tauri dev
```

Ikon aplikasi dibuat dari `icon-source.png` dengan `npx tauri icon icon-source.png`.
