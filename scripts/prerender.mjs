// Dijalankan setelah `vite build` (lihat script "build" di package.json).
// Tujuannya: layar pertama tampil secepat mungkin di HP (skor PageSpeed).
//  1. Halaman masuk di-render menjadi HTML statis di #root, lalu React memakainya ulang (hydrateRoot).
//  2. CSS utama dan boot.js ditanam langsung di HTML (tanpa permintaan tambahan yang memblokir).
//  3. JavaScript aplikasi baru diunduh setelah layar pertama tergambar.
//  4. Font untuk layar pertama dimuat lebih awal (preload).
// Script inline diizinkan lewat hash SHA-256 di Content-Security-Policy.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, process.argv[2] || 'dist');
const indexPath = path.join(dist, 'index.html');
let page = readFileSync(indexPath, 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error(`prerender: ${msg}`); };

// ---------- 1. Render halaman masuk ----------
const tmp = path.join(root, 'node_modules', '.prerender-auth.mjs');
await build({
  entryPoints: [path.join(root, 'src/AuthScreen.jsx')],
  outfile: tmp, bundle: true, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react-dom', 'lucide-react'], logLevel: 'error'
});
const { default: AuthScreen } = await import(pathToFileURL(tmp).href);
const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
rmSync(tmp, { force: true });
const noop = () => {};
let auth = renderToString(React.createElement(AuthScreen, {
  remember: true, setRemember: noop, authMode: 'login', setAuthMode: noop, setAuthMessage: noop,
  email: '', setEmail: noop, password: '', setPassword: noop, authBusy: false, authMessage: '',
  handleAuth: noop, theme: 'light', setTheme: noop
}));
must(auth.startsWith('<main class="auth-page"'), 'markup halaman masuk tidak dikenali');
auth = auth.replace('<main class="auth-page"', '<main class="auth-page" data-prerender=""');
must(page.includes('<!--prerender:auth-->'), 'penanda <!--prerender:auth--> tidak ada di index.html');
page = page.replace('<!--prerender:auth-->', auth);

// ---------- 2. Tanam CSS utama ----------
const cssTag = page.match(/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+\.css)">/);
must(cssTag, 'link CSS utama tidak ditemukan');
const css = readFileSync(path.join(dist, 'assets', cssTag[1]), 'utf8')
  .replace(/url\(\.\//g, 'url(./assets/');          // path relatif dari assets/ -> dari root
page = page.replace(cssTag[0], `<style>${css}</style>`);

// ---------- 3. Tanam boot.js + muat aplikasi setelah layar pertama tergambar ----------
const hashes = [];
const inline = code => { hashes.push(`'sha256-${createHash('sha256').update(code).digest('base64')}'`); return `<script>${code}</script>`; };

const boot = readFileSync(path.join(dist, 'boot.js'), 'utf8').trim();
must(page.includes('<script src="./boot.js"></script>'), 'tag boot.js tidak ditemukan');
page = page.replace('<script src="./boot.js"></script>', inline(boot));

const mainTag = page.match(/<script type="module" crossorigin src="(\.\/assets\/[^"]+\.js)"><\/script>/);
must(mainTag, 'script utama tidak ditemukan');
const preloads = [...page.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">\n?\s*/g)];
for (const m of preloads) page = page.replace(m[0], '');
// Pemicu: tepat setelah first-contentful-paint (PerformanceObserver), cadangan double-rAF / batas waktu.
// Pengaman: jika file aplikasi gagal dimuat (mis. cache rusak saat deploy), ambil ulang semua file
// langsung dari server lalu muat ulang sekali. Jika 15 detik aplikasi belum tampil, tampilkan tombol Muat ulang.
const files = [...preloads.map(m => m[1]), mainTag[1]];
const start = `(function(){
var F=${JSON.stringify(files)},done=0,err='';
addEventListener('error',function(e){if(!err)err=(e.message||(e.target&&(e.target.src||e.target.href))||'')+''},true);
addEventListener('unhandledrejection',function(e){if(!err)err=String(e.reason&&e.reason.message||e.reason||'')});
function retried(){try{return sessionStorage.getItem('rb_retry')==='1'}catch(e){return true}}
function freshReload(){try{sessionStorage.setItem('rb_retry','1')}catch(e){}
Promise.all(F.map(function(u){return fetch(u,{cache:'reload'}).catch(function(){})})).then(function(){location.reload()})}
function fail(){var sp=document.getElementById('rb-splash');if(!sp)return;
document.documentElement.classList.add('rb-session');
if(!retried()){freshReload();return}
if(sp.getAttribute('data-fail'))return;sp.setAttribute('data-fail','1');
var p=document.createElement('p');p.style.cssText='margin:6px 0 0;max-width:320px;text-align:center;font-size:13px;line-height:1.6';
p.textContent='Aplikasi belum berhasil dimuat. Periksa koneksi internet, lalu muat ulang.';
var b=document.createElement('button');b.type='button';b.textContent='Muat ulang';
b.style.cssText='height:40px;padding:0 18px;border-radius:11px;border:1px solid #426c5b;background:#426c5b;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer';
b.addEventListener('click',function(){try{sessionStorage.removeItem('rb_retry')}catch(e){}freshReload()});
sp.appendChild(p);sp.appendChild(b);
if(err){var d=document.createElement('small');d.style.cssText='max-width:320px;text-align:center;opacity:.7;word-break:break-word';d.textContent='Detail: '+err.slice(0,160);sp.appendChild(d)}}
function go(){if(done)return;done=1;
F.slice(0,-1).forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=h;document.head.appendChild(l)});
var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=F[F.length-1];s.onerror=fail;document.head.appendChild(s);
setTimeout(function(){if(document.getElementById('rb-splash'))fail()},15000)}
if(document.documentElement.className.indexOf('rb-session')>-1){go();return}
try{new PerformanceObserver(function(l){if(l.getEntriesByName('first-contentful-paint').length)setTimeout(go,0)}).observe({type:'paint',buffered:true})}catch(e){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}
setTimeout(go,3000)})();`.replace(/\n/g, '');
page = page.replace(mainTag[0], inline(start));

// Izinkan kedua script inline di CSP (hanya ada di build web; build Android tanpa meta CSP)
page = page.replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*?script-src 'self')/, `$1 ${hashes.join(' ')}`);

// ---------- 4. Preload font layar pertama ----------
const assets = readdirSync(path.join(dist, 'assets'));
const pick = re => assets.find(f => re.test(f));
const fonts = [pick(/^playfair-display-latin-wght-normal.*\.woff2$/), pick(/^dm-sans-latin-wght-normal.*\.woff2$/)].filter(Boolean);
page = page.replace('<style>', fonts.map(f => `<link rel="preload" href="./assets/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ') + '\n    <style>');

writeFileSync(indexPath, page);
console.log(`prerender: halaman masuk, CSS ${Math.round(css.length / 1024)} KB, ${hashes.length} script inline, ${fonts.length} font preload -> ${path.relative(root, indexPath)}`);
