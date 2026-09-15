import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // Route-level splitting keeps the first paint small; see docs/EFFICIENCY.md.
    sourcemap: false,
  },
  server: {
    // The API key lives on the server. The browser only ever talks to /api.
    proxy: { '/api': 'http://localhost:8099' },
  },
});
