import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  BookOpen, LogOut, LoaderCircle, Check, X, Eye, EyeOff, AlertCircle, CheckCircle2,
  ClipboardList, History, RefreshCw, Bell, BellOff, Power, Inbox, Wifi, WifiOff
} from 'lucide-react';
import './styles.css';

// ---------- Supabase ----------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'rb-admin-auth' } })
  : null;

const PROOF_BUCKET = 'payment-proofs';
const proofPath = code => `${code}.jpg`;

// ---------- Integrasi Windows (Tauri); di browser biasa semuanya diam saja ----------
const IS_DESKTOP = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

const desktop = {
  async setPending(count) {
    if (!IS_DESKTOP) return;
    try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('set_pending', { count }); } catch {}
  },
  async notify(title, body) {
    if (!IS_DESKTOP) return;
    try {
      const n = await import('@tauri-apps/plugin-notification');
      let ok = await n.isPermissionGranted();
      if (!ok) ok = (await n.requestPermission()) === 'granted';
      if (ok) n.sendNotification({ title, body });
    } catch {}
  },
  async autostartEnabled() {
    if (!IS_DESKTOP) return false;
    try { const a = await import('@tauri-apps/plugin-autostart'); return await a.isEnabled(); } catch { return false; }
  },
  async setAutostart(on) {
    if (!IS_DESKTOP) return false;
    const a = await import('@tauri-apps/plugin-autostart');
    if (on) await a.enable(); else await a.disable();
    return a.isEnabled();
  }
};

// Bunyi "ding" dua nada tanpa file audio
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1320, 0.16]].forEach(([freq, at]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.45);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.5);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {}
};

// ---------- Format ----------
const formatRupiah = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const formatTime = iso => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeAgo = iso => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return formatTime(iso);
};
const STATUS = { pending: 'Menunggu', approved: 'Diterima', rejected: 'Ditolak' };

const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch { return d; } };
const writePref = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch {} };

// =====================================================================
function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    let alive = true;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!alive) return;
      if (error || data !== true) {
        setIsAdmin(false);
        supabase.auth.signOut();
      } else setIsAdmin(true);
    });
    return () => { alive = false; };
  }, [session?.user?.id]);

  if (!supabase) return <Centered><AlertCircle size={22}/> Konfigurasi Supabase belum diisi saat build.</Centered>;
  if (!ready || (session && isAdmin === null)) return <Centered><LoaderCircle className="spin" size={22}/> Memuat…</Centered>;
  if (!session || !isAdmin) return <Login rejected={isAdmin === false}/>;
  return <Dashboard session={session}/>;
}

function Centered({ children }) {
  return <div className="centered">{children}</div>;
}

function Brand({ small }) {
  return (
    <div className={`brand${small ? ' small' : ''}`}>
      <div className="brand-mark"><BookOpen size={small ? 18 : 22}/></div>
      <div>
        <div className="brand-name">Ruang Bacaan</div>
        <div className="brand-caption">ADMIN PESANAN</div>
      </div>
    </div>
  );
}

