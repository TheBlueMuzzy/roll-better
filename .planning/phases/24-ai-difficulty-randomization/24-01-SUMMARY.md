---
phase: 24-ai-difficulty-randomization
plan: 01
subsystem: ai
tags: [ai, difficulty, randomization, gamestore, partykit]

# Dependency graph
requires:
  - phase: 23-settings-controls-cleanup
    provides: difficulty selector already removed from UI
provides:
  - randomDifficulty() helper for per-bot difficulty assignment
  - aiDifficulty fully removed from protocol and game prefs
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-bot random difficulty at creation time (no uniform setting)"

key-files:
  created: []
  modified:
    - src/utils/aiDecision.ts
    - src/store/gameStore.ts
    - src/types/game.ts
    - src/types/protocol.ts
    - src/App.tsx
    - src/components/LobbyScreen.tsx
    - src/hooks/useRoom.ts
    - src/hooks/useOnlineGame.ts
    - party/server.ts
    - src/utils/aiDecision.test.ts

key-decisions:
  - "Duplicate randomDifficulty() in server (can't import from src/utils in PartyKit bundle)"

patterns-established:
  - "Each AI bot gets independent random difficulty — no global setting"

issues-created: []

# Metrics
duration: 8min
completed: 2026-03-06
---

# Phase 24 Plan 01: AI Difficulty Randomization Summary

**Remove uniform aiDifficulty plumbing, assign random Easy/Medium/Hard per bot at creation time**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T19:20:00Z
- **Completed:** 2026-03-06T19:28:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added `randomDifficulty()` helper to aiDecision.ts (client) and server.ts (server)
- Removed `aiDifficulty` from GamePrefs, protocol messages (StartGameMessage, GameStartingMessage), ServerGameState, and all function signatures
- Each AI bot now gets an independently randomized difficulty at creation time (both offline and online)
- All 32 tests pass including new randomDifficulty test

## Task Commits

Each task was committed atomically:

1. **Task 1: Randomize AI difficulty assignment everywhere** - `9f0f130` (feat)
2. **Task 2: Update tests and verify** - `06d6779` (test)

## Files Created/Modified
- `src/utils/aiDecision.ts` - Added randomDifficulty() helper
- `src/store/gameStore.ts` - Removed aiDifficulty param from initGame, use randomDifficulty() per bot
- `src/types/game.ts` - Removed aiDifficulty from GamePrefs
- `src/types/protocol.ts` - Removed aiDifficulty from StartGameMessage and GameStartingMessage
- `src/App.tsx` - Removed aiDifficulty from handlePlay, handlePlayAgain, handleOnlineGameStart
- `src/components/LobbyScreen.tsx` - Removed aiDifficulty from onGameStart prop and handleStart
- `src/hooks/useRoom.ts` - Removed aiDifficulty from GameStartData, startGame, game_starting handler
- `src/hooks/useOnlineGame.ts` - Removed difficulty extraction from game_starting restart handler
- `party/server.ts` - Added local randomDifficulty(), removed aiDifficulty from ServerGameState and messages, per-bot random assignment
- `src/utils/aiDecision.test.ts` - Added randomDifficulty test

## Decisions Made
- Duplicated randomDifficulty() in server.ts because PartyKit bundles separately from src/ — can't share imports

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 24 complete (single plan phase)
- Ready for Phase 25: Multiplayer Screen Rework

---
*Phase: 24-ai-difficulty-randomization*
*Completed: 2026-03-06*
