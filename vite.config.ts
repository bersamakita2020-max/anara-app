import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/anara-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png'],
      manifest: {
        name: 'ANARA',
        short_name: 'ANARA',
        description: 'ANARA, Beyond Value',
        lang: 'id',
        start_url: '/anara-app/',
        scope: '/anara-app/',
        display: 'standalone',
        background_color: '#F7F7F5',
        theme_color: '#7C3AED',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,ttf}'],
        navigateFallback: '/anara-app/index.html',
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
