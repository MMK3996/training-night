/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/training-night/', // Exact GitHub Pages subpath for https://mmk3996.github.io/training-night/
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Spaced Repetition System (SRS)',
        short_name: 'SRS App',
        description: 'Minimalist Spaced Repetition Tool for Competitive Programming & University Academics',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/codeforces\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'codeforces-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/kenkoooo\.com\/atcoder\/resources\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'atcoder-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
