import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { devkitSave } from './vite-plugins/devkitSave'
import devkitSettings from './content/devkit.json'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// Dev Kit in release builds? content/devkit.json "inReleaseBuilds" decides (true through beta, false from 1.0).
// DEVKIT_IN_RELEASE=true|false overrides it for one build — npm run check:devkit uses that to test both ways.
function devkitInReleaseBuilds(): boolean {
  const override = process.env.DEVKIT_IN_RELEASE
  if (override === 'true') return true
  if (override === 'false') return false
  if (override !== undefined) throw new Error(`DEVKIT_IN_RELEASE must be true or false (got "${override}")`)
  return devkitSettings.inReleaseBuilds === true
}

// https://vite.dev/config/
export default defineConfig({
  // Baked into the code at build time. main.tsx reads it: when false, the Dev Kit import is dead code
  // and none of src/devkit/ reaches the live build.
  define: {
    __DEVKIT_IN_RELEASE__: JSON.stringify(devkitInReleaseBuilds()),
  },
  base: process.env.NODE_ENV === 'production' ? '/roll-better/' : '/',
  plugins: [
    react(),
    devkitSave(), // Dev Kit Save button → writes content/ JSON (dev server only, never in the live build)
    // basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Roll Better',
        short_name: 'Roll Better',
        description: 'Multiplayer dice-matching game',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'landscape',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB — Three.js bundle is ~3.5 MB
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\/(partykit|parties)\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: true, // expose on local network for phone testing
  },
})
