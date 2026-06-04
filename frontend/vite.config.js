import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // ── Registration strategy ────────────────────────────────────
      // 'autoUpdate' silently updates the SW in the background and
      // reloads the page on the next navigation — best UX for a store.
      registerType: 'autoUpdate',

      // Include additional static assets in the precache manifest
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'sitemap.xml',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'manifest.json',
      ],

      // ── Web App Manifest ────────────────────────────────────────
      manifest: {
        name: 'RR Dental Needs',
        short_name: 'RR Dental',
        description: 'The #1 online store for dental students — instruments, kits and supplies for all BDS years at affordable prices.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0d9488',
        background_color: '#f8fafc',
        lang: 'en',
        categories: ['shopping', 'education', 'medical'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Browse Products',
            short_name: 'Products',
            description: 'Browse all dental instruments',
            url: '/products',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: '1st Year Supplies',
            short_name: '1st Year',
            url: '/category/1st%20Year',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'RR Dental Needs home screen',
          },
        ],
      },

      // ── Workbox (Service Worker) configuration ───────────────────
      workbox: {
        // Import custom push worker script
        importScripts: ['/sw-push.js'],

        // Cache all built JS/CSS/HTML assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          // ── API calls: Network First (fresh data when online, cached fallback) ──
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Product images from Cloudinary: Cache First ──────────
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('cloudinary.com') ||
              url.hostname.includes('odontic-backend.onrender.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Google Fonts: Stale While Revalidate ─────────────────
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },

          // ── Razorpay checkout script: Network Only (always fresh) ─
          {
            urlPattern: /checkout\.razorpay\.com/,
            handler: 'NetworkOnly',
          },
        ],

        // Skip waiting so updates activate immediately
        skipWaiting: true,
        clientsClaim: true,

        // Offline fallback page
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /\/sitemap\.xml$/,
          /\/robots\.txt$/,
        ],
      },

      // ── Dev options (allows SW testing in dev server) ────────────
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  // Explicitly declare the public directory
  publicDir: 'public',

  server: {
    port: 3000,
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