// ---------- Login ----------
function Login({ rejected }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(rejected ? 'Akun ini bukan admin. Masuk dengan akun admin Ruang Bacaan.' : '');

  useEffect(() => { if (rejected) setMsg('Akun ini bukan admin. Masuk dengan akun admin Ruang Bacaan.'); }, [rejected]);

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMsg(/invalid/i.test(error.message) ? 'Email atau kata sandi salah.' : error.message);
  };

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <Brand/>
        <h1>Masuk sebagai admin</h1>
        <p className="muted">Kelola pesanan Ruang Bacaan langsung dari desktop. Pesanan baru akan muncul sebagai notifikasi Windows.</p>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus autoComplete="username"/>
        </label>
        <label>Kata sandi
          <span className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
            <button type="button" className="ghost-icon" onClick={() => setShow(v => !v)} title={show ? 'Sembunyikan' : 'Tampilkan'}>
              {show ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          </span>
        </label>
        {msg && <div className="alert"><AlertCircle size={16}/> {msg}</div>}
        <button className="btn primary block" disabled={busy}>
          {busy && <LoaderCircle size={16} className="spin"/>}{busy ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}

// ---------- Dashboard ----------
function Dashboard({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [sound, setSound] = useState(() => readPref('rb-admin-sound', true));
  const [autostart, setAutostart] = useState(false);
  const [confirm, setConfirm] = useState(null);   // { order, action }
  const [proof, setProof] = useState(null);       // { code, url?, error?, loading }
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [, tick] = useState(0);

  const knownPending = useRef(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const notifyToast = (message, kind = 'ok') => {
    setToast({ message, kind });
    clearTimeout(notifyToast.t);
    notifyToast.t = setTimeout(() => setToast(null), 3800);
  };

  const load = useCallback(async () => {
    let data = null;
    const first = await supabase.from('orders').select('*, order_items(book_id,title)').order('created_at', { ascending: false }).limit(200);
    if (!first.error) data = first.data;
    else {
      const ord = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (ord.error) { setError(ord.error.message); setOnline(false); setLoading(false); return; }
      const ids = (ord.data || []).map(o => o.id);
      const items = ids.length ? await supabase.from('order_items').select('order_id,book_id,title').in('order_id', ids) : { data: [] };
      const by = {};
      (items.data || []).forEach(it => { (by[it.order_id] ||= []).push(it); });
      data = (ord.data || []).map(o => ({ ...o, order_items: by[o.id] || [] }));
    }
    setError(''); setOnline(true); setLoading(false); setLastSync(new Date());
    setOrders(data || []);

    // Deteksi pesanan baru untuk notifikasi
    const pendingNow = (data || []).filter(o => o.status === 'pending');
    const ids = new Set(pendingNow.map(o => o.id));
    if (knownPending.current) {
      const fresh = pendingNow.filter(o => !knownPending.current.has(o.id));
      if (fresh.length) {
        const o = fresh[0];
        const n = (o.order_items || []).length;
        desktop.notify(
          fresh.length > 1 ? `${fresh.length} pesanan baru` : `Pesanan baru ${o.code}`,
          fresh.length > 1 ? 'Buka Ruang Bacaan Admin untuk memeriksa.' : `${o.user_email} · ${n} buku · ${formatRupiah(o.total)}`
        );
        if (soundRef.current) playChime();
      }
    }
    knownPending.current = ids;
    desktop.setPending(ids.size);
  }, []);

  // Muat awal, realtime, dan cadangan polling
  useEffect(() => {
    load();
    const channel = supabase
      .channel('orders-admin-desktop')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    const poll = setInterval(load, 20000);
    const clock = setInterval(() => tick(t => t + 1), 30000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll); clearInterval(clock);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [load]);

  useEffect(() => { desktop.autostartEnabled().then(setAutostart); }, []);
  useEffect(() => () => { desktop.setPending(0); }, []);

  const pending = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const history = useMemo(() => orders.filter(o => o.status !== 'pending'), [orders]);
  const list = tab === 'pending' ? pending : history;

  const openProof = async o => {
    setProof({ code: o.code, loading: true });
    const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(proofPath(o.code), 300);
    if (error || !data?.signedUrl) setProof({ code: o.code, error: 'Bukti bayar tidak ditemukan untuk pesanan ini.' });
    else setProof({ code: o.code, url: data.signedUrl });
  };

  const runAction = async () => {
    const { order, action } = confirm;
    setConfirm(null);
    setBusyId(order.id);
    const { error } = await supabase.rpc(action === 'approve' ? 'approve_order' : 'reject_order', { p_order_id: order.id });
    if (error) { setBusyId(null); notifyToast(error.message || 'Gagal memproses pesanan.', 'err'); return; }
    try { await supabase.storage.from(PROOF_BUCKET).remove([proofPath(order.code)]); } catch {}
    setBusyId(null);
    notifyToast(action === 'approve' ? `Pesanan ${order.code} diterima. Buku sudah masuk ke rak pembeli.` : `Pesanan ${order.code} ditolak.`);
    load();
  };

  const toggleSound = () => { setSound(v => { writePref('rb-admin-sound', !v); if (!v) playChime(); return !v; }); };
  const toggleAutostart = async () => {
    try { setAutostart(await desktop.setAutostart(!autostart)); }
    catch { notifyToast('Gagal mengubah pengaturan mulai otomatis.', 'err'); }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Brand small/>
        <div className="top-actions">
          <span className={`sync ${online ? 'on' : 'off'}`} title={lastSync ? `Terakhir diperbarui ${lastSync.toLocaleTimeString('id-ID')}` : ''}>
            {online ? <Wifi size={14}/> : <WifiOff size={14}/>} {online ? 'Tersambung' : 'Terputus'}
          </span>
          <button className="icon-btn" onClick={load} title="Muat ulang"><RefreshCw size={17}/></button>
          <button className={`icon-btn${sound ? ' active' : ''}`} onClick={toggleSound} title={sound ? 'Matikan suara notifikasi' : 'Nyalakan suara notifikasi'}>
            {sound ? <Bell size={17}/> : <BellOff size={17}/>}
          </button>
          {IS_DESKTOP && (
            <button className={`icon-btn${autostart ? ' active' : ''}`} onClick={toggleAutostart} title={autostart ? 'Mulai otomatis saat Windows menyala: aktif' : 'Mulai otomatis saat Windows menyala: nonaktif'}>
              <Power size={17}/>
            </button>
          )}
          <div className="divider"/>
          <span className="who" title={session.user.email}>{session.user.email}</span>
          <button className="icon-btn" onClick={() => supabase.auth.signOut()} title="Keluar"><LogOut size={17}/></button>
        </div>
      </header>

      <main className="content">
        <div className="stats">
          <Stat label="Menunggu" value={pending.length} accent/>
          <Stat label="Diterima hari ini" value={history.filter(o => o.status === 'approved' && sameDay(o.updated_at || o.created_at)).length}/>
          <Stat label="Pendapatan hari ini" value={formatRupiah(history.filter(o => o.status === 'approved' && sameDay(o.updated_at || o.created_at)).reduce((s, o) => s + Number(o.total || 0), 0))}/>
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>
            <ClipboardList size={16}/> Menunggu {pending.length > 0 && <span className="badge">{pending.length}</span>}
          </button>
          <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            <History size={16}/> Riwayat
          </button>
        </div>

        {error && <div className="alert"><AlertCircle size={16}/> Gagal memuat pesanan: {error}</div>}

        {loading ? (
          <div className="empty"><LoaderCircle className="spin" size={22}/> Memuat pesanan…</div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Inbox size={26}/></div>
            <h3>{tab === 'pending' ? 'Tidak ada pesanan yang menunggu' : 'Belum ada riwayat pesanan'}</h3>
            <p className="muted">{tab === 'pending' ? 'Pesanan baru akan muncul di sini dan sebagai notifikasi Windows.' : 'Pesanan yang diterima atau ditolak akan tercatat di sini.'}</p>
          </div>
        ) : (
          <div className="order-list">
            {list.map(o => (
              <article className="order" key={o.id}>
                <div className="order-head">
                  <div>
                    <div className="order-code">{o.code}</div>
                    <div className="order-meta">{o.user_email}</div>
                    <div className="order-time" title={formatTime(o.created_at)}>{timeAgo(o.created_at)}</div>
                  </div>
                  <span className={`pill ${o.status}`}>{STATUS[o.status] || o.status}</span>
                </div>
                <ul className="order-books">
                  {(o.order_items || []).map((it, i) => <li key={`${it.book_id}-${i}`}>{it.title}</li>)}
                </ul>
                <div className="order-sum">
                  <span>{(o.order_items || []).length} buku</span>
                  <b>{formatRupiah(o.total)}</b>
                </div>
                <div className="order-foot">
                  {o.status === 'pending' && (
                    <div className="order-actions">
                      <button className="btn" onClick={() => openProof(o)}><Eye size={16}/> Bukti bayar</button>
                      <button className="btn danger" disabled={busyId === o.id} onClick={() => setConfirm({ order: o, action: 'reject' })}><X size={16}/> Tolak</button>
                      <button className="btn primary" disabled={busyId === o.id} onClick={() => setConfirm({ order: o, action: 'approve' })}>
                        {busyId === o.id ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>} Terima
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {proof && (
        <div className="backdrop" onClick={() => setProof(null)}>
          <div className="modal proof" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Bukti bayar {proof.code}</span>
              <button className="icon-btn" onClick={() => setProof(null)} title="Tutup"><X size={17}/></button>
            </div>
            {proof.loading && <div className="empty small"><LoaderCircle className="spin" size={20}/></div>}
            {proof.error && <div className="alert"><AlertCircle size={16}/> {proof.error}</div>}
            {proof.url && <img src={proof.url} alt={`Bukti bayar ${proof.code}`}/>}
          </div>
        </div>
      )}

      {confirm && (
        <div className="backdrop" onClick={() => setConfirm(null)}>
          <div className="modal confirm" onClick={e => e.stopPropagation()}>
            <h3>{confirm.action === 'approve' ? 'Terima pesanan?' : 'Tolak pesanan?'}</h3>
            <p className="muted">
              {confirm.action === 'approve'
                ? <>Pesanan <b>{confirm.order.code}</b> dari {confirm.order.user_email} akan diterima dan {(confirm.order.order_items || []).length} buku langsung masuk ke raknya.</>
                : <>Pesanan <b>{confirm.order.code}</b> dari {confirm.order.user_email} akan ditolak. Bukti bayarnya ikut dihapus.</>}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirm(null)}>Batal</button>
              <button className={`btn ${confirm.action === 'approve' ? 'primary' : 'danger solid'}`} onClick={runAction} autoFocus>
                {confirm.action === 'approve' ? <><Check size={16}/> Terima</> : <><X size={16}/> Tolak</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.kind}`}>
          {toast.kind === 'err' ? <AlertCircle size={17}/> : <CheckCircle2 size={17}/>}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

const sameDay = iso => {
  if (!iso) return false;
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

function Stat({ label, value, accent }) {
  return (
    <div className={`stat${accent ? ' accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
