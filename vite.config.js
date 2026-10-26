import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react') || id.includes('scheduler')) return 'react';
        }
      }
    }
  }
});
