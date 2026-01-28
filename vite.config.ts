import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Critical: Allows the app to run on GitHub Pages
  define: {
    // Polyfill process.env to prevent "process is not defined" error in browser
    'process.env': {} 
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true
  }
});