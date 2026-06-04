import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Explicitly declare the public directory (default, but stated clearly)
  // All files inside /public (robots.txt, sitemap.xml, manifest.json, etc.)
  // are copied verbatim to the build output root with no hashing.
  publicDir: 'public',

  server: {
    port: 3000
  },

  build: {
    // Output to dist/ (Vercel default)
    outDir: 'dist',
    // Static assets go into dist/assets/
    assetsDir: 'assets'
  }
})
