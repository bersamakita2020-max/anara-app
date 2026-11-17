import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const buildLabel = new Date().toLocaleString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

export default defineConfig({
  base: '/anara-app/',
  define: {
    __ANARA_BUILD__: JSON.stringify(buildLabel),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'ANARA',
        short_name: 'ANARA',
        description: 'ANARA, Beyond Value',
        lang: 'id',
        start_url: '/anara-app/',
        scope: '/anara-app/',
        display: 'standalone',
        background_color: '#0A0A0B',
        theme_color: '#7C3AED',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,svg,png,ico,woff2,ttf}'],
        globIgnores: ['**/index.html', '**/*.webmanifest', 'sw.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
    {
      name: 'salin-404',
      closeBundle() {
        try {
          copyFileSync('dist/index.html', 'dist/404.html')
        } catch {
          /* dist belum ada saat preview */
        }
      },
    },
  ],
})
