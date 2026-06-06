import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
// import { SpeedInsights } from "@vercel/speed-insights/react"
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// ── PWA Service Worker Registration ────────────────────────────────────────
// registerSW is injected by vite-plugin-pwa at build time.
// The `autoUpdate` strategy handles updates automatically; this callback
// is only called if an update check fails (offline scenario).
registerSW({
  onNeedRefresh() {
    // Optional: you can prompt the user here, but autoUpdate handles it.
    console.log('[PWA] New content available, will update on next navigation.')
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.')
  },
  onRegistered(registration) {
    console.log('[PWA] Service worker registered:', registration)
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <App />
      <Analytics />
      <SpeedInsights />
    </Router>
  </StrictMode>,
)
