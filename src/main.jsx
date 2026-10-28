import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import AuthScreen from './AuthScreen.jsx';
import './fonts.css';
import {
  BookOpen, Plus, Search, Sun, Moon, LogOut, UploadCloud, Trash2,
  ChevronLeft, ChevronRight, List, X, LoaderCircle, LibraryBig,
  BookMarked, CheckCircle2, AlertCircle, ArrowLeft, Type, RefreshCw,
  SlidersHorizontal, Minus, AlignJustify, AlignLeft, AlignCenter, AlignRight, Columns2, Rows3,
  Pencil, Bookmark, Highlighter, Download, Users, Eye, EyeOff, Gift, ShoppingBag, Lock, Check, ClipboardList, Upload, Info, Zap, ShieldCheck, Clock, QrCode, Copy, ScanLine, Settings, Wrench
} from 'lucide-react';

// Ikon Android (Material Icons, Apache 2.0)
const AndroidIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
  </svg>
);

// Changelog aplikasi: entri terbaru di paling atas
const CHANGELOG = [
  {
    version: '2.1.2',
    date: '28 Oktober 2026',
    shortDate: '28 Okt 2026',
    groups: [
      {
        title: 'Tampilan lebih rapi',
        icon: LibraryBig,
        items: [
          ['Judul buku tampil utuh', 'di rak dan katalog, tidak lagi terpotong atau tertimpa label.'],
          ['Kartu buku tetap sejajar', 'walaupun panjang judulnya berbeda-beda.']
        ]
      },
      {
        title: 'Privasi buku',
        icon: ShieldCheck,
        items: [
          ['Buku yang kamu unggah bersifat pribadi,', 'hanya tersimpan di rakmu dan tidak tampil di katalog.']
        ]
      }
    ]
  },
  {
    version: '2.1.1',
    date: '27 Oktober 2026',
    shortDate: '27 Okt 2026',
    groups: [
      {
        title: 'Pembayaran otomatis',
        icon: QrCode,
        items: [
          ['QRIS dengan nominal unik.', 'Setiap pesanan mendapat QRIS sendiri dan nominalnya sudah terisi saat di-scan.'],
          ['Buku langsung masuk rak', 'dalam hitungan detik setelah bayar, tanpa unggah bukti dan tanpa menunggu admin.'],
          ['Halaman pembayaran berubah sendiri', 'menjadi "Terima kasih!" begitu pembayaran diterima.'],
          ['Simpan atau bagikan gambar QRIS', 'untuk dibayar lewat fitur scan dari galeri di e-wallet atau m-banking.'],
          ['Lanjutkan pembayaran nanti.', 'Pesanan yang belum dibayar punya tombol Bayar di bagian Pesanan saya.']
        ]
      },
      {
        title: 'Lebih cepat',
        icon: Zap,
        items: [
          ['Halaman masuk tampil instan', 'tanpa menunggu aplikasi selesai dimuat.'],
          ['Huruf dimuat dari server sendiri,', 'lebih ringan dan tidak bergantung pada layanan luar.'],
          ['Info terbaru di bawah banner', 'dalam bentuk teks berjalan.']
        ]
      },
      {
        title: 'Lebih andal',
        icon: ShieldCheck,
        items: [
          ['Tetap masuk dengan "Ingat saya".', 'Keluar di satu perangkat tidak lagi membuatmu keluar di perangkat lain.'],
          ['Pulih otomatis', 'jika aplikasi gagal dimuat karena koneksi, dengan tombol Muat ulang sebagai cadangan.'],
          ['Teks lebih mudah dibaca', 'berkat kontras warna yang ditingkatkan.']
        ]
      }
    ]
  },
  {
    version: '2.1.0',
    date: '26 Oktober 2026',
    shortDate: '26 Okt 2026',
    groups: [
      {
        title: 'Aplikasi baru',
        icon: AndroidIcon,
        items: [
          ['Aplikasi Android sungguhan.', 'Dibangun ulang dari nol: ukurannya sekitar 3 MB, terbuka lebih cepat, dengan ikon dan layar pembuka baru.'],
          ['Tombol Back Android.', 'Menutup panel, stabilo, atau pengaturan dulu, lalu kembali ke rak dengan rapi.'],
          ['Unduh EPUB lewat menu Bagikan.', 'Simpan file ke File, Google Drive, atau kirim langsung ke WhatsApp.'],
          ['Layar tidak mati sendiri', 'selama kamu membaca.'],
          ['Unduhan resmi.', 'APK kini diunduh langsung dari halaman rilis resmi, tanpa lewat Google Drive.']
        ]
      },
      {
        title: 'Lebih cepat',
        icon: Zap,
        items: [
          ['Halaman awal 45% lebih ringan.', 'Bagian pembaca buku baru dimuat saat dibutuhkan, jadi aplikasi dan situs terbuka lebih cepat.'],
          ['Layar pembuka instan', 'muncul seketika, tidak ada lagi layar putih kosong saat memuat.']
        ]
      },
      {
        title: 'Lebih aman',
        icon: ShieldCheck,
        items: [
          ['Pembayaran lebih aman.', 'Total harga dihitung langsung oleh server dan tidak bisa diubah dari perangkat.'],
          ['Bukti bayar terlindungi.', 'Foto bukti bayar hanya bisa dilihat admin dan dihapus otomatis setelah pesanan diproses.'],
          ['Akun lebih aman.', 'Kata sandi akun baru minimal 8 karakter.'],
          ['Perlindungan buku dan file', 'diperketat agar koleksimu tidak bisa diakses pihak lain.']
        ]
      },
      {
        title: 'Rak lebih rapi',
        icon: LibraryBig,
        items: [
          ['Buku contoh disembunyikan', 'otomatis dari rak setelah kamu membeli ebook pertamamu.']
        ]
      }
    ]
  },
  {
    version: '2.0',
    date: 'Oktober 2026',
    groups: [
      {
        title: 'Pembaruan',
        icon: RefreshCw,
        items: [
          ['Nama baru: Ruang Bacaan.', 'Ruang Baca resmi berganti nama menjadi Ruang Bacaan.'],
          ['Alamat baru:', 'ruangbacaan.my.id.'],
          ['Layar tidak mati sendiri', 'saat kamu sedang membaca.'],
          ['Sampul buku tampil jauh lebih cepat', 'saat pertama kali membuka rak.'],
          ['Katalog lebih lengkap:', 'terurut berdasarkan penulis, dan edisi berbeda dari judul yang sama kini tampil terpisah.'],
          ['Tampilan dan performa', 'diperbarui di seluruh aplikasi.']
        ]
      }
    ]
  }
];
const APP_RELEASE = CHANGELOG[0];

// APK dari rilis GitHub terbaru (diterbitkan otomatis oleh workflow Build APK Android saat push tag v*)
const APK_URL = 'https://github.com/harisratnopambudi/ruangbaca/releases/latest/download/RuangBacaan.apk';
import { Capacitor } from '@capacitor/core';
import './styles.css';

// Berjalan sebagai aplikasi Android (Capacitor) atau di browser biasa
const IS_NATIVE = Capacitor.isNativePlatform();
const SITE_URL = 'https://ruangbacaan.my.id/';
// Tautan di email (konfirmasi akun, reset sandi) selalu diarahkan ke situs, bukan ke alamat internal aplikasi
const authRedirectUrl = () => IS_NATIVE ? SITE_URL : `${window.location.origin}${window.location.pathname}`;

const blobToBase64 = blob => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onloadend = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(new Error('Gagal membaca file.'));
  r.readAsDataURL(blob);
});

// epub.js (+ jszip dll.) cukup berat, jadi dimuat terpisah hanya saat dibutuhkan
let epubPromise = null;
const loadEpub = () => (epubPromise ||= import('epubjs').then(m => m.default));

// Font khusus pembaca dimuat saat pembaca dibuka, bukan saat halaman awal
let readerFontsLoaded = false;
const loadReaderFonts = () => {
  if (readerFontsLoaded || typeof document === 'undefined') return;
  readerFontsLoaded = true;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap';
  document.head.appendChild(l);
};

const FONT_FAMILIES = [
  { id: 'Georgia', label: 'Georgia', family: 'Georgia, serif' },
  { id: 'Times New Roman', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { id: 'Palatino', label: 'Palatino', family: 'Palatino, "Palatino Linotype", "Book Antiqua", "URW Palladio L", P052, "TeX Gyre Pagella", serif' },
  { id: 'Garamond', label: 'Garamond', family: 'Garamond, "EB Garamond", serif' },
  { id: 'Bookerly', label: 'Bookerly', family: 'Bookerly, "Literata", "Merriweather", Georgia, serif' },
  { id: 'Open Sans', label: 'Open Sans', family: '"Open Sans", "Segoe UI", sans-serif' },
  { id: 'Arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'Verdana', label: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'Courier New', label: 'Courier New', family: '"Courier New", Courier, monospace' },
  { id: 'Comic Sans', label: 'Comic Sans', family: '"Comic Sans MS", "Comic Sans", cursive, sans-serif' }
];

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'sepia', label: 'Sepia', icon: BookOpen },
  { id: 'dark', label: 'Dark', icon: Moon }
];

const THEME_CONFIG = {
  light: {
    paperBg: '#ffffff',
    textColor: '#1f2937',
    linkColor: '#0d9488'
  },
  sepia: {
    paperBg: '#fbf0d9',
    textColor: '#463426',
    linkColor: '#8c5025'
  },
  dark: {
    paperBg: '#1b1f24',
    textColor: '#e5e7eb',
    linkColor: '#5eead4'
  }
};

const HIGHLIGHT_COLORS = {
  yellow: { id: 'yellow', label: 'Kuning', hex: '#fde047', border: '#ca8a04', text: '#854d0e' },
  green: { id: 'green', label: 'Hijau', hex: '#86efac', border: '#16a34a', text: '#166534' },
  blue: { id: 'blue', label: 'Biru', hex: '#93c5fd', border: '#2563eb', text: '#1e40af' },
  pink: { id: 'pink', label: 'Pink', hex: '#f472b6', border: '#db2777', text: '#9d174d' },
  orange: { id: 'orange', label: 'Oranye', hex: '#fdba74', border: '#ea580c', text: '#9a3412' },
  purple: { id: 'purple', label: 'Ungu', hex: '#d8b4fe', border: '#9333ea', text: '#6b21a8' }
};

// Unduh / ekspor file EPUB asli dari Supabase Storage
const safeFileName = title =>
  String(title || 'buku').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'buku';

