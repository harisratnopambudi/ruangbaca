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
const start = `(function(){var done=0;function go(){if(done)return;done=1;${JSON.stringify(preloads.map(m => m[1]))}.forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=h;document.head.appendChild(l)});var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(mainTag[1])};document.head.appendChild(s)}if(document.documentElement.className.indexOf('rb-session')>-1){go();return}try{new PerformanceObserver(function(l){if(l.getEntriesByName('first-contentful-paint').length)setTimeout(go,0)}).observe({type:'paint',buffered:true})}catch(e){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}setTimeout(go,3000)})();`;
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
