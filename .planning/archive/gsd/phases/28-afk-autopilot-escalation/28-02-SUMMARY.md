---
phase: 28-afk-autopilot-escalation
plan: 02
subsystem: networking
tags: [partykit, websocket, zustand, afk, seat-state, hud]

requires:
  - phase: 28-01
    provides: Server AFK escalation engine, seat_state_changed broadcast
  - phase: 27-02
    provides: SeatState type, seatIndex on Player
provides:
  - Client handles seat_state_changed messages
  - HUD notification pills for AFK/bot transitions
  - Bot icon on profile avatars
  - Return to menu on bot takeover
  - AFK flag in protocol messages for correct counter tracking
affects: [phase-29, phase-30, phase-31]

tech-stack:
  added: []
  patterns: [window flag for cross-component AFK signaling]

key-files:
  created: []
  modified:
    - src/hooks/useOnlineGame.ts
    - src/store/gameStore.ts
    - src/components/HUD.tsx
    - src/components/PlayerProfileGroup.tsx
    - src/components/Scene.tsx
    - src/App.tsx
    - src/types/protocol.ts
    - party/server.ts

key-decisions:
  - "AFK threshold lowered from 3 to 2 (1 full turn = bot takeover)"
  - "Client flags afk:true on auto-triggered messages so server can distinguish from manual actions"
  - "Bot takeover returns player to main menu automatically"
  - "Bot icon is robot emoji in top-left of profile avatar circle"

patterns-established:
  - "window.__rbAfkRoll / __rbAfkUnlock flags for cross-component AFK signaling"

issues-created: []

duration: ~40 min active (session included debugging + checkpoint iterations)
completed: 2026-03-07
---

# Phase 28 Plan 02: Client Seat State Sync + UI Feedback Summary

**Client handles seat_state_changed, shows notification pills, bot icon on profiles, return to menu on bot takeover, fixed AFK counter bug**

## Performance

- **Duration:** ~40 min active
- **Started:** 2026-03-07T15:26:48Z
- **Completed:** 2026-03-07T23:20:34Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 8

## Accomplishments
- Client syncs seat state changes from server via updatePlayerSeatState store action
- HUD shows transient notification pills for AFK/bot/return transitions (auto-dismiss 3s, max 2)
- Robot emoji on profile avatar for any player with seatState === 'bot'
- Local player promoted to bot automatically disconnects and returns to main menu
- Fixed critical bug: AFK counter never accumulated because client auto-actions reset it

## Task Commits

1. **Task 1: Client handles seat_state_changed message** - `09e308e` (feat)
2. **Task 2: UI feedback for AFK and bot promotion** - `cd64f74` (feat)
3. **Checkpoint fixes: Bot icon + return to menu** - `a0b8ff2` (feat)
4. **AFK counter fix** - `dcc886e` (fix)

## Files Created/Modified
- `src/hooks/useOnlineGame.ts` — seat_state_changed case + afk flag on unlock/skip
- `src/store/gameStore.ts` — updatePlayerSeatState action + SeatState import
- `src/components/HUD.tsx` — notification pills + afk flags on timeout handlers
- `src/components/PlayerProfileGroup.tsx` — isBot prop + robot emoji overlay
- `src/components/Scene.tsx` — afk flag on roll_result messages
- `src/App.tsx` — watch localSeatState, return to menu on bot takeover
- `src/types/protocol.ts` — afk? field on RollResult, UnlockRequest, SkipUnlock
- `party/server.ts` — use afk flag for counter logic, threshold 2, fix resetAFKEscalation

## Decisions Made
- AFK threshold lowered from 3 to 2 per user request (1 full AFK turn = bot takeover)
- Client flags auto-triggered actions with afk:true rather than server guessing from timing
- resetAFKEscalation only resets when player is genuinely human-active

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AFK counter never accumulated**
- **Found during:** Checkpoint verification
- **Issue:** Client's AFK countdown auto-rolled at 20s, sent normal roll_result to server, which called resetAFKEscalation — counter reset every time, never reached threshold
- **Fix:** Added afk flag to protocol messages; server uses flag to increment counter instead of resetting
- **Files modified:** protocol.ts, HUD.tsx, Scene.tsx, useOnlineGame.ts, party/server.ts
- **Verification:** Playtest confirmed bot takeover after 1 full AFK turn
- **Committed in:** dcc886e

### User-Requested Additions

**2. Bot icon on profile avatars** (checkpoint feedback)
- Robot emoji in top-left of avatar circle for any player with seatState === 'bot'
- **Committed in:** a0b8ff2

**3. Return to menu on bot takeover** (checkpoint feedback)
- When local player is promoted to bot, disconnect from server and return to main menu
- **Committed in:** a0b8ff2

---

**Total deviations:** 1 bug fix, 2 user-requested additions
**Impact on plan:** Bug fix was critical for the feature to work at all. User additions are logical UX requirements.

## Issues Encountered
None beyond the AFK counter bug (fixed inline).

## Next Phase Readiness
- Phase 28 complete — AFK Autopilot & Escalation fully wired end-to-end
- Ready for Phase 29: Disconnect Handoff
- Vision captured: lobby "ready" button should be removed (auto-ready on join) — relevant to Phase 30/32

---
*Phase: 28-afk-autopilot-escalation*
*Completed: 2026-03-07*
