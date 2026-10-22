# Ruang Baca — EPUB Shelf (Cloud)

Aplikasi web pembaca EPUB dengan bookshelf, akun pengguna, penyimpanan EPUB di Supabase Storage, dan progres membaca yang tersinkronisasi antarperangkat. UI mendukung light/dark mode. Tidak memakai text-to-speech.

## Fitur
- Daftar akun, masuk, dan keluar menggunakan Supabase Auth.
- Unggah file `.epub` hingga 100 MB (batas bucket dapat diubah).
- Metadata judul dan penulis dibaca dari EPUB; koleksi tampil sebagai kartu rak buku.
- Membuka buku di pembaca EPUB.js, navigasi halaman/bab, daftar isi, ukuran teks, dan progres otomatis.
- Posisi baca disimpan ke Supabase, lalu dipulihkan saat buku dibuka di perangkat lain.
- Cari buku, hapus buku, dan tema light/dark yang tersimpan pada browser.

## 1. Siapkan Supabase
1. Buat proyek di https://supabase.com/.
2. Buka **SQL Editor**, buat query baru, lalu jalankan isi `supabase/schema.sql`.
3. Pastikan Storage memiliki bucket privat bernama `epub-files`. SQL di atas mencoba membuatnya; jika gagal, buat lewat **Storage → New bucket** dengan nama `epub-files`, non-public, dan batas file 100 MB.
4. Buka **Project Settings → API** (atau Connect) dan salin Project URL serta publishable/anon key. Jangan gunakan `service_role` key di browser.
5. Pada **Authentication → URL Configuration**, atur Site URL ke alamat pengembangan (`http://localhost:5173`) saat uji lokal. Setelah deploy, tambahkan URL produksi ke Redirect URLs.

> Jika konfirmasi email aktif, pengguna perlu mengonfirmasi email sebelum dapat masuk. Untuk pengujian, pengaturan konfirmasi email dapat disesuaikan di Supabase Auth.

## 2. Jalankan di komputer
Perlu Node.js versi LTS yang didukung Vite (disarankan Node 20 atau 22).

```bash
# ekstrak ZIP, lalu masuk ke folder proyek
npm install
```

Salin `.env.example` menjadi `.env` lalu isi nilai:
```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=KUNCI_PUBLISHABLE_ATAU_ANON
```

Lanjutkan:
```bash
npm run dev
```
Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

## 3. Deploy ke Vercel (mudah)
1. Unggah folder proyek ke repository GitHub.
2. Di https://vercel.com/, pilih **Add New → Project**, lalu impor repository.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
4. Tambahkan environment variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di pengaturan proyek Vercel.
5. Deploy. Salin URL produksi yang diberikan Vercel.
6. Di Supabase → Authentication → URL Configuration, set **Site URL** ke URL produksi dan tambahkan URL itu ke **Redirect URLs**.

Alternatif hosting: Netlify atau Cloudflare Pages (build `npm run build`, publish directory `dist`).

## Catatan keamanan dan batasan
- Jangan pernah memasukkan `service_role` key ke file `.env` frontend.
- Data buku dan progres dilindungi Row Level Security (RLS); file EPUB disimpan pada bucket privat dan kebijakan Storage membatasi akses ke folder UUID pemilik.
- Setiap akun memiliki koleksi sendiri. Untuk mengakses koleksi yang sama dari perangkat berbeda, masuk dengan akun yang sama dan koneksi internet aktif.
- Tema disimpan di browser, bukan disinkronkan. Progres baca tersimpan di cloud.
- File harus EPUB tanpa DRM. Buku EPUB ber-DRM biasanya tidak dapat dibaca oleh EPUB.js.
- Browser yang dipakai perlu mendukung Indexed APIs yang digunakan oleh EPUB.js dan mengizinkan JavaScript.
- Untuk produksi, pertimbangkan batas unggahan, kuota Storage Supabase, kebijakan privasi, dan biaya pemakaian.
