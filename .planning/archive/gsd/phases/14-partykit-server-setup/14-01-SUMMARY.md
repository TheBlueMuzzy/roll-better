---
phase: 14-partykit-server-setup
plan: 01
subsystem: infra
tags: [partykit, cloudflare-workers, websocket, typescript]

# Dependency graph
requires:
  - phase: 13-audio-and-juice
    provides: Complete v1.0 local game (all game logic, UI, mobile features)
provides:
  - Partykit dev server running on localhost:1999
  - Shared protocol types (ClientMessage, ServerMessage discriminated unions)
  - Server tsconfig for Cloudflare Workers target
affects: [14-02 room server, 14-03 client connection, 15 lobby UI, 16 state sync]

# Tech tracking
tech-stack:
  added: [partykit v0.0.115, partysocket v1.1.16]
  patterns: [discriminated union message protocol, separate server tsconfig]

key-files:
  created: [partykit.json, party/server.ts, tsconfig.server.json, src/types/protocol.ts]
  modified: [package.json, package-lock.json]

key-decisions:
  - "Separate tsconfig.server.json targeting ESNext/bundler for Cloudflare Workers"
  - "Protocol types in src/types/ (shared between server and client via tsconfig includes)"
  - "Room lifecycle messages only — game action messages deferred to Phase 16"
  - "No concurrently dep — document running Vite and Partykit in separate terminals"

patterns-established:
  - "Discriminated union on type field for exhaustive message handling"
  - "Server code in party/ directory, separate from src/ client code"
  - "Shared types importable by both server and client tsconfigs"

issues-created: []

# Metrics
duration: 8min
completed: 2026-03-03
---

# Phase 14 Plan 1: Partykit Scaffold + Protocol Types Summary

**Partykit dev server scaffolded alongside Vite with shared discriminated-union message protocol for room lifecycle**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T15:03:56Z
- **Completed:** 2026-03-03T15:12:42Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Partykit installed and running on localhost:1999 alongside existing Vite dev server
- Shared protocol types defined with discriminated unions for exhaustive switch handling
- Server tsconfig established for Cloudflare Workers (ESNext/bundler target)
- Existing client build pipeline completely unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Partykit and configure project structure** - `3cedc0f` (chore)
2. **Task 2: Define shared message protocol types** - `a37ea85` (feat)

## Files Created/Modified
- `partykit.json` — Partykit project config (name, main entry, compat date)
- `party/server.ts` — Minimal server placeholder with onConnect handler
- `tsconfig.server.json` — Server TypeScript config targeting ESNext for Workers
- `src/types/protocol.ts` — Discriminated union types: ClientMessage (join, leave) + ServerMessage (connected, room_state, player_joined, player_left, error)
- `package.json` — Added partykit/partysocket deps + party:dev/party:deploy scripts
- `package-lock.json` — Lock file updated

## Decisions Made
- Separate tsconfig for server (ESNext/bundler target) rather than modifying existing client tsconfig
- Protocol types live in src/types/ (importable by both server and client via tsconfig includes)
- Room lifecycle messages only for now — game action messages deferred to Phase 16
- Skipped concurrently dependency — simpler to document running two terminals

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed erasableSyntaxOnly incompatibility in server.ts**
- **Found during:** Task 1 (Server placeholder creation)
- **Issue:** Plan's server.ts snippet used `constructor(readonly room: Party.Room)` parameter property syntax, incompatible with project's `erasableSyntaxOnly: true` TypeScript setting
- **Fix:** Declared field explicitly (`readonly room: Party.Room`) and assigned in constructor body
- **Files modified:** party/server.ts
- **Verification:** `tsc --noEmit -p tsconfig.server.json` passes clean
- **Committed in:** 3cedc0f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking — TypeScript config compatibility)
**Impact on plan:** Minor syntax adjustment, no functional change. No scope creep.

## Issues Encountered
- Pre-existing build warnings (3 unused vars in App.tsx, HUD.tsx, soundManager.ts) confirmed present before and after changes — not caused by this plan

## Next Phase Readiness
- Partykit dev server operational, ready for room server implementation (14-02)
- Protocol types ready to import in both server and client code
- No blockers

---
*Phase: 14-partykit-server-setup*
*Completed: 2026-03-03*
