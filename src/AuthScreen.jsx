// Halaman masuk/daftar. File terpisah agar bisa di-render menjadi HTML statis
// saat build (scripts/prerender.mjs), sehingga tampil instan sebelum JavaScript siap.
import React, { useState } from 'react';
import { BookOpen, Moon, Sun, Eye, EyeOff, AlertCircle, LoaderCircle } from 'lucide-react';

export default function AuthScreen(props) {
  const {remember,setRemember,authMode,setAuthMode,setAuthMessage,email,setEmail,password,setPassword,authBusy,authMessage,handleAuth,theme,setTheme,signupOpen = true} = props;
  const [showPassword, setShowPassword] = useState(false);
  return <main className="auth-page">
    <button className="auth-theme icon-button" title="Ganti tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
    <div className="auth-card">
      <div className="brand auth-brand"><div className="brand-mark"><BookOpen size={22}/></div><div><div className="brand-name">ruang bacaan</div><div className="brand-caption">PERPUSTAKAAN PRIBADI</div></div></div>
      <div className="auth-illustration"><div className="auth-orbit"></div><div className="auth-book"><BookOpen size={43}/></div></div>
      <div className="eyebrow muted">PERPUSTAKAAN DIGITAL ANDA</div>
      <h1>{authMode === 'login' ? 'Senang melihat Anda kembali.' : authMode === 'forgot' ? 'Lupa kata sandi?' : 'Mulai bangun rak buku Anda.'}</h1>
      <p className="auth-subtitle">{authMode === 'login' ? 'Masuk untuk melanjutkan cerita yang terakhir Anda baca.' : authMode === 'forgot' ? 'Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.' : 'Buat akun untuk menyimpan koleksi dan progres membaca di cloud.'}</p>
      <form onSubmit={handleAuth} className="auth-form">
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" required autoComplete="email"/></label>
        {authMode !== 'forgot' && (
        <label>Kata sandi
          <span className="password-field">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={authMode === 'login' ? 'Kata sandi Anda' : 'Minimal 8 karakter'} required minLength={authMode === 'login' ? 6 : 8} maxLength={72} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}/>
            <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </span>
        </label>
        )}
        {authMode === 'login' && (
          <div className="auth-options">
            <label className="remember-check">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
              <span>Ingat saya</span>
            </label>
            <button type="button" className="auth-forgot" onClick={() => { setAuthMessage(''); setAuthMode('forgot'); }}>Lupa kata sandi?</button>
          </div>
        )}
        {authMessage && <div className="auth-message"><AlertCircle size={16}/>{authMessage}</div>}
        <button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? <LoaderCircle size={17} className="spin"/> : null}{authBusy ? 'Memproses…' : authMode === 'login' ? 'Masuk ke Ruang Bacaan' : authMode === 'forgot' ? 'Kirim tautan reset' : 'Buat akun'}</button>
      </form>
      {authMode === 'forgot' ? (
        <div className="auth-switch"><button onClick={() => { setAuthMessage(''); setAuthMode('login'); }}>Kembali ke halaman masuk</button></div>
      ) : authMode === 'login' && !signupOpen ? (
        <div className="auth-switch">Pendaftaran akun baru sedang ditutup sementara.</div>
      ) : (
        <div className="auth-switch">{authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button onClick={() => { setAuthMessage(''); setAuthMode(authMode === 'login' ? 'signup' : 'login'); }}>{authMode === 'login' ? 'Daftar sekarang' : 'Masuk'}</button></div>
      )}
      <div className="auth-privacy"><span className="privacy-dot"></span> Koleksi pribadi · Sinkronisasi cloud · Tanpa TTS</div>
    </div>
  </main>;
}