const downloadEpub = async (book, notify) => {
  if (!book?.file_path) { notify?.('File buku tidak ditemukan.', 'error'); return; }
  try {
    notify?.('Menyiapkan unduhan…');
    const { data, error } = await supabase.storage.from('epub-files').download(book.file_path);
    if (error) throw error;
    const blob = new Blob([data], { type: 'application/epub+zip' });
    if (IS_NATIVE) {
      // Di aplikasi: simpan sementara lalu buka menu Bagikan (simpan ke Files, Drive, WhatsApp, dll.)
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import('@capacitor/filesystem'), import('@capacitor/share')
      ]);
      const name = `${safeFileName(book.title)}.epub`;
      const saved = await Filesystem.writeFile({ path: name, data: await blobToBase64(blob), directory: Directory.Cache });
      await Share.share({ title: book.title, files: [saved.uri], dialogTitle: 'Simpan atau bagikan EPUB' });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName(book.title)}.epub`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    notify?.('Unduhan dimulai.');
  } catch (e) {
    notify?.(e?.message || 'Gagal mengunduh buku.', 'error');
  }
};

// Efek kertas saat ganti halaman / swipe
const paperTransform = (el, dx, animate, fade) => {
  if (!el) return;
  const w = el.clientWidth || 600;
  const p = Math.min(1, Math.abs(dx) / w);
  el.style.transition = animate
    ? 'transform .2s cubic-bezier(.22,.8,.3,1), opacity .2s ease, box-shadow .2s ease'
    : 'none';
  el.style.transform = dx === 0 ? 'none' : `translateX(${dx}px) rotateY(${(-dx / w) * 10}deg)`;
  el.style.opacity = String(fade ?? (1 - p * 0.35));
  el.style.boxShadow = dx === 0 ? 'none' : `${dx > 0 ? '-' : ''}14px 0 34px rgba(0,0,0,${(0.08 + p * 0.22).toFixed(2)})`;
};
const paperReset = el => {
  if (!el) return;
  el.style.transition = 'none';
  el.style.transform = '';
  el.style.opacity = '';
  el.style.boxShadow = '';
};

const getHighlightStyle = (colorId, theme) => {
  const c = HIGHLIGHT_COLORS[colorId] || HIGHLIGHT_COLORS.yellow;
  return {
    fill: c.hex,
    'fill-opacity': theme === 'dark' ? '0.65' : '0.55',
    'mix-blend-mode': 'normal'
  };
};

const getStoredBookmarks = (bookId) => {
  if (!bookId) return [];
  try {
    const raw = localStorage.getItem(`rb_bookmarks_${bookId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredBookmarks = (bookId, bookmarks) => {
  if (!bookId) return;
  try {
    localStorage.setItem(`rb_bookmarks_${bookId}`, JSON.stringify(bookmarks));
  } catch {}
};

const getStoredHighlights = (bookId) => {
  if (!bookId) return [];
  try {
    const raw = localStorage.getItem(`rb_highlights_${bookId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredHighlights = (bookId, highlights) => {
  if (!bookId) return;
  try {
    localStorage.setItem(`rb_highlights_${bookId}`, JSON.stringify(highlights));
  } catch {}
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// "Ingat saya": sesi disimpan permanen (localStorage) atau hanya selama browser terbuka (sessionStorage)
const REMEMBER_KEY = 'rb_remember';
const authStorage = {
  getItem: key => {
    try { return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try {
      const remember = window.localStorage.getItem(REMEMBER_KEY) !== '0';
      const keep = remember ? window.localStorage : window.sessionStorage;
      const drop = remember ? window.sessionStorage : window.localStorage;
      keep.setItem(key, value);
      drop.removeItem(key);
    } catch {}
  },
  removeItem: key => {
    try { window.localStorage.removeItem(key); window.sessionStorage.removeItem(key); } catch {}
  }
};
// Ada sesi tersimpan / tautan login di URL? Jika tidak, halaman masuk bisa langsung tampil
// tanpa menunggu (sama dengan logika public/boot.js untuk HTML pre-render).
const hasSessionHint = () => {
  try {
    if (/access_token=|refresh_token=|type=recovery|[?&]code=/.test(window.location.hash + window.location.search)) return true;
    for (const st of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < st.length; i++) if (/^sb-.*-auth-token$/.test(st.key(i) || '')) return true;
    }
  } catch { return true; }
  return false;
};
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true } })
  : null;

const DB_NAME = 'ruang_baca_db';
const STORE_NAME = 'book_covers';

const getCoverDb = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) { resolve(null); return; }
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const saveCoverToDb = async (bookId, dataUrl) => {
  if (!bookId || !dataUrl) return;
  try {
    const db = await getCoverDb();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, bookId);
  } catch (e) {
    console.warn('Gagal menyimpan sampul', e);
  }
};

const getCoverFromDb = async (bookId) => {
  if (!bookId) return null;
  try {
    const db = await getCoverDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const deleteCoverFromDb = async (bookId) => {
  if (!bookId) return;
  try {
    const db = await getCoverDb();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(bookId);
  } catch (e) {}
};

const extractCoverFromBook = async (book) => {
  try {
    let url = null;
    try {
      url = await book.coverUrl();
    } catch {}

    if (!url && book.archive) {
      const manifest = book.package?.manifest || {};
      for (const key of Object.keys(manifest)) {
        const item = manifest[key];
        if (item && item.type && item.type.startsWith('image/')) {
          const id = (item.id || '').toLowerCase();
          const href = (item.href || '').toLowerCase();
          if (item.properties === 'cover-image' || id.includes('cover') || href.includes('cover')) {
            try {
              url = await book.archive.createUrl(item.href);
              if (url) break;
            } catch {}
          }
        }
      }
    }

    if (!url) return null;
    const res = await fetch(url);
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

// Bukti bayar: disimpan sementara di bucket privat, dihapus admin setelah pesanan diproses
const PROOF_BUCKET = 'payment-proofs';
const proofPath = code => `${code}.jpg`;
const deleteProof = async code => {
  try { await supabase.storage.from(PROOF_BUCKET).remove([proofPath(code)]); } catch {}
};
// Perkecil foto bukti bayar (maks 1400px, JPEG) agar unggahan ringan
const compressProof = (file, maxSide = 1400, quality = 0.75) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob(b => b ? resolve(b) : reject(new Error('Gagal memproses gambar')), 'image/jpeg', quality);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('File bukan gambar yang valid')); };
  img.src = url;
});

const palette = [
  ['#dce8e1', '#284a3c'], ['#f3dfce', '#70412e'], ['#dce4f5', '#344b7a'],
  ['#eadcf1', '#684577'], ['#f2e9bd', '#655620'], ['#d9e9ed', '#275560']
];
const coverColors = (text='') => palette[(text.charCodeAt(0) || 0) % palette.length];
const formatSize = bytes => bytes < 1024*1024 ? `${Math.max(1, Math.round(bytes/1024))} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

const getBookMeta = async file => {
  const buffer = await file.arrayBuffer();
  const ePub = await loadEpub();
  const book = ePub(buffer);
  try {
    await book.ready;
    const m = book.package?.metadata || {};
    const title = (m.title || '').trim() || file.name.replace(/\.epub$/i, '');
    const author = (m.creator || '').trim() || 'Penulis tidak diketahui';
    const coverDataUrl = await extractCoverFromBook(book);
    book.destroy();
    return { title, author, coverDataUrl };
  } catch (e) {
    book.destroy();
    throw new Error('File EPUB tidak dapat dibaca. Pastikan file valid dan tidak dilindungi DRM.');
  }
};

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(() => !hasSessionHint());
  const [authMode, setAuthMode] = useState('login');
  const [recovering, setRecovering] = useState(false);
  const [remember, setRemember] = useState(() => { try { return localStorage.getItem('rb_remember') !== '0'; } catch { return true; } });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  // Pendaftaran akun baru dibuka/ditutup admin (public.site_settings). Default dibuka.
  const [signupOpen, setSignupOpen] = useState(true);
  const [books, setBooks] = useState([]);
  const [covers, setCovers] = useState({});
  const [progress, setProgress] = useState({});
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksLoaded, setBooksLoaded] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('ruang-baca-theme') || 'light');
  const [activeBook, setActiveBook] = useState(null);
  const [readerRefresh, setReaderRefresh] = useState(0);
  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const fileInput = useRef(null);

  // Aplikasi sudah tampil: hapus layar "Menyiapkan…" bawaan HTML dan tanda percobaan muat ulang
  useEffect(() => {
    document.getElementById('rb-splash')?.remove();
    try { sessionStorage.removeItem('rb_retry'); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ruang-baca-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const notify = (message, kind='success') => {
    setNotice({ message, kind });
    window.setTimeout(() => setNotice(null), 4200);
  };

  const loadBooks = useCallback(async () => {
    if (!supabase || !session?.user) return;
    setLoadingBooks(true);
    const [{ data: bookRows, error: bookError }, { data: progressRows, error: progressError }, orderRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('reading_progress').select('*'),
      supabase.from('shelf_order').select('book_ids').maybeSingle()
    ]);
    setLoadingBooks(false);
    setBooksLoaded(true);
    if (bookError || progressError) {
      notify(bookError?.message || progressError?.message || 'Gagal memuat koleksi.', 'error');
      return;
    }
    const booksList = bookRows || [];
    setBooks(booksList);
    // Urutan rak dari cloud (sinkron antar perangkat). Jika belum ada, pakai cache lokal.
    const cloudOrder = orderRes?.data?.book_ids;
    if (Array.isArray(cloudOrder)) {
      setOrder(cloudOrder);
      try { localStorage.setItem(`rb_order_${session.user.id}`, JSON.stringify(cloudOrder)); } catch {}
    } else if (orderRes?.error) {
      console.warn('Urutan rak belum bisa disinkronkan (tabel shelf_order belum dibuat?):', orderRes.error.message);
    }
    const map = {};
    (progressRows || []).forEach(row => { map[row.book_id] = row; });
    booksList.forEach(b => {
      try {
        const local = localStorage.getItem(`rb_progress_${b.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (!map[b.id] || Number(parsed.percentage || 0) > Number(map[b.id].percentage || 0)) {
            map[b.id] = { ...(map[b.id] || {}), ...parsed, book_id: b.id };
          }
        }
      } catch {}
    });
    setProgress(map);
  }, [session?.user?.id]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  // Setelah masuk, siapkan modul pembaca di waktu luang agar buka buku terasa instan
  useEffect(() => {
    if (!session?.user) return;
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() => { loadEpub().catch(() => {}); });
    return () => cancel(id);
  }, [session?.user?.id]);

  // Status pendaftaran untuk halaman masuk (fungsi belum ada di Supabase -> anggap dibuka)
  useEffect(() => {
    if (!supabase || session) return;
    let alive = true;
    supabase.rpc('get_signup_open').then(({ data, error }) => {
      if (alive && !error) setSignupOpen(data !== false);
    });
    return () => { alive = false; };
  }, [session?.user?.id]);
  useEffect(() => { if (!signupOpen && authMode === 'signup') setAuthMode('login'); }, [signupOpen, authMode]);

  const handleAuth = async e => {
    e.preventDefault();
    if (!supabase) return;
    setAuthBusy(true); setAuthMessage('');
    try { localStorage.setItem('rb_remember', remember ? '1' : '0'); } catch {}
    try {
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: authRedirectUrl()
        });
        if (error) throw error;
        setAuthMessage('Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim. Periksa kotak masuk atau folder spam.');
        return;
      }
      if (authMode === 'signup') {
        if (!signupOpen) throw new Error('Pendaftaran akun baru sedang ditutup sementara.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl() }
        });
        if (error) throw error;
        setAuthMessage(data.session ? 'Akun berhasil dibuat. Anda sudah masuk.' : 'Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.');
        if (data.session) setSession(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
      }
    } catch (e) {
      const m = String(e?.message || '');
      if (authMode === 'signup' && /Database error saving new user|Pendaftaran akun baru sedang ditutup/i.test(m)) {
        setSignupOpen(false);
        setAuthMessage('Pendaftaran akun baru sedang ditutup sementara.');
        return;
      }
      setAuthMessage(/rate limit|too many/i.test(m) ? 'Terlalu banyak permintaan. Coba lagi beberapa menit lagi.' : (m || 'Autentikasi gagal.'));
    }
    finally { setAuthBusy(false); }
  };

  const handleLogout = async () => {
    // Keluar hanya di perangkat ini; sesi di HP/aplikasi lain tetap aktif
    await supabase?.auth.signOut({ scope: 'local' });
    setSession(null); setBooks([]); setProgress({}); setActiveBook(null);
  };

  const processFiles = async (fileList) => {
    const rawFiles = Array.from(fileList || []);
    if (!rawFiles.length) return;
    if (!canUpload) { notify('Beli ebook di tab Katalog terlebih dahulu untuk membuka fitur menambah EPUB sendiri.', 'error'); return; }

    const epubFiles = rawFiles.filter(f => f.name.toLowerCase().endsWith('.epub'));
    if (!epubFiles.length) {
      notify('Pilih file dengan ekstensi .epub.', 'error');
      return;
    }

    const validFiles = epubFiles.filter(f => f.size <= 100 * 1024 * 1024);
    const oversizedFiles = epubFiles.filter(f => f.size > 100 * 1024 * 1024);

    if (oversizedFiles.length > 0) {
      notify(`${oversizedFiles.length} file dilewati karena melebihi 100 MB.`, 'error');
    }

    if (!validFiles.length) return;
    if (!session?.user || !supabase) return;

    setUploadBusy(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    const newBooks = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length });
      try {
        const meta = await getBookMeta(file);
        const id = crypto.randomUUID();
        const path = `${session.user.id}/${id}.epub`;
        const { error: uploadError } = await supabase.storage.from('epub-files').upload(path, file, {
          contentType: 'application/epub+zip',
          upsert: false
        });
        if (uploadError) throw uploadError;

        const { data, error: insertError } = await supabase.from('books').insert({
          user_id: session.user.id,
          title: meta.title,
          author: meta.author,
          file_path: path,
          file_size: file.size
        }).select().single();

        if (insertError) {
          await supabase.storage.from('epub-files').remove([path]);
          throw insertError;
        }

        newBooks.push(data);
        if (meta.coverDataUrl) {
          saveCoverToDb(data.id, meta.coverDataUrl);
          setCovers(prev => ({ ...prev, [data.id]: meta.coverDataUrl }));
        }
        successCount++;
      } catch (err) {
        console.error('Gagal mengunggah:', file.name, err);
        failedCount++;
      }
    }

    if (newBooks.length > 0) {
      setBooks(old => [...newBooks, ...old]);
    }

    if (validFiles.length === 1) {
      if (successCount === 1) {
        notify(`“${newBooks[0]?.title || 'Buku'}” berhasil ditambahkan ke rak buku.`);
      } else {
        notify('Buku gagal diunggah.', 'error');
      }
    } else {
      if (failedCount === 0) {
        notify(`${successCount} buku berhasil ditambahkan ke rak buku!`);
      } else {
        notify(`${successCount} buku berhasil diunggah (${failedCount} gagal).`, failedCount > successCount ? 'error' : 'success');
      }
    }

    setUploadBusy(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const onAddBookClick = () => {
    if (!canUpload) {
      notify('Fitur tambah buku terbuka setelah kamu membeli ebook di tab Katalog.', 'error');
      return;
    }
    fileInput.current?.click();
  };

  const uploadBook = async event => {
    const files = event.target.files;
    await processFiles(files);
    event.target.value = '';
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      await processFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    if (!books.length) return;
    let cancelled = false;
    (async () => {
      // 1) Sampul tersimpan di perangkat (IndexedDB): cepat, ambil semuanya paralel
      const missing = [];
      await Promise.all(books.map(async (book) => {
        const cached = await getCoverFromDb(book.id);
        if (cached) { if (!cancelled) setCovers(prev => prev[book.id] ? prev : { ...prev, [book.id]: cached }); }
        // Jika belum ada di perangkat tapi thumbnail sudah ada di database, thumbnail itu langsung dipakai
        // (lihat cover={covers[id] || book.cover_thumb}), tidak perlu mengunduh EPUB sama sekali.
        else if (!book.cover_thumb) missing.push(book);
      }));
      if (cancelled || !supabase || !missing.length) return;
      // 2) Hanya buku tanpa thumbnail yang mengunduh EPUB, dibatasi 2 sekaligus agar tidak membanjiri jaringan
      let idx = 0;
      const worker = async () => {
        while (!cancelled && idx < missing.length) {
          const book = missing[idx++];
          try {
            const { data, error } = await supabase.storage.from('epub-files').download(book.file_path);
            if (!data || error) continue;
            const buffer = await data.arrayBuffer();
            const ePub = await loadEpub();
            const bookInst = ePub(buffer);
            await bookInst.ready;
            const coverUrl = await extractCoverFromBook(bookInst);
            bookInst.destroy();
            if (coverUrl) {
              await saveCoverToDb(book.id, coverUrl);
              if (!cancelled) setCovers(prev => ({ ...prev, [book.id]: coverUrl }));
            }
          } catch (e) {
            console.warn('Sampul tidak ditemukan untuk', book.title);
          }
        }
      };
      await Promise.all([worker(), worker()]);
    })();
    return () => { cancelled = true; };
  }, [books]);

  const deleteBook = async book => {
    if (!window.confirm(`Hapus “${book.title}” dari koleksi? File EPUB dan progres bacanya juga akan dihapus.`)) return;
    const { error: storageError } = await supabase.storage.from('epub-files').remove([book.file_path]);
    if (storageError) { notify(storageError.message, 'error'); return; }
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) { notify(error.message, 'error'); return; }
    deleteCoverFromDb(book.id);
    try {
      localStorage.removeItem(`rb_progress_${book.id}`);
      localStorage.removeItem(`rb_loc_${book.id}`);
    } catch {}
    setCovers(prev => { const n = {...prev}; delete n[book.id]; return n; });
    setBooks(old => old.filter(b => b.id !== book.id));
    setProgress(old => { const n = {...old}; delete n[book.id]; return n; });
    if (activeBook?.id === book.id) setActiveBook(null);
    notify('Buku dihapus dari koleksi.');
  };

  const openBook = book => { setActiveBook(book); setReaderRefresh(n => n + 1); };

  const startEditBook = (book, e) => {
    e?.stopPropagation();
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBook || !supabase) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      notify('Judul buku tidak boleh kosong.', 'error');
      return;
    }
    const trimmedAuthor = editAuthor.trim() || 'Penulis tidak diketahui';

    setEditBusy(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .update({
          title: trimmedTitle,
          author: trimmedAuthor,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBook.id)
        .select()
        .single();

      if (error) throw error;

      setBooks(old => old.map(b => b.id === editingBook.id ? data : b));
      if (activeBook?.id === editingBook.id) {
        setActiveBook(data);
      }
      notify(`Judul buku berhasil diperbarui.`);
      setEditingBook(null);
    } catch (err) {
      notify(err.message || 'Gagal mengubah judul buku.', 'error');
    } finally {
      setEditBusy(false);
    }
  };

  // ---------- Urutan rak buku (drag & drop), disimpan per akun di browser ----------
  const [order, setOrder] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);
  const orderedIdsRef = useRef([]);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) { setOrder([]); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(`rb_order_${userId}`) || '[]');
      setOrder(Array.isArray(saved) ? saved : []);
    } catch { setOrder([]); }
  }, [userId]);

  const orderedBooks = useMemo(() => {
    const pos = new Map(order.map((id, i) => [id, i]));
    const fresh = books.filter(b => !pos.has(b.id));
    const known = books.filter(b => pos.has(b.id)).sort((a, b) => pos.get(a.id) - pos.get(b.id));
    return [...fresh, ...known];
  }, [books, order]);
  orderedIdsRef.current = orderedBooks.map(b => b.id);

  const moveBook = (dragId, overId) => {
    const ids = orderedIdsRef.current.slice();
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    orderedIdsRef.current = ids;
    setOrder(ids);
    try { if (userId) localStorage.setItem(`rb_order_${userId}`, JSON.stringify(ids)); } catch {}
  };

  const saveOrderTimer = useRef(null);
  const warnedOrder = useRef(false);
  const saveOrderToCloud = () => {
    if (!supabase || !userId) return;
    clearTimeout(saveOrderTimer.current);
    saveOrderTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('shelf_order').upsert(
        { user_id: userId, book_ids: orderedIdsRef.current, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error && !warnedOrder.current) {
        warnedOrder.current = true;
        notify('Urutan tersimpan di perangkat ini, tapi belum tersinkron ke akun. Jalankan SQL shelf_order di Supabase.', 'error');
      }
    }, 400);
  };

  const startCardDrag = (e, bookId) => {
    if (query || sortMode !== 'manual' || dragRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.book-card-actions')) return;
    const card = e.currentTarget;
    const isTouch = e.pointerType !== 'mouse';
    const st = {
      id: bookId, card, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY,
      active: false, timer: null, raf: 0, ghost: null, dx: 0, dy: 0
    };
    dragRef.current = st;

    const hitTest = () => {
      const el = document.elementFromPoint(st.x, st.y);
      const target = el?.closest?.('.book-card[data-id]');
      if (target && target.dataset.id !== st.id) moveBook(st.id, target.dataset.id);
    };
    const tick = () => {
      if (!st.active) return;
      const edge = 90;
      if (st.y < edge) window.scrollBy(0, -Math.ceil((edge - st.y) / 5));
      else if (st.y > window.innerHeight - edge) window.scrollBy(0, Math.ceil((st.y - (window.innerHeight - edge)) / 5));
      hitTest();
      st.raf = requestAnimationFrame(tick);
    };
    const begin = () => {
      st.active = true;
      const r = card.getBoundingClientRect();
      st.dx = st.x - r.left;
      st.dy = st.y - r.top;
      const g = card.cloneNode(true);
      g.removeAttribute('data-id');
      Object.assign(g.style, {
        position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`,
        margin: '0', zIndex: '9999', pointerEvents: 'none', opacity: '.95',
        transform: 'scale(1.06) rotate(-2deg)', transition: 'transform .15s ease',
        filter: 'drop-shadow(0 14px 22px rgba(0,0,0,.32))'
      });
      g.classList.remove('is-drag-source');
      document.body.appendChild(g);
      st.ghost = g;
      document.body.classList.add('is-dragging-card');
      setDraggingId(st.id);
      try { navigator.vibrate?.(15); } catch {}
      st.raf = requestAnimationFrame(tick);
    };
    const onMove = ev => {
      st.x = ev.clientX; st.y = ev.clientY;
      if (!st.active) {
        const moved = Math.hypot(st.x - st.sx, st.y - st.sy);
        if (isTouch) { if (moved > 10) cleanup(false); }
        else if (moved > 6) begin();
        return;
      }
      st.ghost.style.left = `${st.x - st.dx}px`;
      st.ghost.style.top = `${st.y - st.dy}px`;
    };
    const blockScroll = ev => { if (st.active && ev.cancelable) ev.preventDefault(); };
    const onUp = () => cleanup(true);
    const stopClick = ev => { ev.stopPropagation(); ev.preventDefault(); };

    function cleanup(finished) {
      clearTimeout(st.timer);
      cancelAnimationFrame(st.raf);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.removeEventListener('touchmove', blockScroll);
      if (st.active) {
        st.ghost?.remove();
        document.body.classList.remove('is-dragging-card');
        setDraggingId(null);
        if (finished) {
          saveOrderToCloud();
          window.addEventListener('click', stopClick, { capture: true, once: true });
          setTimeout(() => window.removeEventListener('click', stopClick, true), 80);
        }
      }
      dragRef.current = null;
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    document.addEventListener('touchmove', blockScroll, { passive: false });
    if (isTouch) st.timer = setTimeout(begin, 350);
  };

  // ---------- Admin & akses buku ----------
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessBook, setAccessBook] = useState(null);
  const [accessList, setAccessList] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessInput, setAccessInput] = useState('');
  const canUpload = isAdmin || books.some(b => b.user_id !== userId && !b.is_sample);
  const showAppTab = !isAdmin && books.some(b => !b.is_sample);

  useEffect(() => {
    let alive = true;
    if (!supabase || !userId) { setIsAdmin(false); return; }
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (alive) setIsAdmin(!error && data === true);
    });
    return () => { alive = false; };
  }, [userId]);

  const loadAccessList = async (bookId) => {
    setAccessLoading(true);
    const { data, error } = await supabase
      .from('book_access')
      .select('id,user_email,created_at')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    setAccessLoading(false);
    if (error) { notify(error.message || 'Gagal memuat daftar akses.', 'error'); return; }
    setAccessList(data || []);
  };

  const openAccess = (book) => {
    setAccessBook(book);
    setAccessList([]);
    setAccessInput('');
    loadAccessList(book.id);
  };

  const grantAccess = async (e) => {
    e.preventDefault();
    if (!accessBook) return;
    const emails = [...new Set(accessInput.split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean))];
    if (!emails.length) return;
    const bad = emails.filter(x => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
    if (bad.length) { notify(`Format email tidak valid: ${bad.join(', ')}`, 'error'); return; }
    setAccessBusy(true);
    const rows = emails.map(email => ({ book_id: accessBook.id, user_email: email, granted_by: userId }));
    const { error } = await supabase.from('book_access').upsert(rows, { onConflict: 'book_id,user_email', ignoreDuplicates: true });
    setAccessBusy(false);
    if (error) { notify(error.message || 'Gagal memberi akses.', 'error'); return; }
    setAccessInput('');
    notify(`Akses diberikan ke ${emails.length} email.`);
    loadAccessList(accessBook.id);
  };

  const revokeAccess = async (row) => {
    if (!window.confirm(`Cabut akses ${row.user_email}?`)) return;
    const { error } = await supabase.from('book_access').delete().eq('id', row.id);
    if (error) { notify(error.message || 'Gagal mencabut akses.', 'error'); return; }
    setAccessList(list => list.filter(x => x.id !== row.id));
    notify('Akses dicabut.');
  };

  // ---------- Katalog otomatis & pemesanan ----------
  const [tab, setTab] = useState('shelf');
  // Naikkan APP_VERSION setiap ada APK baru agar label "Update" berkedip lagi untuk semua pengguna
  const APP_VERSION = '6';
  const [appSeen, setAppSeen] = useState(() => {
    try { return localStorage.getItem('rb_app_seen') === APP_VERSION; } catch { return false; }
  });
  const openAppTab = () => {
    setTab('app');
    setAppSeen(true);
    try { localStorage.setItem('rb_app_seen', APP_VERSION); } catch {}
  };
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogSelected, setCatalogSelected] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Pembelian katalog dibuka/ditutup admin (public.site_settings). Default dibuka.
  const [purchaseOpen, setPurchaseOpen] = useState(true);
  const loadPurchaseOpen = () => {
    if (!supabase) return;
    supabase.rpc('get_purchase_open').then(({ data, error }) => { if (!error) setPurchaseOpen(data !== false); });
  };
  useEffect(() => { if (session && tab === 'catalog') loadPurchaseOpen(); }, [session?.user?.id, tab]);
  useEffect(() => { if (!purchaseOpen) setCatalogSelected([]); }, [purchaseOpen]);
  const purchaseClosedError = m => /Pembelian ebook sedang ditutup/i.test(m || '') && (setPurchaseOpen(false), setCatalogSelected([]), true);
  const [checkoutResume, setCheckoutResume] = useState(null); // pesanan 'Belum dibayar' yang dilanjutkan

  // Katalog = semua buku milik admin (kecuali buku contoh), diambil lewat fungsi server get_catalog()
  const loadCatalog = async () => {
    if (!supabase) return;
    setCatalogLoading(true);
    const { data, error } = await supabase.rpc('get_catalog');
    setCatalogLoading(false);
    if (error) { setCatalogError(error.message || 'gagal memuat'); return; }
    const items = (data || []).map(r => ({
      id: r.book_id, book_id: r.book_id, title: r.title, author: r.author, file_size: r.file_size, cover_data: r.cover_thumb
    }));
    setCatalogError('');
    setCatalogItems(items);
    setCatalogSelected(sel => sel.filter(id => items.some(i => i.id === id)));
  };

  useEffect(() => {
    if (userId && tab === 'catalog') loadCatalog();
  }, [userId, tab]);

  const toggleCatalogSelect = id =>
    setCatalogSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);

  // ---------- Pesanan: dibuat pembeli, diterima admin ----------
  const [orders, setOrders] = useState([]);
  const warnedOrders = useRef(false);
  const loadOrders = async () => {
    if (!supabase) return;
    let data = null;
    const first = await supabase
      .from('orders')
      .select('*, order_items(book_id,title)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!first.error) {
      data = first.data;
    } else {
      // Cadangan: ambil pesanan dan item secara terpisah (tidak bergantung pada relasi di schema cache PostgREST)
      const ord = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (ord.error) {
        console.warn('Gagal memuat pesanan:', ord.error.message);
        if (isAdmin && !warnedOrders.current) {
          warnedOrders.current = true;
          notify(`Pesanan gagal dimuat: ${ord.error.message}`, 'error');
        }
        return;
      }
      const rows = ord.data || [];
      const ids = rows.map(o => o.id);
      const itemsRes = ids.length
        ? await supabase.from('order_items').select('order_id,book_id,title').in('order_id', ids)
        : { data: [] };
      const byOrder = {};
      (itemsRes.data || []).forEach(it => { (byOrder[it.order_id] = byOrder[it.order_id] || []).push(it); });
      data = rows.map(o => ({ ...o, order_items: byOrder[o.id] || [] }));
    }
    setOrders(data || []);
    if (!isAdmin) {
      const have = new Set(books.map(b => b.id));
      const missing = (data || []).some(o => o.status === 'approved' && (o.order_items || []).some(i => i.book_id && !have.has(i.book_id)));
      if (missing) loadBooks();
    }
  };
  const loadOrdersRef = useRef(null);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    if (!userId) { setOrders([]); return; }
    loadOrdersRef.current();
    if (!(isAdmin || tab === 'catalog' || tab === 'orders')) return;
    const t = setInterval(() => loadOrdersRef.current(), isAdmin ? 12000 : 45000);
    const onFocus = () => { if (document.visibilityState === 'visible') loadOrdersRef.current(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, isAdmin, tab]);

  // Admin: pesanan baru muncul seketika lewat Realtime (butuh tabel orders di publikasi supabase_realtime)
  useEffect(() => {
    if (!supabase || !userId || !isAdmin) return;
    const channel = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrdersRef.current())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, isAdmin]);

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  // Tiga buku terlaris untuk ilustrasi banner (diambil dari fungsi server get_bestsellers)
  const [bestsellers, setBestsellers] = useState([]);
  useEffect(() => {
    if (!supabase || !userId) { setBestsellers([]); return; }
    let alive = true;
    supabase.rpc('get_bestsellers').then(({ data, error }) => {
      if (alive && !error && Array.isArray(data)) setBestsellers(data);
    });
    return () => { alive = false; };
  }, [userId]);
  // Pengguna baru (belum punya buku selain contoh): arahkan perhatian ke tab Katalog
  const nudgeCatalog = !isAdmin && booksLoaded && !loadingBooks && tab !== 'catalog' && !books.some(b => !b.is_sample);

  const submitOrder = async ({ code, total, ids, proof }) => {
    // Bukti bayar diunggah lebih dulu (nama file = kode pesanan), baru pesanan dicatat
    if (proof) {
      const { error: upError } = await supabase.storage.from(PROOF_BUCKET).upload(proofPath(code), proof, { contentType: 'image/jpeg', upsert: false });
      if (upError) { notify(`Gagal mengunggah bukti bayar: ${upError.message}`, 'error'); return { ok: false }; }
    }
    const { error } = await supabase.rpc('create_order', { p_book_ids: ids, p_total: total, p_code: code });
    if (error) { purchaseClosedError(error.message); notify(error.message || 'Gagal membuat pesanan.', 'error'); return { ok: false }; }
    setCatalogSelected([]);
    loadOrders();
    return { ok: true };
  };

  // ---- QRIS dinamis: pesanan dicatat dulu dengan nominal unik, pembayaran terdeteksi otomatis ----
  const fetchOrderByCode = async code => {
    const { data } = await supabase.from('orders')
      .select('id,code,status,total,pay_amount,unique_code,expires_at,created_at')
      .eq('code', code).maybeSingle();
    return data;
  };
  const startQrisOrder = async ({ code, total, ids }) => {
    const { error: rErr } = await supabase.rpc('qris_reserve', { p_code: code, p_total: total });
    if (rErr) {
      // Fungsi belum dipasang di Supabase -> pakai alur lama (unggah bukti bayar)
      if (rErr.code === 'PGRST202' || /qris_reserve/i.test(rErr.message || '')) return { legacy: true };
      purchaseClosedError(rErr.message);
      return { ok: false, error: rErr.message || 'Gagal menyiapkan pembayaran.' };
    }
    const { error } = await supabase.rpc('create_order', { p_book_ids: ids, p_total: total, p_code: code });
    if (error) { purchaseClosedError(error.message); return { ok: false, error: error.message || 'Gagal membuat pesanan.' }; }
    // create_order bisa menimpa status menjadi 'pending'; kembalikan ke 'menunggu pembayaran'
    await supabase.rpc('qris_attach', { p_code: code });
    const order = await fetchOrderByCode(code);
    setCatalogSelected([]);
    loadOrders();
    if (!order) return { ok: false, error: 'Pesanan tercatat, tetapi gagal dimuat. Cek bagian Pesanan saya.' };
    return { ok: true, order };
  };
  const claimPaid = async (order, proof) => {
    if (proof) {
      const { error: upError } = await supabase.storage.from(PROOF_BUCKET).upload(proofPath(order.code), proof, { contentType: 'image/jpeg', upsert: true });
      if (upError) return { ok: false, error: `Gagal mengunggah bukti bayar: ${upError.message}` };
    }
    const { error } = await supabase.rpc('qris_claim_paid', { p_order_id: order.id });
    if (error) return { ok: false, error: error.message || 'Gagal mengirim konfirmasi.' };
    loadOrders();
    return { ok: true };
  };

  const approveOrder = async o => {
    if (!window.confirm(`Terima pesanan ${o.code} dan buka kunci ${(o.order_items || []).length} buku untuk ${o.user_email}?`)) return;
    const { error } = await supabase.rpc('approve_order', { p_order_id: o.id });
    if (error) { notify(error.message || 'Gagal menerima pesanan.', 'error'); return; }
    deleteProof(o.code);
    notify('Pesanan diterima. Buku sudah masuk ke rak pembeli.');
    loadOrders();
  };

  const rejectOrder = async o => {
    if (!window.confirm(`Tolak pesanan ${o.code} dari ${o.user_email}?`)) return;
    const { error } = await supabase.rpc('reject_order', { p_order_id: o.id });
    if (error) { notify(error.message || 'Gagal menolak pesanan.', 'error'); return; }
    deleteProof(o.code);
    notify('Pesanan ditolak.');
    loadOrders();
  };

  // Thumbnail sampul disimpan otomatis ke tiap buku (admin: semua buku, pengguna: buku sendiri) agar tampil di katalog
  const thumbTried = useRef(new Set());
  useEffect(() => {
    if (!userId) return;
    const todo = books.filter(b => (isAdmin || b.user_id === userId) && !b.cover_thumb && covers[b.id] && !thumbTried.current.has(b.id));
    if (!todo.length) return;
    (async () => {
      let ok = 0, firstError = '';
      for (const b of todo) {
        thumbTried.current.add(b.id);
        const thumb = await makeThumb(covers[b.id]);
        if (!thumb) continue;
        const { error } = await supabase.from('books').update({ cover_thumb: thumb }).eq('id', b.id);
        if (error) { firstError = firstError || error.message; continue; }
        ok += 1;
        setBooks(list => list.map(x => x.id === b.id ? { ...x, cover_thumb: thumb } : x));
      }
      if (isAdmin) {
        if (firstError) notify(`Sampul katalog gagal disimpan: ${firstError}`, 'error');
        else if (ok > 0) notify(`Sampul katalog diperbarui (${ok} buku).`);
      }
    })();
  }, [isAdmin, userId, books, covers]);

  const [sortMode, setSortMode] = useState(() => {
    try { return localStorage.getItem('rb_sort') || 'manual'; } catch { return 'manual'; }
  });
  const [showOwner, setShowOwner] = useState(() => {
    try { return localStorage.getItem('rb_show_owner') !== '0'; } catch { return true; }
  });
  const toggleOwner = () => {
    setShowOwner(v => {
      try { localStorage.setItem('rb_show_owner', v ? '0' : '1'); } catch {}
      return !v;
    });
  };
  const changeSort = (value) => {
    setSortMode(value);
    try { localStorage.setItem('rb_sort', value); } catch {}
  };

  const toggleSample = async (book) => {
    const next = !book.is_sample;
    const { error } = await supabase.from('books').update({ is_sample: next }).eq('id', book.id);
    if (error) { notify(error.message || 'Gagal mengubah status buku contoh.', 'error'); return; }
    setBooks(list => list.map(b => b.id === book.id ? { ...b, is_sample: next } : b));
    notify(next ? 'Buku dijadikan contoh untuk semua pengguna.' : 'Buku tidak lagi menjadi contoh.');
  };

  // Pembeli (sudah punya buku hasil pembelian) tidak perlu lagi melihat buku contoh di raknya
  const hasPurchased = !isAdmin && books.some(b => b.user_id !== userId && !b.is_sample);
  const shelfBooks = useMemo(
    () => hasPurchased ? orderedBooks.filter(b => !(b.is_sample && b.user_id !== userId)) : orderedBooks,
    [orderedBooks, hasPurchased, userId]
  );

  const filteredBooks = useMemo(() => {
    const list = shelfBooks.filter(book =>
      `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase())
    );
    if (sortMode === 'manual') return list;
    const cmp = (a, b) => String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base', numeric: true });
    const sorted = list.slice();
    if (sortMode === 'title-asc') sorted.sort((a, b) => cmp(a.title, b.title));
    else if (sortMode === 'title-desc') sorted.sort((a, b) => cmp(b.title, a.title));
    else if (sortMode === 'author-asc') sorted.sort((a, b) => cmp(a.author, b.author) || cmp(a.title, b.title));
    return sorted;
  }, [shelfBooks, query, sortMode]);

  // Tombol Back Android di level aplikasi
  const appBackRef = useRef(null);
  appBackRef.current = () => {
    if (activeBook) { window.dispatchEvent(new Event('rb:reader-back')); return true; }
    if (checkoutOpen) { setCheckoutOpen(false); return true; }
    if (editingBook) { setEditingBook(null); return true; }
    if (accessBook) { setAccessBook(null); return true; }
    if (tab !== 'shelf') { setTab('shelf'); return true; }
    return false;
  };
  useEffect(() => {
    if (!IS_NATIVE) return;
    let handle = null;
    let alive = true;
    import('@capacitor/app').then(async ({ App: CapApp }) => {
      const h = await CapApp.addListener('backButton', () => {
        if (!appBackRef.current?.()) CapApp.minimizeApp();
      });
      if (alive) handle = h; else h.remove();
    });
    return () => { alive = false; handle?.remove(); };
  }, []);

  if (!supabase) return <SetupMissing />;
  if (!authReady) return <div className="loading-screen"><LoaderCircle className="spin" size={28}/><span>Menyiapkan Ruang Bacaan…</span></div>;
  if (recovering && session) return <ResetPasswordScreen theme={theme} setTheme={setTheme} onDone={() => {
    setRecovering(false);
    try { window.history.replaceState(null, '', window.location.pathname); } catch {}
    notify('Kata sandi berhasil diubah.');
  }} />;
  if (!session) return <AuthScreen {...{remember,setRemember,authMode,setAuthMode,setAuthMessage,email,setEmail,password,setPassword,authBusy,authMessage,handleAuth,theme,setTheme,signupOpen}} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><BookOpen size={22}/></div>
          <div><div className="brand-name">ruang bacaan</div><div className="brand-caption">PERPUSTAKAAN PRIBADI</div></div>
        </div>
        <div className="top-actions">
          <span className="account-email">{session.user.email}</span>
          <button className="icon-button" title={theme === 'light' ? 'Aktifkan dark mode' : 'Aktifkan light mode'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
          </button>
          <button className="icon-button" title="Keluar" onClick={handleLogout}><LogOut size={18}/></button>
        </div>
      </header>

      {activeBook ? (
        <Reader
          key={`${activeBook.id}-${readerRefresh}`}
          book={activeBook}
          savedProgress={progress[activeBook.id]}
          userId={session?.user?.id}
          onClose={() => setActiveBook(null)}
          onProgress={(row) => setProgress(old => ({...old, [activeBook.id]: row}))}
          onCoverLoaded={(id, url) => setCovers(prev => ({...prev, [id]: url}))}
          notify={notify}
        />
      ) : (
        <main
          className="library-main"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="drag-overlay">
              <div className="drag-content">
                <UploadCloud size={48} />
                <h3>Lepaskan file EPUB di sini</h3>
                <p>Mendukung pengunggahan banyak file sekaligus (multiple upload)</p>
              </div>
            </div>
          )}

          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><LibraryBig size={15}/> RUANG UNTUK CERITA</div>
              <h1>Semua bacaan,<br/><em>dalam satu rak.</em></h1>
              <p>Perpustakaan digital pribadi yang ikut ke mana pun Anda pergi.</p>
              <div className="hero-foot"><span><CheckCircle2 size={15}/> Tersimpan di cloud</span><span><CheckCircle2 size={15}/> Progres tersinkronisasi</span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-sun"></div>
              {bestsellers[0]?.sold > 0 && <div className="art-label"><span>BEST</span><span>SELLER</span></div>}
              {[['book-one', bestsellers[1]], ['book-two', bestsellers[0]], ['book-three', bestsellers[2]]].map(([cls, b]) => (
                <div key={cls} className={`art-book ${cls}${b?.cover_thumb ? ' has-cover' : ''}`}>
                  {b?.cover_thumb && <img src={b.cover_thumb} alt="" draggable="false"/>}
                </div>
              ))}
              <div className="art-line"></div>
            </div>
          </section>

          <NewsTicker onOpenCatalog={isAdmin ? null : () => setTab('catalog')}/>

          <div className="tabs-bar" role="tablist">
            <button role="tab" aria-selected={tab === 'shelf'} className={tab === 'shelf' ? 'active' : ''} onClick={() => setTab('shelf')}><LibraryBig size={16}/> Rak Buku</button>
            <button role="tab" aria-selected={tab === 'catalog'} className={`${tab === 'catalog' ? 'active' : ''}${nudgeCatalog ? ' nudge' : ''}`} onClick={() => setTab('catalog')}><ShoppingBag size={16}/> Katalog</button>
            {showAppTab && !IS_NATIVE && (
              <button role="tab" aria-selected={tab === 'app'} className={tab === 'app' ? 'active' : ''} onClick={openAppTab}><AndroidIcon size={16}/> <span className="tab-text">Aplikasi Android{!appSeen && <sup className="tab-sup">update</sup>}</span></button>
            )}
            {isAdmin && (
              <button role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
                <ClipboardList size={16}/> Pesanan{pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
              </button>
            )}
            {isAdmin && (
              <button role="tab" aria-selected={tab === 'settings'} className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
                <Settings size={16}/> Pengaturan
              </button>
            )}
          </div>

          {tab === 'shelf' && (
          <section className="shelf-section">
            <div className="section-heading">
              <div><div className="eyebrow muted">KOLEKSI ANDA</div><h2>Rak buku <span className="count">{shelfBooks.length}</span></h2></div>
              <div className="shelf-tools">
                <label className="searchbox"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari judul atau penulis…"/></label>
                <select className="sort-select" value={sortMode} onChange={e => changeSort(e.target.value)} title="Urutkan buku" aria-label="Urutkan buku">
                  <option value="manual">Urutan saya</option>
                  <option value="title-asc">Judul A–Z</option>
                  <option value="title-desc">Judul Z–A</option>
                  <option value="author-asc">Penulis A–Z</option>
                </select>
                {isAdmin && (
                  <button
                    type="button"
                    className={`owner-toggle${showOwner ? ' on' : ''}`}
                    onClick={toggleOwner}
                    title={showOwner ? 'Sembunyikan keterangan pengunggah' : 'Tampilkan keterangan pengunggah'}
                    aria-pressed={showOwner}
                  >
                    {showOwner ? <Eye size={16}/> : <EyeOff size={16}/>}
                    <span>Pengunggah</span>
                  </button>
                )}
                <button className="primary-button" onClick={onAddBookClick} disabled={uploadBusy}>
                  {uploadBusy ? <LoaderCircle size={17} className="spin"/> : <Plus size={18}/>}
                  {uploadBusy
                    ? (uploadProgress.total > 1 ? `Mengunggah (${uploadProgress.current}/${uploadProgress.total})…` : 'Mengunggah…')
                    : 'Tambah buku'}
                </button>
                <input ref={fileInput} type="file" accept=".epub,application/epub+zip" multiple hidden onChange={uploadBook}/>
              </div>
            </div>

            {loadingBooks ? <div className="empty-state"><LoaderCircle className="spin" size={24}/><p>Memuat koleksi dari cloud…</p></div> :
             filteredBooks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><BookMarked size={27}/></div>
                <h3>{query ? 'Buku tidak ditemukan' : 'Rak buku masih kosong'}</h3>
                <p>{query ? 'Coba kata kunci yang berbeda.' : canUpload ? 'Unggah file EPUB Anda. Anda bisa memilih banyak file sekaligus atau menyeretnya ke sini.' : 'Beli ebook di tab Katalog. Buku yang sudah dibeli akan muncul di sini.'}</p>
                {!query && <button className="secondary-button" onClick={onAddBookClick} disabled={uploadBusy}><UploadCloud size={17}/> {uploadBusy ? 'Mengunggah…' : 'Unggah EPUB (Bisa Banyak)'}</button>}
              </div>
             ) : (
              <>
              {!isAdmin && !canUpload && books.length > 0 && (
                <p className="info-banner">Kamu baru memiliki buku contoh. Beli ebook di tab Katalog untuk membuka fitur menambah buku sendiri.</p>
              )}
              {!query && sortMode === 'manual' && filteredBooks.length > 1 && <p className="drag-hint">Tahan lalu geser sampul untuk mengatur urutan buku.</p>}
              <div className="book-grid">
                {filteredBooks.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    cover={covers[book.id] || book.cover_thumb}
                    progress={progress[book.id]}
                    index={index}
                    onOpen={() => openBook(book)}
                    onEdit={(e) => startEditBook(book, e)}
                    onDelete={() => deleteBook(book)}
                    onDownload={() => downloadEpub(book, notify)}
                    shared={!isAdmin && book.user_id !== userId}
                    ownerLabel={isAdmin && book.user_id !== userId ? (book.uploader_email || 'pengguna lain') : null}
                    isAdmin={isAdmin}
                    showOwner={showOwner}
                    onAccess={() => openAccess(book)}
                    isSample={!!book.is_sample}
                    onToggleSample={() => toggleSample(book)}
                    dragging={draggingId === book.id}
                    onPointerDown={(query || sortMode !== 'manual') ? undefined : (e) => startCardDrag(e, book.id)}
                  />
                ))}
              </div>
              </>
             )}
            <div className="privacy-note"><span className="privacy-dot"></span> {isAdmin ? 'Buku yang Anda unggah tampil di katalog dan dapat dibeli pengguna lain.' : 'Buku yang Anda unggah bersifat pribadi dan hanya tersimpan di rak Anda.'} Masuk dengan akun yang sama untuk mengaksesnya di perangkat lain.</div>
          </section>
          )}

          {tab === 'catalog' && (
            <CatalogSection
              purchaseOpen={purchaseOpen}
              items={catalogItems}
              loading={catalogLoading}
              error={catalogError}
              ownedIds={new Set(books.map(b => b.id))}
              ownedKeys={new Set(books.map(b => bookKey(b.title, b.author, b.file_size)))}
              selected={catalogSelected}
              onToggle={toggleCatalogSelect}
              isAdmin={isAdmin}
              orders={orders}
              onCheckout={() => { setCheckoutResume(null); setCheckoutOpen(true); }}
              onResumePay={o => { setCheckoutResume(o); setCheckoutOpen(true); }}
              onClear={() => setCatalogSelected([])}
            />
          )}

          {tab === 'app' && showAppTab && (
            <section className="app-dl">
              <div className="app-dl-card app-dl-hero">
                <div className="app-dl-icon"><AndroidIcon size={32}/></div>
                <span className="app-dl-badge">Versi {APP_RELEASE.version}</span>
                <h2>Ruang Bacaan untuk Android</h2>
                <p className="app-dl-lead">Baca koleksi ebook-mu langsung dari aplikasi, tanpa membuka browser. Akun, buku, dan progres bacamu sama persis dengan di situs.</p>
                <div className="app-dl-actions">
                  <a className="app-dl-btn" href={APK_URL} rel="noopener"><Download size={18}/> Unduh Aplikasi (APK)</a>
                  <ul className="app-dl-meta">
                    <li><AndroidIcon size={13}/> Android 7.0+</li>
                    <li>± 3 MB</li>
                    <li>{APP_RELEASE.shortDate}</li>
                  </ul>
                </div>
              </div>

              <div className="app-dl-notice">
                <Info size={18}/>
                <span>Masih memakai aplikasi Ruang Bacaan <b>versi lama</b> (sebelum 2.1.0)? Hapus dulu, lalu pasang versi ini. Akun dan bukumu tetap aman di cloud. Pembaruan berikutnya cukup dipasang di atasnya.</span>
              </div>

              <div className="app-dl-card">
                <h3 className="app-dl-title">Cara memasang</h3>
                <ol className="app-dl-steps">
                  <li><span>Ketuk <b>Unduh Aplikasi (APK)</b>, lalu tunggu file selesai terunduh.</span></li>
                  <li><span>Buka file <b>RuangBacaan.apk</b> dari notifikasi atau folder Download.</span></li>
                  <li><span>Jika diminta, izinkan pemasangan dari sumber ini, lalu ketuk <b>Pasang</b>.</span></li>
                  <li><span>Buka Ruang Bacaan dan masuk dengan akun yang sama.</span></li>
                </ol>
              </div>

              <div className="app-dl-card">
                <h3 className="app-dl-title">Changelog</h3>
                {CHANGELOG.map((rel, i) => (
                  <details className="changelog-entry" key={rel.version} open={i === 0}>
                    <summary>
                      <span className="changelog-version">Versi {rel.version}</span>
                      {i === 0 && <span className="changelog-tag">Terbaru</span>}
                      <span className="changelog-date">{rel.date}</span>
                    </summary>
                    <div className="changelog-body">
                      {rel.groups.map(g => {
                        const Icon = g.icon || CheckCircle2;
                        return (
                          <div className="changelog-group" key={g.title}>
                            <h4><Icon size={15}/> {g.title}</h4>
                            <ul>
                              {g.items.map(([head, body]) => <li key={head}><strong>{head}</strong> {body}</li>)}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {tab === 'settings' && isAdmin && <AdminSettings notify={notify} onPurchaseChange={loadPurchaseOpen} />}

          {tab === 'orders' && isAdmin && (
            <OrdersSection orders={orders} onApprove={approveOrder} onReject={rejectOrder} />
          )}
        </main>
      )}

      {checkoutOpen && (
        <CheckoutModal
          items={catalogItems.filter(i => catalogSelected.includes(i.id) && !books.some(b => b.id === i.book_id || bookKey(b.title, b.author, b.file_size) === bookKey(i.title, i.author, i.file_size)))}
          resumeOrder={checkoutResume}
          email={session?.user?.email || ''}
          onClose={() => { setCheckoutOpen(false); setCheckoutResume(null); loadOrders(); }}
          onStart={startQrisOrder}
          onFetch={fetchOrderByCode}
          onClaim={claimPaid}
          onPaid={() => loadOrders()}
          onSubmit={submitOrder}
          onConfirmed={() => {
            setCheckoutOpen(false);
            notify('Pesanan terkirim. Admin akan memeriksa bukti bayarmu dan membuka kunci buku.');
          }}
        />
      )}

      {editingBook && (
        <div className="modal-backdrop" onClick={() => !editBusy && setEditingBook(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Pencil size={18} className="modal-icon-teal" />
                <span>Ubah Informasi Buku</span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEditingBook(null)}
                disabled={editBusy}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <label>
                Judul Buku
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Masukkan judul baru…"
                  required
                  autoFocus
                />
              </label>
              <label>
                Penulis
                <input
                  type="text"
                  value={editAuthor}
                  onChange={e => setEditAuthor(e.target.value)}
                  placeholder="Nama penulis…"
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingBook(null)}
                  disabled={editBusy}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={editBusy || !editTitle.trim()}
                >
                  {editBusy ? <LoaderCircle size={16} className="spin" /> : null}
                  {editBusy ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accessBook && (
        <div className="modal-backdrop" onClick={() => !accessBusy && setAccessBook(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={18} className="modal-icon-teal" />
                <span>Kelola Akses Buku</span>
              </div>
              <button className="modal-close-btn" onClick={() => setAccessBook(null)} disabled={accessBusy} title="Tutup">
                <X size={18} />
              </button>
            </div>
            <p className="access-book-title">{accessBook.title}</p>
            <form onSubmit={grantAccess} className="modal-form">
              <label>
                Email pembeli (boleh lebih dari satu, pisahkan dengan koma)
                <input
                  type="text"
                  value={accessInput}
                  onChange={e => setAccessInput(e.target.value)}
                  placeholder="nama@email.com, lainnya@email.com"
                  autoFocus
                />
              </label>
              <button type="submit" className="primary-button" disabled={accessBusy || !accessInput.trim()}>
                {accessBusy ? <LoaderCircle size={16} className="spin" /> : null}
                {accessBusy ? 'Memberi akses…' : 'Beri Akses'}
              </button>
            </form>
            <div className="access-list">
              <div className="access-list-head">Pemilik akses ({accessList.length})</div>
              {accessLoading ? (
                <div className="access-empty"><LoaderCircle size={15} className="spin" /> Memuat…</div>
              ) : accessList.length === 0 ? (
                <div className="access-empty">Belum ada email yang diberi akses.</div>
              ) : accessList.map(row => (
                <div className="access-row" key={row.id}>
                  <span title={row.user_email}>{row.user_email}</span>
                  <button className="delete-button" title="Cabut akses" onClick={() => revokeAccess(row)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {notice && <div className={`toast ${notice.kind}`}><span>{notice.kind === 'error' ? <AlertCircle size={17}/> : <CheckCircle2 size={17}/>}</span>{notice.message}<button onClick={() => setNotice(null)}><X size={15}/></button></div>}
    </div>
  );
}

function BookCard({book, progress, index, cover, onOpen, onEdit, onDelete, onDownload, onAccess, onToggleSample, isSample, shared, isAdmin, ownerLabel, showOwner, dragging, onPointerDown}) {
  const colors = coverColors(book.title);
  const percentage = Math.min(100, Math.max(0, Number(progress?.percentage || 0)));
  return <article
    className={`book-card${dragging ? ' is-drag-source' : ''}`}
    data-id={book.id}
    onPointerDown={onPointerDown}
    onContextMenu={e => { if (onPointerDown && e.pointerType !== 'mouse' && e.nativeEvent?.pointerType !== 'mouse') e.preventDefault(); }}
    onDragStart={e => e.preventDefault()}
  >
    <button className="cover-button" onClick={onOpen} aria-label={`Baca ${book.title}`}>
      {cover ? (
        <div className="book-cover-image-wrap">
          <img src={cover} alt={book.title} className="book-cover-img" />
        </div>
      ) : (
        <div className="book-cover" style={{'--cover-bg': colors[0], '--cover-ink': colors[1]}}>
          <div className="cover-topline">RUANG BACAAN · E-BOOK</div>
          <div className="cover-decoration"><span></span><span></span><span></span></div>
          <div className="cover-title">{book.title}</div>
          <div className="cover-author">{book.author}</div>
          <div className="cover-bottom">RB / {String(index + 1).padStart(2, '0')}</div>
        </div>
      )}
      <span className="cover-open"><BookOpen size={16}/> Baca buku</span>
    </button>
    <div className="book-details">
      <div className="book-title-row">
        <h3 title={book.title}>{book.title}</h3>
        <div className="book-card-actions">
          {shared ? (
            <>
              <span className="shared-badge" title={isSample ? 'Buku contoh dari admin' : 'Buku ini dibagikan oleh admin'}>{isSample ? 'Contoh' : 'Dibagikan'}</span>
              <button className="download-button" title="Unduh file EPUB" onClick={onDownload}>
                <Download size={14}/>
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <>
                  <button className={`sample-button${isSample ? ' on' : ''}`} title={isSample ? 'Buku contoh untuk semua pengguna (klik untuk batalkan)' : 'Jadikan buku contoh untuk semua pengguna'} onClick={onToggleSample}>
                    <Gift size={14}/>
                  </button>
                  <button className="access-button" title="Kelola akses pembaca" onClick={onAccess}>
                    <Users size={14}/>
                  </button>
                </>
              )}
              <button className="edit-button" title="Ubah judul atau penulis" onClick={onEdit}>
                <Pencil size={13}/>
              </button>
              <button className="download-button" title="Unduh file EPUB" onClick={onDownload}>
                <Download size={14}/>
              </button>
              <button className="delete-button" title="Hapus buku" onClick={onDelete}>
                <Trash2 size={15}/>
              </button>
            </>
          )}
        </div>
      </div>
      <p className="book-author">{book.author}</p>
      {isAdmin && showOwner && <p className={`owner-tag${ownerLabel ? '' : ' mine'}`} title={ownerLabel ? `Diunggah oleh ${ownerLabel}` : 'Diunggah oleh admin'}>{ownerLabel ? `Dari: ${ownerLabel}` : 'Milik saya'}</p>}
      <div className="book-meta"><span>{percentage >= 100 ? 'Selesai dibaca' : percentage > 0 ? `${Math.max(1, Math.round(percentage))}% dibaca` : 'Belum dibaca'}</span></div>
      <div className="progress-track"><span style={{width: `${percentage}%`}}/></div>
    </div>
  </article>;
}

function Reader({book, savedProgress, userId, onClose, onProgress, onCoverLoaded, notify}) {
  const viewerRef = useRef(null);
  useEffect(() => { loadReaderFonts(); }, []);
  const renditionRef = useRef(null);
  const epubRef = useRef(null);
  const saveTimer = useRef(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [toc, setToc] = useState([]);
  const [navPanelOpen, setNavPanelOpen] = useState(false);
  const [navActiveTab, setNavActiveTab] = useState('toc'); // 'toc' | 'bookmarks' | 'highlights'
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState(() => getStoredBookmarks(book.id));
  const [highlights, setHighlights] = useState(() => getStoredHighlights(book.id));
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  const [selectionPopover, setSelectionPopover] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);

  const [current, setCurrent] = useState(() => {
    let initPct = Number(savedProgress?.percentage || 0);
    let initCfi = savedProgress?.cfi || null;
    if (!initCfi) {
      try {
        const local = localStorage.getItem(`rb_progress_${book.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.cfi) {
            initCfi = parsed.cfi;
            initPct = Number(parsed.percentage || 0);
          }
        }
      } catch {}
    }
    return { percentage: initPct, cfi: initCfi };
  });

  const [bookTitle, setBookTitle] = useState(book.title);

  // Layar tetap menyala selama membaca (Screen Wake Lock API, atau plugin native di aplikasi)
  useEffect(() => {
    if (IS_NATIVE) {
      let plugin = null;
      import('@capacitor-community/keep-awake').then(({ KeepAwake }) => {
        plugin = KeepAwake;
        KeepAwake.keepAwake().catch(() => {});
      }).catch(() => {});
      return () => { plugin?.allowSleep().catch(() => {}); };
    }
    let lock = null;
    let released = false;
    const request = async () => {
      try {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
        lock = await navigator.wakeLock.request('screen');
        if (released) { lock.release().catch(() => {}); lock = null; }
      } catch {}
    };
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (book.title) setBookTitle(book.title);
  }, [book.title]);
  const [locationLabel, setLocationLabel] = useState(() => {
    const pct = Number(savedProgress?.percentage || 0);
    return pct > 0 ? `${Math.round(pct)}% selesai` : 'Mulai membaca';
  });

  const isCurrentBookmarked = useMemo(() => {
    if (!current?.cfi) return false;
    return bookmarks.some(b => b.cfi === current.cfi || (b.label === locationLabel && Math.abs((b.percentage || 0) - (current.percentage || 0)) < 0.5));
  }, [bookmarks, current?.cfi, current?.percentage, locationLabel]);

  const [readerTheme, setReaderTheme] = useState(() => localStorage.getItem('rb_reader_theme') || 'sepia');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('rb_reader_fontsize') || 18));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('rb_reader_font') || 'Georgia');
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem('rb_reader_lineheight') || 1.6));
  const [pageMargin, setPageMargin] = useState(() => Number(localStorage.getItem('rb_reader_margin') || 40));
  const [textAlign, setTextAlign] = useState(() => localStorage.getItem('rb_reader_align') || 'justify');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('rb_reader_viewmode') || 'paginated');

  useEffect(() => {
    localStorage.setItem('rb_reader_theme', readerTheme);
    localStorage.setItem('rb_reader_fontsize', fontSize);
    localStorage.setItem('rb_reader_font', fontFamily);
    localStorage.setItem('rb_reader_lineheight', lineHeight);
    localStorage.setItem('rb_reader_margin', pageMargin);
    localStorage.setItem('rb_reader_align', textAlign);
    localStorage.setItem('rb_reader_viewmode', viewMode);
  }, [readerTheme, fontSize, fontFamily, lineHeight, pageMargin, textAlign, viewMode]);

  const turnRef = useRef(null);
  const turningRef = useRef(false);
  const swipeRef = useRef(null);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const calculateProgress = useCallback((epubObj, loc) => {
    if (!loc || !loc.start) return { percentage: 0, label: 'Mulai membaca' };

    let pct = null;
    // 1. If epub locations has been generated
    if (epubObj?.locations && epubObj.locations.total > 0 && loc.start.cfi) {
      try {
        const p = epubObj.locations.percentageFromCfi(loc.start.cfi);
        if (typeof p === 'number' && !isNaN(p) && p >= 0) {
          pct = Math.max(0, Math.min(100, p * 100));
        }
      } catch (err) {}
    }

    // 2. If epub.js relocation already has start.percentage
    if (pct === null && typeof loc.start.percentage === 'number' && !isNaN(loc.start.percentage) && loc.start.percentage > 0) {
      pct = Math.max(0, Math.min(100, loc.start.percentage * 100));
    }

    // 3. Fallback: spine item / chapter index
    if (pct === null) {
      const spineItems = epubObj?.spine?.items || [];
      const spineTotal = spineItems.length;
      const spineIndex = loc.start.index ?? 0;
      if (loc.atEnd) {
        pct = 100;
      } else if (loc.atStart && spineIndex === 0) {
        pct = 0;
      } else if (spineTotal > 0) {
        pct = Math.min(99, Math.max(1, ((spineIndex + 0.5) / spineTotal) * 100));
      } else {
        pct = 0;
      }
    }

    const rounded = Math.round(pct);
    let label = `${rounded}% selesai`;
    // Nomor halaman nyata (per layar) di dalam bab yang sedang dibuka.
    // Selalu naik/turun 1 setiap klik Next/Previous.
    const dp = loc.start.displayed;
    const spineTotal = epubObj?.spine?.items?.length || 0;
    const chapterNo = (loc.start.index ?? 0) + 1;
    if (dp && dp.total > 1) {
      label = `Hal. ${dp.page} dari ${dp.total} (bab ${chapterNo}/${spineTotal}) · ${rounded}% selesai`;
    } else if (spineTotal > 1) {
      label = `Bab ${chapterNo} dari ${spineTotal} · ${rounded}% selesai`;
    }

    return { percentage: pct, label };
  }, []);

  const applyReadingStyles = useCallback((r, theme, font, size, lineH, margin, align) => {
    if (!r) return;
    const cfg = THEME_CONFIG[theme] || THEME_CONFIG.light;
    const fontObj = FONT_FAMILIES.find(f => f.id === font);
    const fontCss = fontObj ? fontObj.family : 'Georgia, serif';

    r.themes.default({
      '::selection': {
        'background': 'rgba(13, 148, 136, 0.3) !important'
      },
      '.epubjs-hl, svg g.epubjs-hl': {
        'cursor': 'pointer !important'
      },
      '.epubjs-hl rect, g.epubjs-hl rect': {
        'cursor': 'pointer !important',
        'shape-rendering': 'auto !important'
      },
      '.rb-hl-yellow rect, g.rb-hl-yellow rect, g[data-color="yellow"] rect': { 'fill': '#fde047 !important', 'fill-opacity': '0.55 !important' },
      '.rb-hl-green rect, g.rb-hl-green rect, g[data-color="green"] rect': { 'fill': '#86efac !important', 'fill-opacity': '0.55 !important' },
      '.rb-hl-blue rect, g.rb-hl-blue rect, g[data-color="blue"] rect': { 'fill': '#93c5fd !important', 'fill-opacity': '0.55 !important' },
      '.rb-hl-pink rect, g.rb-hl-pink rect, g[data-color="pink"] rect': { 'fill': '#f472b6 !important', 'fill-opacity': '0.55 !important' },
      '.rb-hl-orange rect, g.rb-hl-orange rect, g[data-color="orange"] rect': { 'fill': '#fdba74 !important', 'fill-opacity': '0.55 !important' },
      '.rb-hl-purple rect, g.rb-hl-purple rect, g[data-color="purple"] rect': { 'fill': '#d8b4fe !important', 'fill-opacity': '0.55 !important' },
      'body': {
        'background': `${cfg.paperBg} !important`,
        'background-color': `${cfg.paperBg} !important`,
        'color': `${cfg.textColor} !important`,
        'font-family': `${fontCss} !important`,
        'font-size': `${size}px !important`,
        'line-height': `${lineH} !important`,
        'padding': `0 ${margin}px !important`,
        'margin': '0 auto !important',
        'text-align': `${align} !important`,
        'text-justify': 'inter-word !important',
        'hyphens': 'auto !important',
        '-webkit-hyphens': 'auto !important',
        '-webkit-font-smoothing': 'antialiased'
      },
      'p, div, span, li': {
        'color': `${cfg.textColor} !important`,
        'font-family': `${fontCss} !important`,
        'font-size': `${size}px !important`,
        'line-height': `${lineH} !important`,
        'text-align': `${align} !important`,
        'text-justify': 'inter-word !important',
        'hyphens': 'auto !important',
        '-webkit-hyphens': 'auto !important',
        'margin-bottom': '1em !important'
      },
      'body *:not(#rb-font):not(pre):not(code):not(kbd):not(samp)': {
        'font-family': `${fontCss} !important`
      },
      'h1, h2, h3, h4, h5, h6': {
        'color': `${cfg.textColor} !important`,
        'font-family': `${fontCss} !important`,
        'text-align': align === 'justify' ? 'left' : align
      },
      'a': {
        'color': `${cfg.linkColor} !important`
      },
      'html, body': {
        'touch-action': 'pan-y'
      },
      'img': {
        'max-width': '100% !important',
        'height': 'auto !important'
      }
    });

    r.themes.fontSize(`${size}px`);
  }, []);

  const onHighlightClicked = useCallback((hlId, cfiRange, event) => {
    const found = highlightsRef.current.find(h => h.id === hlId || h.cfi_range === cfiRange);
    if (!found) return;
    let x = window.innerWidth / 2;
    let y = 160;
    if (event?.target?.getBoundingClientRect) {
      const iframe = viewerRef.current?.querySelector('iframe');
      const iframeBox = iframe ? iframe.getBoundingClientRect() : { top: 0, left: 0 };
      const rect = event.target.getBoundingClientRect();
      x = iframeBox.left + rect.left + rect.width / 2;
      y = iframeBox.top + rect.top;
    }
    setActiveHighlight({ ...found, x, y });
  }, []);

  const syncSvgRectAttributes = useCallback((r) => {
    try {
      r?.views()?.forEach(v => {
        v?.pane?.render?.();
        const svgEl = v?.pane?.element || viewerRef.current?.querySelector('svg');
        if (svgEl) {
          svgEl.style.zIndex = '15';
          svgEl.querySelectorAll('g').forEach(g => {
            const colorId = g.dataset?.color || (g.className?.baseVal || '').match(/rb-hl-([a-z]+)/)?.[1];
            const hex = HIGHLIGHT_COLORS[colorId]?.hex || g.getAttribute('fill') || '#fde047';
            g.querySelectorAll('rect').forEach(rect => {
              rect.setAttribute('fill', hex);
              rect.setAttribute('fill-opacity', '0.55');
              rect.style.fill = hex;
              rect.style.fillOpacity = '0.55';
            });
          });
        }
      });
    } catch {}
  }, []);

  const registerHighlights = useCallback((r, hls, theme) => {
    if (!r?.annotations) return;
    hls.forEach(hl => {
      try {
        r.annotations.highlight(
          hl.cfi_range,
          { id: hl.id, color: hl.color },
          (e) => {
            if (e?.stopPropagation) e.stopPropagation();
            onHighlightClicked(hl.id, hl.cfi_range, e);
          },
          `rb-hl-${hl.color}`,
          getHighlightStyle(hl.color, theme)
        );
      } catch (e) {
        console.warn('Gagal memuat anotasi:', e);
      }
    });

    setTimeout(() => {
      syncSvgRectAttributes(r);
    }, 50);
  }, [onHighlightClicked, syncSvgRectAttributes]);

  const attachFonts = useCallback((r) => {
    if (!r) return;
    r.hooks.content.register((contents) =>
      contents.addStylesheet(
        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap'
      )
    );
  }, []);

  const attachSwipe = useCallback((r) => {
    if (!r) return;
    r.on('touchstart', (e) => {
      if (viewModeRef.current === 'scroll' || turningRef.current || (e.touches && e.touches.length > 1)) {
        swipeRef.current = null;
        return;
      }
      const t = e.touches?.[0];
      if (!t) { swipeRef.current = null; return; }
      swipeRef.current = { x: t.screenX, y: t.screenY, t0: Date.now(), dx: 0, active: false, dead: false };
    });
    r.on('touchmove', (e, contents) => {
      const s = swipeRef.current;
      if (!s || s.dead) return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.screenX - s.x;
      const dy = t.screenY - s.y;
      if (!s.active) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { s.dead = true; return; }
        if (Math.abs(dx) < 10) return;
        const sel = contents?.window?.getSelection?.();
        if (sel && sel.toString().trim()) { s.dead = true; return; }
        s.active = true;
        setSelectionPopover(null);
      }
      s.dx = dx;
      const loc = r.currentLocation?.();
      const blocked = (dx < 0 && loc?.atEnd) || (dx > 0 && loc?.atStart);
      paperTransform(viewerRef.current, blocked ? dx * 0.25 : dx, false);
    });
    r.on('touchend', () => {
      const s = swipeRef.current;
      swipeRef.current = null;
      if (!s || !s.active) return;
      const dt = Math.max(1, Date.now() - s.t0);
      const fast = Math.abs(s.dx) / dt > 0.5 && Math.abs(s.dx) > 30;
      if (Math.abs(s.dx) > 70 || fast) {
        turnRef.current?.(s.dx < 0 ? 'next' : 'prev');
      } else {
        const el = viewerRef.current;
        paperTransform(el, 0, true);
        setTimeout(() => paperReset(el), 240);
      }
    });
    r.on('keyup', (e) => {
      if (e.key === 'ArrowRight') turnRef.current?.('next');
      else if (e.key === 'ArrowLeft') turnRef.current?.('prev');
    });
  }, []);

  const handleSelection = useCallback((cfiRange, contents) => {
    if (!cfiRange || !contents) return;
    const sel = contents.window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text) return;

    const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const iframe = viewerRef.current?.querySelector('iframe');
    const iframeBox = iframe ? iframe.getBoundingClientRect() : { top: 0, left: 0 };

    const posX = iframeBox.left + rect.left + rect.width / 2;
    const posY = iframeBox.top + rect.top;
    const clampedX = Math.max(160, Math.min(window.innerWidth - 160, posX));
    const isNearTop = posY < 130;
    const clampedY = isNearTop ? (iframeBox.top + rect.bottom + 50) : (posY - 12);

    setSelectionPopover({
      cfiRange,
      text,
      x: clampedX,
      y: clampedY,
      placement: isNearTop ? 'bottom' : 'top',
      contents
    });
  }, []);

  useEffect(() => {
    if (renditionRef.current) {
      applyReadingStyles(renditionRef.current, readerTheme, fontFamily, fontSize, lineHeight, pageMargin, textAlign);
    }
  }, [readerTheme, fontFamily, fontSize, lineHeight, pageMargin, textAlign, applyReadingStyles]);

  // Sync Bookmarks & Highlights from Supabase (if table exists)
  useEffect(() => {
    if (!supabase || !userId || !book.id) return;
    supabase.from('book_bookmarks').select('*').eq('book_id', book.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setBookmarks(prev => {
            const map = new Map();
            data.forEach(item => map.set(item.cfi, item));
            prev.forEach(item => { if (!map.has(item.cfi)) map.set(item.cfi, item); });
            const merged = Array.from(map.values());
            saveStoredBookmarks(book.id, merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    supabase.from('book_highlights').select('*').eq('book_id', book.id).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setHighlights(prev => {
            const map = new Map();
            data.forEach(item => map.set(item.cfi_range, item));
            prev.forEach(item => { if (!map.has(item.cfi_range)) map.set(item.cfi_range, item); });
            const merged = Array.from(map.values());
            saveStoredHighlights(book.id, merged);
            if (renditionRef.current) {
              registerHighlights(renditionRef.current, merged, readerTheme);
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [book.id, userId, registerHighlights, readerTheme]);

  // Dismiss selection or active highlight popover on click outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (
        !e.target.closest('.floating-stabilo-toolbar') &&
        !e.target.closest('.active-highlight-popover')
      ) {
        setSelectionPopover(null);
        setActiveHighlight(null);
      }
    };
    window.addEventListener('mousedown', handleDocClick);
    return () => window.removeEventListener('mousedown', handleDocClick);
  }, []);

  const persist = useCallback(async (cfi, percentage) => {
    if (!cfi) return;
    const finalPct = Math.max(0, Math.min(100, Number(percentage || 0)));
    const now = new Date().toISOString();

    // 1. Immediately cache in localStorage
    try {
      localStorage.setItem(`rb_progress_${book.id}`, JSON.stringify({
        book_id: book.id,
        cfi,
        percentage: finalPct,
        updated_at: now
      }));
    } catch {}

    // 2. Immediately notify parent state so BookCard updates instantly
    onProgress?.({
      book_id: book.id,
      cfi,
      percentage: finalPct,
      updated_at: now
    });

    // 3. Upsert to Supabase
    try {
      const uid = userId || (await supabase.auth.getUser())?.data?.user?.id;
      if (!uid) return;
      const row = {
        user_id: uid,
        book_id: book.id,
        cfi,
        percentage: finalPct,
        updated_at: now
      };
      await supabase.from('reading_progress').upsert(row, { onConflict: 'user_id,book_id' });
    } catch (e) {
      console.warn('Gagal sinkronisasi progres ke cloud:', e);
    }
  }, [book.id, userId, onProgress]);

  useEffect(() => {
    let cancelled = false;
    let rendition;
    let epub;
    const start = async () => {
      setBusy(true); setError('');
      try {
        const { data, error: downloadError } = await supabase.storage.from('epub-files').download(book.file_path);
        if (downloadError) throw downloadError;
        if (cancelled) return;
        const buffer = await data.arrayBuffer();
        const ePub = await loadEpub();
        if (cancelled) return;
        epub = ePub(buffer);
        epubRef.current = epub;
        await epub.ready;
        if (cancelled) { epub.destroy(); return; }
        const metadata = epub.package?.metadata || {};
        if (!book.title && metadata.title) setBookTitle(metadata.title);
        setToc(epub.navigation?.toc || []);

        extractCoverFromBook(epub).then(cUrl => {
          if (cUrl && !cancelled) {
            saveCoverToDb(book.id, cUrl);
            onCoverLoaded?.(book.id, cUrl);
          }
        });

        const spread = viewMode === 'spread' ? 'always' : 'none';
        const flow = viewMode === 'scroll' ? 'scrolled-doc' : 'paginated';
        const manager = viewMode === 'scroll' ? 'continuous' : 'default';

        rendition = epub.renderTo(viewerRef.current, { width: '100%', height: '100%', spread, flow, manager, allowScriptedContent: false });
        renditionRef.current = rendition;

        applyReadingStyles(rendition, readerTheme, fontFamily, fontSize, lineHeight, pageMargin, textAlign);

        // Register highlights
        registerHighlights(rendition, highlightsRef.current, readerTheme);
        attachFonts(rendition);
        attachSwipe(rendition);

        rendition.on('selected', (cfiRange, contents) => {
          handleSelection(cfiRange, contents);
        });

        rendition.on('click', () => {
          setSelectionPopover(null);
          setActiveHighlight(null);
        });

        rendition.on('relocated', location => {
          setSelectionPopover(null);
          setActiveHighlight(null);
          if (!location?.start?.cfi) return;
          const cfi = location.start.cfi;
          const { percentage, label } = calculateProgress(epub, location);
          setCurrent({cfi, percentage});
          setLocationLabel(label);
          clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => persist(cfi, percentage), 700);
        });

        // Load cached locations or generate in background
        const locKey = `rb_loc_${book.id}`;
        const cachedLoc = localStorage.getItem(locKey);
        let locationsPromise;
        if (cachedLoc) {
          try {
            epub.locations.load(cachedLoc);
            locationsPromise = Promise.resolve();
          } catch {
            locationsPromise = epub.locations.generate(1000);
          }
        } else {
          locationsPromise = epub.locations.generate(1000);
        }

        locationsPromise
          .then(() => {
            if (cancelled) return;
            try {
              localStorage.setItem(locKey, epub.locations.save());
            } catch {}

            const curr = renditionRef.current?.currentLocation?.();
            if (curr?.start?.cfi) {
              const { percentage, label } = calculateProgress(epub, curr);
              setCurrent({ cfi: curr.start.cfi, percentage });
              setLocationLabel(label);
              persist(curr.start.cfi, percentage);
            }
          })
          .catch(e => console.warn('Gagal menyiapkan lokasi epub:', e));

        const targetCfi = current.cfi || savedProgress?.cfi;
        await rendition.display(targetCfi || undefined);
        if (!cancelled) setBusy(false);
      } catch (e) {
        if (!cancelled) { setError(e.message || 'Buku tidak dapat dibuka.'); setBusy(false); }
      }
    };
    start();
    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
      try { rendition?.destroy(); epub?.destroy(); } catch {}
      renditionRef.current = null; epubRef.current = null;
    };
  }, [book.id, book.file_path]);

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    if (!epubRef.current || !viewerRef.current) return;
    const targetCfi = current.cfi || savedProgress?.cfi;
    try { renditionRef.current?.destroy(); } catch {}

    const spread = mode === 'spread' ? 'always' : 'none';
    const flow = mode === 'scroll' ? 'scrolled-doc' : 'paginated';
    const manager = mode === 'scroll' ? 'continuous' : 'default';

    const rendition = epubRef.current.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread,
      flow,
      manager,
      allowScriptedContent: false
    });
    renditionRef.current = rendition;

    applyReadingStyles(rendition, readerTheme, fontFamily, fontSize, lineHeight, pageMargin, textAlign);
    registerHighlights(rendition, highlightsRef.current, readerTheme);
    attachFonts(rendition);
        attachSwipe(rendition);

    rendition.on('selected', (cfiRange, contents) => {
      handleSelection(cfiRange, contents);
    });

    rendition.on('click', () => {
      setSelectionPopover(null);
      setActiveHighlight(null);
    });

    rendition.on('relocated', location => {
      setSelectionPopover(null);
      setActiveHighlight(null);
      if (!location?.start?.cfi) return;
      const cfi = location.start.cfi;
      const { percentage, label } = calculateProgress(epubRef.current, location);
      setCurrent({cfi, percentage});
      setLocationLabel(label);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(cfi, percentage), 700);
    });

    await rendition.display(targetCfi || undefined);
  };

  const turn = async direction => {
    const r = renditionRef.current;
    if (!r || turningRef.current) return;
    const el = viewerRef.current;
    if (!el || viewModeRef.current === 'scroll') {
      direction === 'next' ? r.next() : r.prev();
      return;
    }
    const loc = r.currentLocation?.();
    if (direction === 'next' ? loc?.atEnd : loc?.atStart) {
      paperTransform(el, 0, true);
      setTimeout(() => paperReset(el), 240);
      return;
    }
    turningRef.current = true;
    const w = el.clientWidth || 600;
    const sign = direction === 'next' ? -1 : 1;
    // 1. halaman lama bergeser keluar seperti kertas
    paperTransform(el, sign * w * 0.5, true, 0);
    await new Promise(res => setTimeout(res, 190));
    // 2. ganti isi halaman saat tersembunyi
    try { await (direction === 'next' ? r.next() : r.prev()); } catch {}
    await new Promise(res => setTimeout(res, 40));
    // 3. halaman baru masuk dari sisi berlawanan
    paperTransform(el, -sign * w * 0.16, false, 0);
    void el.offsetWidth;
    paperTransform(el, 0, true, 1);
    setTimeout(() => { paperReset(el); turningRef.current = false; }, 240);
  };
  turnRef.current = turn;
  const move = direction => turn(direction);
  const goTo = href => { renditionRef.current?.display(href); };

  // Tombol Back Android: tutup panel dulu, baru keluar dari pembaca
  const backHandlerRef = useRef(null);
  backHandlerRef.current = () => {
    if (selectionPopover || activeHighlight) { setSelectionPopover(null); setActiveHighlight(null); return; }
    if (settingsOpen) { setSettingsOpen(false); return; }
    if (navPanelOpen) { setNavPanelOpen(false); return; }
    handleClose();
  };
  useEffect(() => {
    const onBack = () => backHandlerRef.current?.();
    window.addEventListener('rb:reader-back', onBack);
    return () => window.removeEventListener('rb:reader-back', onBack);
  }, []);

  const handleClose = () => {
    clearTimeout(saveTimer.current);
    if (current.cfi) {
      persist(current.cfi, current.percentage);
    }
    onClose();
  };

  const saveNow = () => {
    if (current.cfi) persist(current.cfi, current.percentage);
    notify('Progres membaca disimpan.');
  };

  // Bookmark actions
  const toggleBookmark = () => {
    if (!current?.cfi) {
      notify('Lokasi membaca belum siap.', 'error');
      return;
    }

    const existing = bookmarks.find(b => b.cfi === current.cfi || (b.label === locationLabel && Math.abs((b.percentage || 0) - (current.percentage || 0)) < 0.5));

    if (existing) {
      const next = bookmarks.filter(b => b.id !== existing.id);
      setBookmarks(next);
      saveStoredBookmarks(book.id, next);
      if (supabase && userId) {
        supabase.from('book_bookmarks').delete().match({ user_id: userId, book_id: book.id, cfi: existing.cfi })
          .then(() => {}).catch(() => {});
      }
      notify('Bookmark dihapus');
    } else {
      const newBm = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('bm_' + Date.now()),
        book_id: book.id,
        cfi: current.cfi,
        percentage: current.percentage,
        label: locationLabel || `${Math.round(current.percentage)}% selesai`,
        created_at: new Date().toISOString()
      };
      const next = [newBm, ...bookmarks];
      setBookmarks(next);
      saveStoredBookmarks(book.id, next);
      if (supabase && userId) {
        supabase.from('book_bookmarks').insert({
          id: newBm.id,
          user_id: userId,
          book_id: book.id,
          cfi: newBm.cfi,
          percentage: newBm.percentage,
          label: newBm.label
        }).then(() => {}).catch(() => {});
      }
      notify('Halaman ditandai sebagai bookmark');
    }
  };

  const handleDeleteBookmark = (bm, e) => {
    if (e?.stopPropagation) e.stopPropagation();
    const next = bookmarks.filter(b => b.id !== bm.id && b.cfi !== bm.cfi);
    setBookmarks(next);
    saveStoredBookmarks(book.id, next);
    if (supabase && userId) {
      supabase.from('book_bookmarks').delete().match({ user_id: userId, book_id: book.id, cfi: bm.cfi })
        .then(() => {}).catch(() => {});
    }
    notify('Bookmark dihapus');
  };

  // Stabilo (Highlight) actions
  const handleCreateHighlight = (cfiRange, text, colorId) => {
    const newHighlight = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('hl_' + Date.now()),
      book_id: book.id,
      cfi_range: cfiRange,
      text,
      color: colorId,
      label: locationLabel,
      created_at: new Date().toISOString()
    };

    try {
      renditionRef.current?.annotations?.highlight(
        cfiRange,
        { id: newHighlight.id, color: colorId },
        (e) => {
          if (e?.stopPropagation) e.stopPropagation();
          onHighlightClicked(newHighlight.id, cfiRange, e);
        },
        `rb-hl-${colorId}`,
        getHighlightStyle(colorId, readerTheme)
      );
    } catch (err) {
      console.warn('Gagal menambah highlight:', err);
    }

    try {
      selectionPopover?.contents?.window?.getSelection()?.removeAllRanges();
    } catch {}

    setHighlights(prev => {
      const next = [newHighlight, ...prev];
      saveStoredHighlights(book.id, next);
      return next;
    });

    if (supabase && userId) {
      supabase.from('book_highlights').insert({
        id: newHighlight.id,
        user_id: userId,
        book_id: book.id,
        cfi_range: cfiRange,
        text,
        color: colorId,
        label: locationLabel
      }).then(() => {}).catch(() => {});
    }

    setSelectionPopover(null);
    notify(`Teks berhasil distabilo (${HIGHLIGHT_COLORS[colorId]?.label || 'Warna'})`);
  };

  const handleDeleteHighlight = (hl) => {
    try {
      renditionRef.current?.annotations?.remove(hl.cfi_range, 'highlight');
    } catch (err) {
      console.warn('Gagal menghapus highlight:', err);
    }

    setHighlights(prev => {
      const next = prev.filter(h => h.id !== hl.id && h.cfi_range !== hl.cfi_range);
      saveStoredHighlights(book.id, next);
      return next;
    });

    if (supabase && userId) {
      supabase.from('book_highlights').delete().match({ user_id: userId, book_id: book.id, cfi_range: hl.cfi_range })
        .then(() => {}).catch(() => {});
    }

    setActiveHighlight(null);
    notify('Stabilo dihapus');
  };

  const handleChangeHighlightColor = (hl, newColor) => {
    try {
      renditionRef.current?.annotations?.remove(hl.cfi_range, 'highlight');
      renditionRef.current?.annotations?.highlight(
        hl.cfi_range,
        { id: hl.id, color: newColor },
        (e) => {
          if (e?.stopPropagation) e.stopPropagation();
          onHighlightClicked(hl.id, hl.cfi_range, e);
        },
        `rb-hl-${newColor}`,
        getHighlightStyle(newColor, readerTheme)
      );
    } catch (err) {
      console.warn('Gagal mengubah warna highlight:', err);
    }

    setHighlights(prev => {
      const next = prev.map(h => (h.id === hl.id || h.cfi_range === hl.cfi_range) ? { ...h, color: newColor } : h);
      saveStoredHighlights(book.id, next);
      return next;
    });

    if (supabase && userId) {
      supabase.from('book_highlights').update({ color: newColor }).match({ user_id: userId, book_id: book.id, cfi_range: hl.cfi_range })
        .then(() => {}).catch(() => {});
    }

    setActiveHighlight(prev => prev ? { ...prev, color: newColor } : null);
    notify(`Warna stabilo diubah menjadi ${HIGHLIGHT_COLORS[newColor]?.label || newColor}`);
  };

  const handleJumpToCfi = (cfi) => {
    if (!renditionRef.current || !cfi) return;
    renditionRef.current.display(cfi);
    if (window.innerWidth < 768) {
      setNavPanelOpen(false);
    }
  };

  return <div className="reader-page">
    <header className="reader-topbar">
      <button className="reader-back" onClick={handleClose}><ArrowLeft size={18}/><span>Kembali ke rak</span></button>
      <div className="reader-book-heading"><span className="reader-label">SEDANG DIBACA</span><strong title={book.title || bookTitle}>{book.title || bookTitle}</strong></div>
      <div className="reader-actions">
        {/* Toggle Bookmark button */}
        <button
          className={`icon-button ${isCurrentBookmarked ? 'active bookmark-active' : ''}`}
          title={isCurrentBookmarked ? 'Hapus bookmark halaman ini' : 'Tandai halaman ini (Tambah Bookmark)'}
          onClick={toggleBookmark}
        >
          <Bookmark size={18} fill={isCurrentBookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Panel Navigation (TOC, Bookmarks, Highlights) */}
        <button
          className={`icon-button ${navPanelOpen ? 'active' : ''}`}
          title="Daftar Isi, Bookmark & Stabilo"
          onClick={() => { setNavPanelOpen(v => !v); if (!navPanelOpen) setSettingsOpen(false); }}
        >
          <List size={18}/>
          {(bookmarks.length > 0 || highlights.length > 0) && <span className="nav-badge-dot" />}
        </button>

        {/* Reading Settings */}
        <button
          className={`icon-button ${settingsOpen ? 'active' : ''}`}
          title="Pengaturan membaca (Reading Settings)"
          onClick={() => { setSettingsOpen(v => !v); if (!settingsOpen) setNavPanelOpen(false); }}
        >
          <SlidersHorizontal size={18}/>
        </button>

        {/* Download EPUB */}
        <button
          className="icon-button"
          title="Unduh file EPUB"
          onClick={() => downloadEpub({ ...book, title: book.title || bookTitle }, notify)}
        >
          <Download size={17}/>
        </button>

        {/* Save Progress */}
        <button className="icon-button" title="Simpan progres sekarang" onClick={saveNow}>
          <RefreshCw size={16}/>
        </button>
      </div>
    </header>

    <div className="reader-layout">
      {navPanelOpen && (
        <aside className="nav-panel">
          <div className="nav-tabs">
            <button
              className={`nav-tab-btn ${navActiveTab === 'toc' ? 'active' : ''}`}
              onClick={() => setNavActiveTab('toc')}
            >
              <List size={13}/>
              <span>Daftar Isi</span>
            </button>
            <button
              className={`nav-tab-btn ${navActiveTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setNavActiveTab('bookmarks')}
            >
              <Bookmark size={13}/>
              <span>Bookmark</span>
              {bookmarks.length > 0 && <span className="tab-counter">{bookmarks.length}</span>}
            </button>
            <button
              className={`nav-tab-btn ${navActiveTab === 'highlights' ? 'active' : ''}`}
              onClick={() => setNavActiveTab('highlights')}
            >
              <Highlighter size={13}/>
              <span>Stabilo</span>
              {highlights.length > 0 && <span className="tab-counter">{highlights.length}</span>}
            </button>
            <button className="nav-panel-close" onClick={() => setNavPanelOpen(false)} title="Tutup">
              <X size={15}/>
            </button>
          </div>

          <div className="nav-panel-content">
            {navActiveTab === 'toc' && (
              <div className="toc-tab-body">
                {toc.length ? (
                  <nav>{toc.map((item, i) => <TocItem key={`${item.id || item.href || item.label}-${i}`} item={item} onSelect={goTo}/>)}</nav>
                ) : (
                  <div className="nav-empty-state">
                    <div className="nav-empty-icon"><List size={24}/></div>
                    <h4>Daftar Isi Kosong</h4>
                    <p>Buku ini tidak menyertakan daftar isi (TOC).</p>
                  </div>
                )}
              </div>
            )}

            {navActiveTab === 'bookmarks' && (
              <div className="bookmarks-tab-body">
                <button className="quick-add-bookmark-btn" onClick={toggleBookmark}>
                  <Bookmark size={14} fill={isCurrentBookmarked ? 'currentColor' : 'none'} />
                  <span>{isCurrentBookmarked ? 'Hapus Bookmark Halaman Ini' : '+ Bookmark Halaman Ini'}</span>
                </button>

                {bookmarks.length === 0 ? (
                  <div className="nav-empty-state">
                    <div className="nav-empty-icon"><Bookmark size={24}/></div>
                    <h4>Belum Ada Bookmark</h4>
                    <p>Klik tombol di atas atau ikon pita bookmark di navigasi atas untuk menandai halaman penting.</p>
                  </div>
                ) : (
                  <div className="bookmarks-list">
                    {bookmarks.map(bm => (
                      <div
                        key={bm.id}
                        className="bookmark-card"
                        onClick={() => handleJumpToCfi(bm.cfi)}
                        title="Klik untuk membuka halaman ini"
                      >
                        <div className="bookmark-card-main">
                          <Bookmark size={16} className="bookmark-card-icon" fill="currentColor" />
                          <div className="bookmark-card-info">
                            <span className="bookmark-card-label">{bm.label || `${Math.round(bm.percentage || 0)}% selesai`}</span>
                            {bm.created_at && (
                              <span className="bookmark-card-date">{formatRelativeTime(bm.created_at)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          className="bookmark-card-delete"
                          title="Hapus bookmark"
                          onClick={(e) => handleDeleteBookmark(bm, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {navActiveTab === 'highlights' && (
              <div className="highlights-tab-body">
                {highlights.length === 0 ? (
                  <div className="nav-empty-state">
                    <div className="nav-empty-icon"><Highlighter size={24}/></div>
                    <h4>Belum Ada Stabilo</h4>
                    <p>Blok atau pilih kalimat menarik di dalam buku untuk memunculkan pilihan warna stabilo.</p>
                  </div>
                ) : (
                  <div className="highlights-list">
                    {highlights.map(hl => {
                      const colorMeta = HIGHLIGHT_COLORS[hl.color] || HIGHLIGHT_COLORS.yellow;
                      return (
                        <div
                          key={hl.id}
                          className="highlight-card"
                          style={{ '--hl-color': colorMeta.hex }}
                          onClick={() => handleJumpToCfi(hl.cfi_range)}
                          title="Klik untuk melompat ke kutipan ini"
                        >
                          <div className="highlight-card-header">
                            <span className="highlight-badge" style={{ backgroundColor: colorMeta.hex }}>
                              <Highlighter size={10} />
                              <span>{colorMeta.label}</span>
                            </span>
                            <div className="highlight-meta-right">
                              {hl.created_at && (
                                <span className="highlight-card-date">{formatRelativeTime(hl.created_at)}</span>
                              )}
                              <button
                                className="highlight-action-btn"
                                title="Hapus stabilo ini"
                                onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(hl); }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="highlight-quote">“{hl.text}”</p>
                          {hl.label && (
                            <div className="highlight-card-footer">
                              <span>{hl.label}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      <section className="reader-stage" data-reader-theme={readerTheme} data-view-mode={viewMode}>
        <div className={`reader-paper ${viewMode === 'spread' ? 'spread' : ''}`}>
          {busy && <div className="reader-loading"><LoaderCircle size={25} className="spin"/><span>Membuka buku dari cloud…</span></div>}
          {error && <div className="reader-error"><AlertCircle size={24}/><h3>Buku tidak dapat dibuka</h3><p>{error}</p><button className="secondary-button" onClick={onClose}>Kembali ke koleksi</button></div>}
          <div ref={viewerRef} className={`epub-viewer ${busy || error ? 'hidden' : ''}`}></div>
        </div>
        <footer className="reader-footer">
          <button className="page-nav" onClick={() => move('prev')} disabled={busy || !!error}><ChevronLeft size={20}/><span>Sebelumnya</span></button>
          <div className="reader-progress"><div className="reader-progress-label"><span>{locationLabel}</span><span>{Math.round(current.percentage)}%</span></div><div className="progress-track"><span style={{width: `${current.percentage}%`}}/></div></div>
          <button className="page-nav next" onClick={() => move('next')} disabled={busy || !!error}><span>Berikutnya</span><ChevronRight size={20}/></button>
        </footer>
      </section>

      {/* Floating Stabilo Toolbar */}
      {selectionPopover && (
        <div
          className={`floating-stabilo-toolbar ${selectionPopover.placement === 'bottom' ? 'placement-bottom' : 'placement-top'}`}
          style={{
            position: 'fixed',
            left: `${selectionPopover.x}px`,
            top: `${selectionPopover.y}px`
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="stabilo-toolbar-inner">
            <div className="stabilo-toolbar-title">
              <Highlighter size={12} />
              <span>Stabilo</span>
            </div>
            <div className="stabilo-colors">
              {Object.values(HIGHLIGHT_COLORS).map(color => (
                <button
                  key={color.id}
                  className="stabilo-color-btn"
                  style={{ backgroundColor: color.hex, borderColor: color.border }}
                  title={`Stabilo ${color.label}`}
                  onClick={() => handleCreateHighlight(selectionPopover.cfiRange, selectionPopover.text, color.id)}
                />
              ))}
            </div>
            <div className="stabilo-toolbar-divider" />
            <button
              className="stabilo-dismiss-btn"
              title="Batal"
              onClick={() => {
                try {
                  selectionPopover.contents?.window?.getSelection()?.removeAllRanges();
                } catch {}
                setSelectionPopover(null);
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Active Highlight Popover */}
      {activeHighlight && (
        <div
          className="active-highlight-popover"
          style={{
            position: 'fixed',
            left: `${activeHighlight.x || window.innerWidth / 2}px`,
            top: `${activeHighlight.y || 160}px`
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="active-highlight-card">
            <div className="active-highlight-header">
              <div
                className="active-highlight-badge"
                style={{ backgroundColor: HIGHLIGHT_COLORS[activeHighlight.color]?.hex || '#fde047' }}
              >
                <Highlighter size={12} />
                <span>{HIGHLIGHT_COLORS[activeHighlight.color]?.label || 'Stabilo'}</span>
              </div>
              <button
                className="active-highlight-close"
                onClick={() => setActiveHighlight(null)}
                title="Tutup"
              >
                <X size={14} />
              </button>
            </div>
            <p className="active-highlight-quote">“{activeHighlight.text}”</p>
            <div className="active-highlight-actions">
              <div className="active-highlight-colors">
                {Object.values(HIGHLIGHT_COLORS).map(color => (
                  <button
                    key={color.id}
                    className={`mini-color-btn ${activeHighlight.color === color.id ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={`Ganti warna ke ${color.label}`}
                    onClick={() => handleChangeHighlightColor(activeHighlight, color.id)}
                  />
                ))}
              </div>
              <button
                className="delete-highlight-btn"
                title="Hapus stabilo ini"
                onClick={() => handleDeleteHighlight(activeHighlight)}
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ReadingSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={readerTheme}
        setTheme={setReaderTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        pageMargin={pageMargin}
        setPageMargin={setPageMargin}
        textAlign={textAlign}
        setTextAlign={setTextAlign}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
    </div>
  </div>;
}

function ReadingSettingsDrawer({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
  pageMargin,
  setPageMargin,
  textAlign,
  setTextAlign,
  viewMode,
  onViewModeChange
}) {
  if (!isOpen) return null;

  return (
    <aside className="settings-drawer">
      <div className="settings-header">
        <div className="settings-title">
          <SlidersHorizontal size={17} className="settings-icon-teal" />
          <span>Reading Settings</span>
        </div>
        <button className="settings-close" onClick={onClose} title="Tutup pengaturan">
          <X size={18} />
        </button>
      </div>

      <div className="settings-body">
        {/* Theme Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">Theme</span>
          </div>
          <div className="theme-grid">
            {THEME_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  className={`theme-card ${opt.id} ${isActive ? 'active' : ''}`}
                  onClick={() => setTheme(opt.id)}
                >
                  <Icon size={18} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Font Size Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">Font Size</span>
            <span className="settings-value">{fontSize}px</span>
          </div>
          <div className="slider-control-row">
            <button
              className="stepper-btn"
              onClick={() => setFontSize(v => Math.max(12, v - 1))}
              title="Perkecil"
            >
              <Minus size={14} />
            </button>
            <input
              type="range"
              className="settings-slider"
              min={12}
              max={36}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
            />
            <button
              className="stepper-btn"
              onClick={() => setFontSize(v => Math.min(36, v + 1))}
              title="Perbesar"
            >
              <Plus size={14} />
            </button>
          </div>
        </section>

        {/* Font Family Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">
              <Type size={14} /> Font Family
            </span>
          </div>
          <div className="font-grid">
            {FONT_FAMILIES.map(f => {
              const isActive = fontFamily === f.id;
              return (
                <button
                  key={f.id}
                  className={`font-pill ${isActive ? 'active' : ''}`}
                  style={{ fontFamily: f.family }}
                  onClick={() => setFontFamily(f.id)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Text Alignment Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">
              <AlignJustify size={14} /> Perataan Teks
            </span>
            <span className="settings-value">
              {textAlign === 'justify' ? 'Rata Kanan-Kiri' : textAlign === 'left' ? 'Rata Kiri' : textAlign === 'center' ? 'Rata Tengah' : 'Rata Kanan'}
            </span>
          </div>
          <div className="align-buttons-grid">
            <button
              className={`align-btn ${textAlign === 'left' ? 'active' : ''}`}
              onClick={() => setTextAlign('left')}
              title="Rata Kiri"
            >
              <AlignLeft size={16} />
            </button>
            <button
              className={`align-btn ${textAlign === 'center' ? 'active' : ''}`}
              onClick={() => setTextAlign('center')}
              title="Rata Tengah"
            >
              <AlignCenter size={16} />
            </button>
            <button
              className={`align-btn ${textAlign === 'right' ? 'active' : ''}`}
              onClick={() => setTextAlign('right')}
              title="Rata Kanan"
            >
              <AlignRight size={16} />
            </button>
            <button
              className={`align-btn ${textAlign === 'justify' ? 'active' : ''}`}
              onClick={() => setTextAlign('justify')}
              title="Rata Kanan-Kiri (Justify)"
            >
              <AlignJustify size={16} />
            </button>
          </div>
        </section>

        {/* Line Height Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">
              <AlignJustify size={14} /> Line Height
            </span>
            <span className="settings-value">{lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            className="settings-slider"
            min={1.2}
            max={2.6}
            step={0.1}
            value={lineHeight}
            onChange={e => setLineHeight(Number(e.target.value))}
          />
        </section>

        {/* Page Margin Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">Page Margin</span>
            <span className="settings-value">{pageMargin}px</span>
          </div>
          <input
            type="range"
            className="settings-slider"
            min={10}
            max={100}
            step={5}
            value={pageMargin}
            onChange={e => setPageMargin(Number(e.target.value))}
          />
        </section>

        {/* View Mode Section */}
        <section className="settings-section">
          <div className="settings-label">
            <span className="settings-label-title">View Mode</span>
          </div>
          <div className="view-mode-stack">
            <button
              className={`view-mode-button ${viewMode === 'paginated' ? 'active' : ''}`}
              onClick={() => onViewModeChange('paginated')}
            >
              <BookOpen size={16} />
              <span>Paginated</span>
            </button>
            <button
              className={`view-mode-button ${viewMode === 'scroll' ? 'active' : ''}`}
              onClick={() => onViewModeChange('scroll')}
            >
              <Rows3 size={16} />
              <span>Continuous Scroll</span>
            </button>
            <button
              className={`view-mode-button ${viewMode === 'spread' ? 'active' : ''}`}
              onClick={() => onViewModeChange('spread')}
            >
              <Columns2 size={16} />
              <span>Two-Page Spread</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}

function TocItem({item, onSelect, depth=0}) {
  return <div>
    <button className="toc-item" style={{paddingLeft: `${14 + depth * 14}px`}} onClick={() => onSelect(item.href)}>{item.label || 'Bagian tanpa judul'}</button>
    {item.subitems?.map((sub, i) => <TocItem key={`${sub.href}-${i}`} item={sub} onSelect={onSelect} depth={depth+1}/>)}
  </div>;
}

function ResetPasswordScreen({ theme, setTheme, onDone }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMsg('');
    if (pw.length < 8) { setMsg('Kata sandi minimal 8 karakter.'); return; }
    if (pw !== pw2) { setMsg('Konfirmasi kata sandi tidak sama.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setMsg(error.message || 'Gagal mengubah kata sandi.'); return; }
    onDone();
  };

  return <main className="auth-page">
    <button className="auth-theme icon-button" title="Ganti tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
    <div className="auth-card">
      <div className="brand auth-brand"><div className="brand-mark"><BookOpen size={22}/></div><div><div className="brand-name">ruang bacaan</div><div className="brand-caption">PERPUSTAKAAN PRIBADI</div></div></div>
      <div className="eyebrow muted">ATUR ULANG KATA SANDI</div>
      <h1>Buat kata sandi baru.</h1>
      <p className="auth-subtitle">Masukkan kata sandi baru untuk akun Anda.</p>
      <form onSubmit={submit} className="auth-form">
        <label>Kata sandi baru
          <span className="password-field">
            <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimal 8 karakter" required minLength={8} maxLength={72} autoComplete="new-password" autoFocus/>
            <button type="button" className="password-toggle" onClick={() => setShow(v => !v)} title={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
              {show ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </span>
        </label>
        <label>Ulangi kata sandi baru
          <span className="password-field">
            <input type={show ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Ketik ulang kata sandi" required minLength={8} maxLength={72} autoComplete="new-password"/>
          </span>
        </label>
        {msg && <div className="auth-message"><AlertCircle size={16}/>{msg}</div>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin"/> : null}{busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}</button>
      </form>
    </div>
  </main>;
}

// Dua buku dianggap sama hanya jika judul, penulis, dan ukuran file sama (versi/edisi berbeda tetap terpisah)
const bookKey = (title, author, size) => `${String(title || '').trim().toLowerCase()}|${String(author || '').trim().toLowerCase()}|${Number(size || 0)}`;
const QRIS_NAME = 'HARISDEVLAB - SOFTWARE';

// Isi QR dari qris.png (QRIS statis). Nominal disisipkan per pesanan menjadi QRIS dinamis.
const QRIS_STATIC = '00020101021126610016ID.CO.SHOPEE.WWW01189360091800227881790208227881790303UMI51440014ID.CO.QRIS.WWW0215ID10264895026290303UMI5204581753033605802ID5912Haris DevLab6010PURWAKARTA61054118162070703A0163048C59';
const qrisCrc = str => {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};
const qrisWithAmount = (payload, amount) => {
  const tags = [];
  for (let i = 0; i < payload.length;) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    tags.push([id, payload.slice(i + 4, i + 4 + len)]);
    i += 4 + len;
  }
  const kept = tags.filter(([id]) => id !== '54' && id !== '63').map(([id, v]) => (id === '01' ? ['01', '12'] : [id, v]));
  kept.push(['54', String(Math.round(amount))]);
  kept.sort((a, b) => Number(a[0]) - Number(b[0]));
  const body = kept.map(([id, v]) => `${id}${String(v.length).padStart(2, '0')}${v}`).join('') + '6304';
  return body + qrisCrc(body);
};

const formatRupiah = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

// Aturan harga: 1 ebook = Rp5.000 | Paket 3 ebook = Rp10.000 | Paket 10 ebook = Rp30.000
const PACKAGES = [
  { qty: 1, price: 5000, label: '1 ebook' },
  { qty: 3, price: 10000, label: 'Paket 3 ebook' },
  { qty: 10, price: 30000, label: 'Paket 10 ebook' }
];

// Hitung harga termurah untuk n buku dengan menggabungkan paket
const calcOrder = n => {
  if (!n || n <= 0) return { total: 0, parts: [], hint: '' };
  const maxQ = Math.max(...PACKAGES.map(p => p.qty));
  const limit = n + maxQ;
  const cost = Array(limit + 1).fill(Infinity);
  const pick = Array(limit + 1).fill(-1);
  cost[0] = 0;
  for (let j = 1; j <= limit; j++) {
    PACKAGES.forEach((p, idx) => {
      if (j >= p.qty && cost[j - p.qty] + p.price < cost[j]) { cost[j] = cost[j - p.qty] + p.price; pick[j] = idx; }
    });
  }
  let best = n;
  for (let j = n; j <= limit; j++) if (cost[j] < cost[best]) best = j;
  const counts = {};
  for (let k = best; k > 0; k -= PACKAGES[pick[k]].qty) counts[pick[k]] = (counts[pick[k]] || 0) + 1;
  const parts = Object.entries(counts)
    .map(([idx, count]) => ({ ...PACKAGES[idx], count }))
    .sort((a, b) => b.qty - a.qty);
  const total = cost[best];
  let hint = '';
  for (let j = n + 1; j <= limit; j++) {
    if (cost[j] <= total) { hint = `Tambah ${j - n} buku lagi, harganya tetap ${formatRupiah(total)}`; break; }
  }
  return { total, parts, hint };
};

// Perkecil sampul menjadi thumbnail JPEG kecil untuk katalog
const makeThumb = (src, width = 200) => new Promise(resolve => {
  if (!src) { resolve(null); return; }
  const img = new Image();
  img.onload = () => {
    try {
      const w = Math.min(width, img.naturalWidth || width);
      const h = Math.round(w * ((img.naturalHeight || w * 1.5) / (img.naturalWidth || w)));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    } catch { resolve(null); }
  };
  img.onerror = () => resolve(null);
  img.src = src;
});

const ORDER_STATUS = { pending: 'Menunggu', approved: 'Diterima', rejected: 'Ditolak', awaiting_payment: 'Belum dibayar', expired: 'Kedaluwarsa' };

// Satu baris sakelar pengaturan (dibaca/diubah lewat RPC Supabase)
function SettingToggle({ notify, label, getFn, setFn, sqlFile, onText, offText, confirmOff, doneOn, doneOff }) {
  const [value, setValue] = useState(null); // null = memuat
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.rpc(getFn).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setMissing(true); return; }
      setValue(data !== false);
    });
    return () => { alive = false; };
  }, [getFn]);
  const toggle = async () => {
    if (busy || value === null) return;
    const next = !value;
    if (!next && confirmOff && !window.confirm(confirmOff)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc(setFn, { p_open: next });
    setBusy(false);
    if (error) { notify(error.message || 'Gagal menyimpan pengaturan.', 'error'); return; }
    setValue(data !== false);
    notify(data !== false ? doneOn : doneOff);
  };
  return <div className="setting-card">
    <div className="setting-text">
      <b>{label}</b>
      <span>{missing ? <>Belum siap. Jalankan SQL <b>supabase/{sqlFile}</b> di Supabase.</> : value === null ? 'Memuat…' : value ? onText : offText}</span>
    </div>
    <button type="button" role="switch" aria-checked={!!value} aria-label={label}
      className={`setting-switch${value ? ' on' : ''}`} onClick={toggle} disabled={busy || value === null}>
      <span/>
    </button>
  </div>;
}

function AdminSettings({ notify, onPurchaseChange }) {
  return <section className="shelf-section settings-section">
    <div className="section-heading">
      <div><div className="eyebrow muted">KHUSUS ADMIN</div><h2>Pengaturan</h2></div>
    </div>
    <div className="setting-list">
      <SettingToggle notify={notify} label="Pendaftaran akun baru"
        getFn="get_signup_open" setFn="set_signup_open" sqlFile="signup_toggle.sql"
        onText="Dibuka. Pengunjung bisa membuat akun baru dari halaman masuk."
        offText={'Ditutup. Tombol "Daftar" disembunyikan dan server menolak akun baru. Pengguna lama tetap bisa masuk.'}
        confirmOff="Tutup pendaftaran akun baru? Pengguna lama tetap bisa masuk seperti biasa."
        doneOn="Pendaftaran akun baru dibuka." doneOff="Pendaftaran akun baru ditutup."/>
      <SettingToggle notify={n => { notify(n); onPurchaseChange?.(); }} label="Pembelian ebook di katalog"
        getFn="get_purchase_open" setFn="set_purchase_open" sqlFile="purchase_toggle.sql"
        onText="Dibuka. Pembeli bisa memilih buku dan membayar lewat QRIS."
        offText="Ditutup. Pilihan buku dan tombol pesan disembunyikan, server menolak pesanan baru. Pesanan yang sudah dibuat tetap bisa dibayar."
        confirmOff="Tutup pembelian ebook di katalog? Pesanan yang sudah dibuat tetap bisa dibayar."
        doneOn="Pembelian ebook dibuka." doneOff="Pembelian ebook ditutup."/>
    </div>
  </section>;
}

function OrdersSection({ orders, onApprove, onReject }) {
  const [showHistory, setShowHistory] = useState(false);
  const [proofView, setProofView] = useState(null); // { code, url, loading, error }
  const viewProof = async o => {
    setProofView({ code: o.code, loading: true });
    const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(proofPath(o.code), 300);
    if (error || !data?.signedUrl) setProofView({ code: o.code, error: 'Bukti bayar tidak ditemukan. Pesanan ini mungkin dibuat sebelum fitur unggah bukti ada, atau buyer belum mengunggah. Silakan hubungi pembeli untuk meminta bukti.' });
    else setProofView({ code: o.code, url: data.signedUrl });
  };
  const pending = orders.filter(o => o.status === 'pending');
  const awaiting = orders.filter(o => o.status === 'awaiting_payment');
  const history = orders.filter(o => o.status !== 'pending' && o.status !== 'awaiting_payment');
  const fmt = iso => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const renderOrder = o => (
    <article className="order-card" key={o.id}>
      <div className="order-card-head">
        <b>{o.code}</b>
        <span className={`status-pill ${o.status}`}>{ORDER_STATUS[o.status] || o.status}</span>
      </div>
      <div className="order-card-meta">{o.user_email} · {fmt(o.created_at)}</div>
      {o.paid_via === 'qris_auto' && o.status === 'pending' && (
        <div className="order-auto-note"><AlertCircle size={14}/> Pembayaran terdeteksi otomatis, tetapi persetujuan otomatis gagal. Silakan klik Terima.</div>
      )}
      {o.paid_via === 'qris_auto' && o.status === 'approved' && (
        <div className="order-auto-note ok"><CheckCircle2 size={14}/> Lunas, terdeteksi otomatis</div>
      )}
      <ul className="order-books">
        {(o.order_items || []).map((it, i) => <li key={`${it.book_id || it.title}-${i}`}>{it.title}</li>)}
      </ul>
      <div className="order-card-foot">
        <span className="order-total">{formatRupiah(o.pay_amount || o.total)}{o.pay_amount ? <small className="order-total-base"> (harga {formatRupiah(o.total)})</small> : null}</span>
        {o.status === 'pending' && (
          <div className="order-actions">
            <button className="order-proof" onClick={() => viewProof(o)}><Eye size={15}/> Lihat bukti</button>
            <button className="order-reject" onClick={() => onReject(o)}>Tolak</button>
            <button className="primary-button" onClick={() => onApprove(o)}><Check size={16}/> Terima</button>
          </div>
        )}
      </div>
    </article>
  );

  return <section className="shelf-section orders-section">
    <div className="section-heading">
      <div><div className="eyebrow muted">PESANAN MASUK</div><h2>Pesanan <span className="count">{pending.length}</span></h2></div>
    </div>
    <p className="catalog-note">Pembayaran QRIS dengan nominal yang tepat diterima <b>otomatis</b>. Pesanan di bawah ini perlu dicek manual: lihat bukti bayar, lalu klik <b>Terima</b>. Foto bukti dihapus otomatis setelah pesanan diterima atau ditolak.</p>
    {awaiting.length > 0 && (
      <p className="order-awaiting-note"><Clock size={14}/> {awaiting.length} pesanan sedang menunggu pembeli membayar ({awaiting.map(o => formatRupiah(o.pay_amount)).join(', ')}).</p>
    )}

    {proofView && (
      <div className="modal-backdrop" onClick={() => setProofView(null)}>
        <div className="modal-card proof-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title"><Eye size={18} className="modal-icon-teal"/><span>Bukti bayar {proofView.code}</span></div>
            <button className="modal-close-btn" onClick={() => setProofView(null)} title="Tutup"><X size={18}/></button>
          </div>
          {proofView.loading && <div className="proof-loading"><LoaderCircle size={22} className="spin"/></div>}
          {proofView.error && <div className="info-banner">{proofView.error}</div>}
          {proofView.url && <img className="proof-full" src={proofView.url} alt="Bukti bayar"/>}
        </div>
      </div>
    )}

    {pending.length === 0 ? (
      <div className="catalog-empty">
        <ClipboardList size={34}/>
        <h3>Tidak ada pesanan yang menunggu</h3>
        <p>Pesanan baru dari pembeli akan muncul di sini.</p>
      </div>
    ) : (
      <div className="order-list">{pending.map(renderOrder)}</div>
    )}

    {history.length > 0 && (
      <>
        <button className="order-history-toggle" onClick={() => setShowHistory(v => !v)}>
          {showHistory ? 'Sembunyikan riwayat' : `Tampilkan riwayat (${history.length})`}
        </button>
        {showHistory && <div className="order-list">{history.map(renderOrder)}</div>}
      </>
    )}
  </section>;
}

const COVER_PALETTES = [
  { bg: '#e9e2d3', fg: '#3b372f', line: '#b9a47a' },
  { bg: '#dde5dd', fg: '#2c463d', line: '#8fae9e' },
  { bg: '#eadcd4', fg: '#58392f', line: '#c49a85' },
  { bg: '#dce2ea', fg: '#31425a', line: '#8fa3bf' },
  { bg: '#e8e4c8', fg: '#4a4a2a', line: '#b5b07a' },
  { bg: '#e3d9e6', fg: '#4a3550', line: '#a995b0' }
];
const hashStr = str => { let h = 0; for (const c of String(str || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

function CatalogSection({ items, loading, error, ownedIds, ownedKeys, selected, onToggle, isAdmin, orders = [], onCheckout, onResumePay, onClear, purchaseOpen = true }) {
  const canBuy = !isAdmin && purchaseOpen;
  const [q, setQ] = useState('');
  const cmpText = (a, b) => String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base', numeric: true });
  const list = items
    .filter(i => `${i.title} ${i.author || ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => cmpText(a.author, b.author) || cmpText(a.title, b.title));
  const isOwned = i => ownedIds.has(i.book_id) || ownedKeys.has(bookKey(i.title, i.author, i.file_size));
  const chosen = items.filter(i => selected.includes(i.id) && !isOwned(i));
  const order = calcOrder(chosen.length);
  const total = order.total;

  const maintenance = !isAdmin && !purchaseOpen;

  return <section className={`shelf-section catalog-section${canBuy && chosen.length ? ' has-bar' : ''}${maintenance ? ' maintenance' : ''}`}>
    {maintenance && (
      <div className="maintenance-overlay" role="status">
        <div className="maintenance-card">
          <span className="maintenance-icon"><Wrench size={26}/></span>
          <b>Maintenance</b>
          <p>Sedang perbaikan sistem. Katalog akan kembali dibuka secepatnya.</p>
        </div>
      </div>
    )}
    <div className="maintenance-body" aria-hidden={maintenance || undefined} inert={maintenance ? '' : undefined}>
    <div className="section-heading">
      <div><div className="eyebrow muted">KATALOG BUKU</div><h2>Katalog <span className="count">{items.length}</span></h2></div>
      <div className="shelf-tools">
        <label className="searchbox"><Search size={17}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari judul atau penulis…"/></label>
      </div>
    </div>

    {canBuy && (
      <div className="price-strip" aria-label="Daftar harga">
        {PACKAGES.map(pk => (
          <div className="price-item" key={pk.qty}><span>{pk.label}</span><b>{formatRupiah(pk.price)}</b></div>
        ))}
      </div>
    )}

    {!isAdmin && orders.length > 0 && (
      <div className="my-orders">
        <div className="my-orders-title">Pesanan saya</div>
        {orders.slice(0, 5).map(o => (
          <div className="my-order" key={o.id}>
            <span className="mo-code">{o.code}</span>
            <span className="mo-meta">{(o.order_items || []).length} buku · {formatRupiah(o.pay_amount || o.total)}</span>
            {o.status === 'awaiting_payment' && new Date(o.expires_at).getTime() > Date.now()
              ? <button className="mo-pay" onClick={() => onResumePay?.(o)}><QrCode size={14}/> Bayar</button>
              : <span className={`status-pill ${o.status}`}>{ORDER_STATUS[o.status] || o.status}</span>}
          </div>
        ))}
      </div>
    )}

    {error ? (
      <div className="info-banner">Katalog belum siap: {error}. Jalankan SQL <b>catalog_auto.sql</b> di Supabase.</div>
    ) : loading && !items.length ? (
      <div className="catalog-empty"><LoaderCircle size={22} className="spin"/> Memuat katalog…</div>
    ) : list.length === 0 ? (
      <div className="catalog-empty">
        <ShoppingBag size={34}/>
        <h3>{q ? 'Buku tidak ditemukan' : 'Belum ada buku di katalog'}</h3>
        <p>{q ? 'Coba kata kunci yang berbeda.' : 'Buku yang tersedia akan muncul di sini secara otomatis.'}</p>
      </div>
    ) : (
      <>
        {canBuy && (
          <p className="catalog-note">
            Centang buku yang ingin dipesan. Buku tetap terkunci sampai pembayaran dikonfirmasi admin.
          </p>
        )}
        <div className="catalog-grid">
          {list.map(item => {
            const owned = !isAdmin && isOwned(item);
            const isSel = selected.includes(item.id);
            const pal = COVER_PALETTES[hashStr(item.title) % COVER_PALETTES.length];
            return <article key={item.id} className={`catalog-card${isSel ? ' selected' : ''}${owned ? ' owned' : ''}`}>
              <div className="catalog-cover" onClick={() => canBuy && !owned && onToggle(item.id)}>
                {item.cover_data
                  ? <img src={item.cover_data} alt={item.title} draggable="false"/>
                  : (
                    <div className="cover-fallback" style={{ background: pal.bg, color: pal.fg }}>
                      <div className="cover-frame" style={{ borderColor: pal.line }}>
                        <span className="cover-name">{item.title}</span>
                        <i style={{ background: pal.line }}/>
                        <small>{item.author}</small>
                      </div>
                    </div>
                  )}
                {canBuy && !owned && (
                  <button type="button" role="checkbox" aria-checked={isSel} aria-label={`Pilih ${item.title}`}
                    className={`catalog-check${isSel ? ' on' : ''}`}
                    onClick={e => { e.stopPropagation(); onToggle(item.id); }}>
                    {isSel && <Check size={14}/>}
                  </button>
                )}
              </div>
              <div className="catalog-info">
                <h3 title={item.title}>{item.title}</h3>
                <p className="catalog-author">{item.author}</p>
                {!isAdmin && (
                  <p className={`catalog-state${owned ? ' open' : ''}`}>
                    {owned ? <><Check size={12}/> Dimiliki</> : <><Lock size={12}/> Terkunci</>}
                  </p>
                )}
              </div>
            </article>;
          })}
        </div>
      </>
    )}

    {canBuy && chosen.length > 0 && (
      <div className="order-bar">
        <div className="order-bar-info">
          <strong>{chosen.length} buku dipilih</strong>
          <span>{formatRupiah(total)}</span>
          {order.hint && <small className="order-hint">{order.hint}</small>}
        </div>
        <button className="order-clear" onClick={onClear}>Batal</button>
        <button className="primary-button" onClick={onCheckout}>Pesan &amp; Bayar</button>
      </div>
    )}
    </div>
  </section>;
}

// Nominal dengan 3 digit terakhir ditonjolkan (kode unik)
function UniqueAmount({ amount }) {
  const str = Number(amount || 0).toLocaleString('id-ID');
  return <span className="qr-amount-value">Rp{str.slice(0, -3)}<mark>{str.slice(-3)}</mark></span>;
}

// Teks berjalan di bawah banner: info pembaruan untuk pembeli
const TICKER_ITEMS = [
  [Zap, 'Pembayaran QRIS kini otomatis'],
  [Clock, 'Buku langsung masuk rak dalam hitungan detik setelah bayar'],
  [CheckCircle2, 'Tidak perlu unggah bukti bayar dan menunggu admin'],
  [QrCode, 'Scan pakai e-wallet atau m-banking apa saja'],
  [BookMarked, 'Mulai Rp5.000 per ebook, paket 3 ebook Rp10.000']
];
function NewsTicker({ onOpenCatalog }) {
  const list = (hidden) => (
    <ul className="ticker-list" aria-hidden={hidden || undefined}>
      {TICKER_ITEMS.map(([Icon, text]) => (
        <li key={text}><Icon size={15}/>{text}</li>
      ))}
    </ul>
  );
  return <div className="news-ticker" role="region" aria-label="Info pembaruan">
    <span className="ticker-badge"><Zap size={14}/> BARU</span>
    <div className="ticker-track">
      <div className="ticker-move">{list(false)}{list(true)}</div>
    </div>
    {onOpenCatalog && <button className="ticker-cta" onClick={onOpenCatalog}>Lihat katalog <ChevronRight size={15}/></button>}
  </div>;
}

function CheckoutModal({ items, resumeOrder, email, onClose, onStart, onFetch, onClaim, onPaid, onSubmit, onConfirmed }) {
  const [code] = useState(() => {
    if (resumeOrder?.code) return resumeOrder.code;
    // Kode pesanan sulit ditebak: waktu + 6 karakter acak kriptografis
    const rnd = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
    return `RB-${Date.now().toString(36).toUpperCase()}-${rnd}`;
  });
  const [stage, setStage] = useState(resumeOrder ? 'pay' : 'review'); // review | pay | claimed | paid | rejected | legacy
  const [order, setOrder] = useState(resumeOrder || null);
  const [bookCount] = useState(() => resumeOrder ? (resumeOrder.order_items || []).length : items.length);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [proof, setProof] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofErr, setProofErr] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const sendingRef = useRef(false);
  const calc = calcOrder(items.length);

  useEffect(() => () => { if (proofUrl) URL.revokeObjectURL(proofUrl); }, [proofUrl]);

  // QR dinamis berisi nominal unik
  useEffect(() => {
    if (!order?.pay_amount) return;
    let alive = true;
    import('qrcode').then(({ default: QRCode }) => QRCode.toDataURL(qrisWithAmount(QRIS_STATIC, order.pay_amount), { width: 560, margin: 1, errorCorrectionLevel: 'M' }))
      .then(url => { if (alive) setQrUrl(url); })
      .catch(() => { if (alive) setErr('QRIS gagal dibuat. Muat ulang halaman lalu coba lagi.'); });
    return () => { alive = false; };
  }, [order?.pay_amount]);

  // Hitung mundur
  useEffect(() => {
    if (stage !== 'pay') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [stage]);

  // Cek status pembayaran berkala sampai diterima
  useEffect(() => {
    if (!order?.code || !['pay', 'claimed'].includes(stage)) return;
    let alive = true;
    const check = async () => {
      const fresh = await onFetch(order.code).catch(() => null);
      if (!alive || !fresh) return;
      setOrder(prev => ({ ...prev, ...fresh }));
      if (fresh.status === 'approved') { setStage('paid'); onPaid?.(); }
      else if (fresh.status === 'rejected') setStage('rejected');
      else if (fresh.status === 'pending' && stage === 'pay') setStage('claimed');
    };
    check();
    const t = setInterval(check, 3000);
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [order?.code, stage]);

  const start = async () => {
    if (sendingRef.current || busy || !items.length) return;
    sendingRef.current = true;
    setBusy(true); setErr('');
    let res = { ok: false };
    try { res = await onStart({ code, total: calc.total, ids: items.map(i => i.book_id) }); } catch (e) { res = { ok: false, error: e.message }; }
    setBusy(false);
    if (res.legacy) { setStage('legacy'); return; }
    if (!res.ok) { sendingRef.current = false; setErr(res.error || 'Gagal membuat pesanan.'); return; }
    setOrder(res.order);
    if (res.order.status === 'awaiting_payment' && res.order.pay_amount) setStage('pay');
    else setStage('claimed'); // trigger belum terpasang: pesanan masuk sebagai pesanan biasa
  };

  const pickProof = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setProofErr('');
    if (f.size > 15 * 1024 * 1024) { setProofErr('Ukuran gambar maksimal 15 MB.'); return; }
    if (!f.type.startsWith('image/')) { setProofErr('Pilih file berupa gambar (foto atau tangkapan layar).'); return; }
    setProofBusy(true);
    try { const blob = await compressProof(f); setProof(blob); setProofUrl(URL.createObjectURL(blob)); }
    catch (er) { setProofErr(er.message || 'Gambar tidak dapat diproses.'); }
    setProofBusy(false);
  };

  const sendClaim = async () => {
    if (busy || !proof) return;
    setBusy(true); setErr('');
    const res = await onClaim(order, proof).catch(e => ({ ok: false, error: e.message }));
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    setStage('claimed');
  };

  // Simpan gambar QRIS: di aplikasi Android lewat menu Bagikan (unduhan biasa tidak jalan di WebView)
  const saveQr = async e => {
    if (!IS_NATIVE || !qrUrl) return;
    e.preventDefault();
    try {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import('@capacitor/filesystem'), import('@capacitor/share')
      ]);
      const saved = await Filesystem.writeFile({ path: `QRIS-${order.code}.png`, data: qrUrl.split(',')[1], directory: Directory.Cache });
      await Share.share({ title: `QRIS ${order.code}`, files: [saved.uri], dialogTitle: 'Simpan atau bagikan QRIS' });
    } catch (er) {
      if (!/cancel/i.test(er?.message || '')) setErr('Gambar QRIS gagal disimpan. Coba tangkapan layar.');
    }
  };

  const copyAmount = async () => {
    try { await navigator.clipboard.writeText(String(order.pay_amount)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  if (stage === 'legacy') {
    return <ManualCheckoutModal items={items} email={email} onClose={onClose} onSubmit={onSubmit} onConfirmed={onConfirmed}/>;
  }

  const expiresAt = order?.expires_at ? new Date(order.expires_at).getTime() : 0;
  const left = Math.max(0, expiresAt - now);
  const expired = stage === 'pay' && expiresAt > 0 && left <= 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const titles = { review: 'Pembayaran', pay: 'Bayar dengan QRIS', claimed: 'Menunggu konfirmasi', paid: 'Pembayaran diterima', rejected: 'Pesanan ditolak' };
  const busyLock = busy && stage === 'review';

  return <div className="modal-backdrop" onClick={() => !busyLock && onClose()}>
    <div className="modal-card checkout-card" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">
          {stage === 'paid' ? <CheckCircle2 size={18} className="modal-icon-teal"/> : stage === 'pay' ? <QrCode size={18} className="modal-icon-teal"/> : <ShoppingBag size={18} className="modal-icon-teal"/>}
          <span>{titles[stage]}</span>
        </div>
        <button className="modal-close-btn" onClick={onClose} disabled={busyLock} title="Tutup"><X size={18}/></button>
      </div>

      <div className="checkout-code">Kode pesanan <b>{code}</b></div>

      {stage === 'review' && <>
        <div className="checkout-items">
          {items.map(it => (
            <div className="checkout-row" key={it.id}><span title={it.title}>{it.title}</span></div>
          ))}
          {calc.parts.map(pt => (
            <div className="checkout-row part" key={pt.qty}><span>{pt.count}× {pt.label}</span><b>{formatRupiah(pt.count * pt.price)}</b></div>
          ))}
          <div className="checkout-row total"><span>Total</span><b>{formatRupiah(calc.total)}</b></div>
        </div>
        <div className="qr-explain">
          <ScanLine size={18}/>
          <p>Kamu akan mendapat QRIS dengan <b>nominal unik</b> (total ditambah beberapa rupiah). Bayar sesuai nominal itu dan buku <b>langsung masuk ke rak</b> tanpa perlu menunggu admin.</p>
        </div>
        {err && <div className="proof-error">{err}</div>}
        <button className="primary-button pay-button" onClick={start} disabled={busy || !items.length}>
          {busy ? <LoaderCircle size={18} className="spin"/> : <QrCode size={18}/>}
          {busy ? 'Menyiapkan QRIS…' : 'Lanjut ke pembayaran'}
        </button>
      </>}

      {stage === 'pay' && order && <>
        <div className="qr-amount">
          <span className="qr-amount-label">Bayar tepat</span>
          <UniqueAmount amount={order.pay_amount}/>
          <button className="qr-copy" onClick={copyAmount} title="Salin nominal">{copied ? <Check size={14}/> : <Copy size={14}/>}{copied ? 'Tersalin' : 'Salin'}</button>
        </div>
        <p className="qr-amount-note">
          Sudah termasuk kode unik <b>Rp{order.unique_code}</b> agar pembayaranmu dikenali otomatis. Jangan dibulatkan.
        </p>

        {!expired ? <>
          <div className="qris-box">
            <div className="qris-name"><span>Atas nama</span><b>{QRIS_NAME}</b></div>
            {qrUrl ? <img src={qrUrl} alt={`QRIS ${formatRupiah(order.pay_amount)}`}/> : <div className="qr-loading"><LoaderCircle size={22} className="spin"/></div>}
            <div className="qris-caption">Nominal sudah terisi otomatis saat di-scan</div>
          </div>
          <div className="qr-status">
            <LoaderCircle size={16} className="spin"/>
            <span>Menunggu pembayaran. Halaman ini berubah otomatis setelah pembayaran diterima.</span>
            <span className="qr-timer"><Clock size={13}/> {mm}:{ss}</span>
          </div>
          {qrUrl && <a className="secondary-button qr-save" href={qrUrl} download={`QRIS-${order.code}.png`} onClick={saveQr}><Download size={16}/> {IS_NATIVE ? 'Simpan / bagikan gambar QRIS' : 'Simpan gambar QRIS'}</a>}
          <p className="qr-tip">Bayar dari HP yang sama? Simpan gambar QRIS, lalu pilih <b>scan dari galeri</b> di aplikasi e-wallet atau m-banking.</p>
        </> : (
          <div className="info-banner qr-expired">
            Waktu pembayaran habis. Jika kamu <b>sudah terlanjur membayar</b> dengan nominal di atas, pembayaran tetap dikenali selama beberapa menit. Halaman ini akan berubah otomatis. Jika belum membayar, tutup jendela ini dan buat pesanan baru.
          </div>
        )}

        <button className="order-history-toggle qr-claim-toggle" onClick={() => setShowClaim(v => !v)}>
          {showClaim ? 'Tutup' : 'Sudah bayar tapi belum terdeteksi?'}
        </button>
        {showClaim && (
          <div className="proof-box">
            <label className={`proof-pick${proof ? ' has' : ''}`}>
              <input type="file" accept="image/*" onChange={pickProof} disabled={busy || proofBusy} hidden/>
              {proofBusy ? <><LoaderCircle size={17} className="spin"/> Memproses gambar…</>
                : proof ? <><Check size={17}/> Bukti bayar dipilih. Ketuk untuk mengganti</>
                : <><Upload size={17}/> Unggah bukti bayar</>}
            </label>
            {proofUrl && <img className="proof-preview" src={proofUrl} alt="Pratinjau bukti bayar"/>}
            {proofErr && <div className="proof-error">{proofErr}</div>}
            <button className="primary-button pay-button" onClick={sendClaim} disabled={busy || !proof}>
              {busy ? <LoaderCircle size={18} className="spin"/> : <Check size={18}/>}
              {busy ? 'Mengirim…' : 'Kirim bukti ke admin'}
            </button>
            <div className="proof-note">Admin akan memeriksa bukti secara manual. Foto otomatis dihapus setelah pesanan diproses.</div>
          </div>
        )}
        {err && <div className="proof-error">{err}</div>}
      </>}

      {stage === 'claimed' && (
        <div className="checkout-done">
          <div className="checkout-done-icon wait"><Clock size={26}/></div>
          <h3>Sedang diperiksa admin</h3>
          <p>Pesananmu sudah tercatat dan akan dicek manual. Buku otomatis terbuka di akun <b>{email}</b> setelah dikonfirmasi. Jendela ini boleh ditutup.</p>
          <button className="secondary-button" onClick={onClose}>Tutup</button>
        </div>
      )}

      {stage === 'paid' && (
        <div className="checkout-done">
          <div className="checkout-done-icon"><Check size={28}/></div>
          <h3>Terima kasih!</h3>
          <p>Pembayaran {order?.pay_amount ? formatRupiah(order.pay_amount) : ''} sudah diterima. {bookCount ? `${bookCount} buku` : 'Buku'} sudah masuk ke rak dan siap dibaca.</p>
          <button className="primary-button" onClick={onClose}><LibraryBig size={17}/> Lihat rak buku</button>
        </div>
      )}

      {stage === 'rejected' && (
        <div className="checkout-done">
          <div className="checkout-done-icon bad"><X size={26}/></div>
          <h3>Pesanan ditolak</h3>
          <p>Silakan hubungi admin jika kamu merasa sudah membayar.</p>
          <button className="secondary-button" onClick={onClose}>Tutup</button>
        </div>
      )}
    </div>
  </div>;
}

// Alur lama (QRIS statis + wajib unggah bukti). Dipakai otomatis jika SQL qris_auto.sql belum dijalankan.
function ManualCheckoutModal({ items, email, onClose, onSubmit, onConfirmed }) {
  const [code] = useState(() => {
    // Kode pesanan sulit ditebak: waktu + 6 karakter acak kriptografis
    const rnd = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
    return `RB-${Date.now().toString(36).toUpperCase()}-${rnd}`;
  });
  const [busy, setBusy] = useState(false);
  const [qrisOk, setQrisOk] = useState(true);
  const [proof, setProof] = useState(null);       // Blob JPEG hasil kompresi
  const [proofUrl, setProofUrl] = useState('');   // URL pratinjau
  const [proofErr, setProofErr] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const sendingRef = useRef(false);
  useEffect(() => () => { if (proofUrl) URL.revokeObjectURL(proofUrl); }, [proofUrl]);
  const pickProof = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setProofErr('');
    if (f.size > 15 * 1024 * 1024) { setProofErr('Ukuran gambar maksimal 15 MB.'); return; }
    if (!f.type.startsWith('image/')) { setProofErr('Pilih file berupa gambar (foto atau tangkapan layar).'); return; }
    setProofBusy(true);
    try {
      const blob = await compressProof(f);
      setProof(blob);
      setProofUrl(URL.createObjectURL(blob));
    } catch (err) {
      setProofErr(err.message || 'Gambar tidak dapat diproses.');
    }
    setProofBusy(false);
  };
  const order = calcOrder(items.length);
  const total = order.total;
  const qrisSrc = `${import.meta.env.BASE_URL}qris.png`;

  const confirmPayment = async () => {
    // Kunci instan (ref) agar klik ganda secepat apa pun hanya mengirim satu pesanan
    if (sendingRef.current || busy || !proof) return;
    sendingRef.current = true;
    setBusy(true);
    let res = { ok: false };
    try { res = await onSubmit({ code, total, ids: items.map(i => i.book_id), proof }); } catch {}
    if (!res.ok) { sendingRef.current = false; setBusy(false); return; }
    // Sukses: kunci tetap terpasang, jendela ditutup
    onConfirmed();
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-card checkout-card" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title"><ShoppingBag size={18} className="modal-icon-teal"/><span>Pembayaran</span></div>
        <button className="modal-close-btn" onClick={onClose} title="Tutup"><X size={18}/></button>
      </div>

      <div className="checkout-code">Kode pesanan <b>{code}</b></div>
      <div className="checkout-items">
        {items.map(it => (
          <div className="checkout-row" key={it.id}><span title={it.title}>{it.title}</span></div>
        ))}
        {order.parts.map(pt => (
          <div className="checkout-row part" key={pt.qty}><span>{pt.count}× {pt.label}</span><b>{formatRupiah(pt.count * pt.price)}</b></div>
        ))}
        <div className="checkout-row total"><span>Total bayar</span><b>{formatRupiah(total)}</b></div>
      </div>

      <div className="qris-box">
        <div className="qris-name"><span>Atas nama</span><b>{QRIS_NAME}</b></div>
        {qrisOk
          ? <img src={qrisSrc} alt="QRIS pembayaran" onError={() => setQrisOk(false)}/>
          : <div className="qris-missing">Gambar QRIS belum dipasang. Silakan coba lagi nanti atau hubungi admin.</div>}
        <div className="qris-caption">Scan dengan aplikasi e-wallet atau mobile banking</div>
      </div>

      <ol className="checkout-steps">
        <li>Scan QRIS di atas dan bayar sesuai <b>total</b>.</li>
        <li>Setelah berhasil, unggah foto atau tangkapan layar <b>bukti bayar</b> di bawah.</li>
        <li>Tekan tombol konfirmasi untuk mengirim pesanan ke admin.</li>
        <li>Admin akan memeriksa dan membuka kunci buku di akun <b>{email}</b>.</li>
      </ol>

      <div className="proof-box">
        <label className={`proof-pick${proof ? ' has' : ''}`}>
          <input type="file" accept="image/*" onChange={pickProof} disabled={busy || proofBusy} hidden/>
          {proofBusy
            ? <><LoaderCircle size={17} className="spin"/> Memproses gambar…</>
            : proof
              ? <><Check size={17}/> Bukti bayar dipilih. Ketuk untuk mengganti</>
              : <><Upload size={17}/> Unggah bukti bayar</>}
        </label>
        {proofUrl && <img className="proof-preview" src={proofUrl} alt="Pratinjau bukti bayar"/>}
        {proofErr && <div className="proof-error">{proofErr}</div>}
        <div className="proof-note">Foto hanya dipakai admin untuk memeriksa pembayaran dan otomatis dihapus setelah pesanan diproses.</div>
      </div>

      <button className="primary-button pay-button" onClick={confirmPayment} disabled={busy || !proof}>
        {busy ? <LoaderCircle size={18} className="spin"/> : <Check size={18}/>}
        {busy ? 'Mengirim pesanan…' : proof ? 'Saya sudah bayar' : 'Unggah bukti bayar untuk melanjutkan'}
      </button>
    </div>
  </div>;
}

function SetupMissing() {
  return <main className="setup-page"><div className="setup-card"><div className="brand-mark"><BookOpen size={22}/></div><h1>Hubungkan Ruang Bacaan ke Supabase</h1><p>Aplikasi hampir siap. Isi URL dan key Supabase di file <code>.env</code>, lalu jalankan ulang server.</p><ol><li>Buat proyek Supabase.</li><li>Salin <code>.env.example</code> menjadi <code>.env</code>.</li><li>Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Jalankan kembali <code>npm run dev</code>.</li></ol></div></main>;
}

// Halaman masuk sudah ada sebagai HTML statis (scripts/prerender.mjs): pakai ulang lewat hydration
// agar tidak digambar dua kali. Kondisi lain (sudah login, tema gelap, dll.) dirender biasa.
const rootEl = document.getElementById('root');
const canHydrate = (() => {
  try {
    return !!rootEl.querySelector('main[data-prerender]') && !!supabase && !hasSessionHint()
      && (localStorage.getItem('ruang-baca-theme') || 'light') === 'light'
      && localStorage.getItem('rb_remember') !== '0';
  } catch { return false; }
})();
if (canHydrate) hydrateRoot(rootEl, <App />);
else createRoot(rootEl).render(<App />);
