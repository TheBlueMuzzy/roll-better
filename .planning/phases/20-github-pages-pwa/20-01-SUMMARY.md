---
phase: 20-github-pages-pwa
plan: 01
subsystem: infra
tags: [pwa, vite-plugin-pwa, workbox, service-worker, manifest, icons]

# Dependency graph
requires:
  - phase: 19-connection-resilience
    provides: full multiplayer working, ready for public deployment
provides:
  - Installable PWA with app shell caching
  - Service worker with auto-update (no user prompt)
  - Web app manifest for standalone display
  - Placeholder icons (favicon.svg, 192/512 PNGs)
affects: [21-compliance-integration-testing]

# Tech tracking
tech-stack:
  added: [vite-plugin-pwa]
  patterns: [workbox-precaching, NetworkOnly-for-websockets, autoUpdate-sw]

key-files:
  created: [public/favicon.svg, public/pwa-192x192.png, public/pwa-512x512.png]
  modified: [vite.config.ts, index.html, package.json]

key-decisions:
  - "registerType autoUpdate — SW activates immediately, no update prompt needed"
  - "NetworkOnly for PartyKit traffic — WebSocket connections never cached"
  - "maximumFileSizeToCacheInBytes 5MB — Three.js bundle ~3.5MB exceeds default 2MB limit"

patterns-established:
  - "PWA auto-update: new deploys activate service worker immediately"

issues-created: []

# Metrics
duration: 22min
completed: 2026-03-05
---

# Phase 20 Plan 01: PWA Setup Summary

**Installable PWA via vite-plugin-pwa with workbox precaching, auto-update service worker, and NetworkOnly exclusion for PartyKit WebSocket traffic**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-05T19:27:25Z
- **Completed:** 2026-03-05T19:49:28Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments
- PWA installable from browser on mobile (Add to Home Screen)
- Service worker precaches app shell for fast loading (js, css, html, wasm)
- Auto-update: new deploys activate SW immediately, no user prompt
- PartyKit/WebSocket traffic excluded from SW via NetworkOnly runtime cache
- Placeholder dice icons (SVG + 192/512 PNGs) ready for art replacement

## Task Commits

1. **Task 1: Install vite-plugin-pwa and configure manifest + service worker** - `19a2d87` (feat)
2. **Task 2: Create icon assets and update index.html meta tags** - `fd76c73` (feat)
3. **Task 3: Verify PWA installs on mobile** - checkpoint (approved)

## Files Created/Modified
- `vite.config.ts` - Added VitePWA plugin with manifest, workbox, runtime caching
- `package.json` / `package-lock.json` - Added vite-plugin-pwa dev dependency
- `public/favicon.svg` - Dice-themed SVG icon (dark bg, white pips showing 5)
- `public/pwa-192x192.png` - 192x192 PNG icon generated from SVG
- `public/pwa-512x512.png` - 512x512 PNG icon generated from SVG
- `index.html` - Added theme-color, favicon, apple-touch-icon, description meta tags

## Decisions Made
- **registerType autoUpdate** — No update prompt UI needed; new SW activates immediately on deploy
- **NetworkOnly for PartyKit** — WebSocket connections must never be cached by service worker
- **maximumFileSizeToCacheInBytes 5MB** — Three.js bundle (~3.5MB) exceeds workbox default 2MB limit

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Increased workbox max file size to 5MB**
- **Found during:** Task 1 (build verification)
- **Issue:** Three.js bundle ~3.5MB exceeds workbox default 2MB precache limit, build would warn/fail
- **Fix:** Added `maximumFileSizeToCacheInBytes: 5 * 1024 * 1024` to workbox config
- **Files modified:** vite.config.ts
- **Verification:** Build succeeds, all assets precached
- **Committed in:** 19a2d87 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking), 0 deferred
**Impact on plan:** Necessary for correct precaching. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- PWA installed and verified on mobile
- Game functions correctly in standalone mode
- Ready for Phase 21 (Compliance + Integration Testing)

---
*Phase: 20-github-pages-pwa*
*Completed: 2026-03-05*
