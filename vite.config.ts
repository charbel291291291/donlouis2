
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Don Louis Snack Bar',
        short_name: 'Don Louis',
        description: 'Where Food is an Art. Premium Snack Bar & Grill.',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://cdn.tailwindcss.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-cdn',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: ({ url }) => url.href.includes('supabase.co/storage'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
              }
            }
          }
        ]
      }
    })
  ],
  base: './', 
  define: {
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
