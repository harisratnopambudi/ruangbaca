import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build aplikasi Android (`vite build --mode android`): meta CSP dilepas karena
// jembatan native Capacitor kadang perlu menyisipkan script ke halaman.
const stripCspForApp = mode => ({
  name: 'strip-csp-for-app',
  transformIndexHtml(html) {
    if (mode !== 'android') return html;
    return html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
  }
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), stripCspForApp(mode)],
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Pisahkan pustaka besar agar tersimpan di cache browser antar-update
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('epubjs') || id.includes('jszip') || id.includes('localforage') || id.includes('xmldom') || id.includes('core-js') || id.includes('lodash') || id.includes('marks-pane') || id.includes('pako')) return 'epub';
          if (id.includes('@capacitor/core')) return 'native';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react') || id.includes('scheduler')) return 'react';
        }
      }
    }
  }
}));
