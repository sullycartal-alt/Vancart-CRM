import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Configuration Vite avec le plugin PWA pour VanCart CRM
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Le nouveau service worker s'active immédiatement et prend le contrôle
      // de tous les onglets ouverts, sans attendre leur fermeture
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['icons/*'],
      manifest: {
        name: 'VanCart CRM',
        short_name: 'VanCart',
        description: 'Outil de prospection terrain pour VanCart, la carte de fidélité digitale',
        theme_color: '#6C47FF',
        background_color: '#6C47FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
