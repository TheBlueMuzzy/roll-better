---
phase: 29-disconnect-handoff
plan: 01
title: Replace 60s keepalive with phase-timer-based disconnect grace window
subsystem: server
tags: [disconnect, grace-timer, reconnect, bot-promotion]
requires: [phase-27-seat-model, phase-28-afk-escalation]
provides: [per-player-grace-timers, phase-timer-tracking, reconnect-during-grace]
affects: [party/server.ts]
tech-stack: [partykit, typescript]
key-files:
  - party/server.ts
key-decisions:
  - Grace window = remaining time on current phase timer (rolling/unlocking)
  - Non-timed phases (locking/scoring/roundEnd/sessionEnd) = immediate bot promotion
  - Empty room keepalive shortened from 60s to 10s
  - Reconnect after grace expired sends room_closed and closes connection
  - Defensive checks in AFK handlers catch offline non-bot players without grace timers
duration: 5m53s
completed: 2026-03-08T01:14:10Z
---

# 29-01 Summary: Disconnect Grace Timer

## Performance

- **Duration**: 5 minutes 53 seconds (fully autonomous)
- **Tasks**: 3/3 completed
- **Deviations**: None

## Accomplishments

Replaced the room-level 60-second keepalive with per-player disconnect grace timers tied to the game's phase timer rhythm:

1. **Per-player grace timers**: When a player disconnects during a timed phase (rolling/unlocking), they get a grace window equal to the remaining time on the phase timer. Grace timer fires `promoteToBotFromAFK()`.

2. **Phase timer tracking**: New `phaseTimerStartedAt` and `phaseTimerDuration` properties track when the current 25s AFK timeout was started, enabling remaining-time calculation.

3. **Reconnect during grace**: Player reconnecting within the grace window gets their grace timer cancelled, seat restored to `human-active`, `autopilotCounter` reset to 0, and `seat_state_changed` broadcast.

4. **Reconnect after grace expired**: Player whose seat became bot receives `room_closed` with `reason: 'seat_taken_by_bot'` and connection is closed. Client already handles room_closed by returning to menu.

5. **Empty room keepalive**: Shortened from 60s to 10s. Extracted to `startEmptyRoomKeepalive()` helper.

6. **Defensive AFK handler checks**: Both `autoRollUnresponsivePlayers` and `autoSkipUnresponsivePlayers` now catch offline non-bot players without pending grace timers and promote them immediately.

## Task Commits

| Task | Commit | Hash |
|------|--------|------|
| 1. Per-player disconnect grace timer | `feat(29-01): replace 60s keepalive with per-player disconnect grace timer` | `6affca8` |
| 2. Handle reconnect during grace window | `feat(29-01): handle reconnect during grace window` | `6519691` |
| 3. Wire grace timer into AFK timeout handlers | `feat(29-01): wire grace timer into AFK timeout handlers` | `e039c74` |

## Files Modified

- `party/server.ts` — All 3 tasks modify this file
- `version.json` — Bumped to 0.2.0.26

## Decisions Made

- **Grace = remaining phase time**: Not a fixed duration. If 20s remain on the 25s timer, grace = 20s. If 2s remain, grace = 2s. This ties disconnect handling to game rhythm.
- **Non-timed = immediate**: Locking, scoring, roundEnd, sessionEnd are transient phases where waiting makes no sense. Promote to bot immediately.
- **10s empty room**: Shortened from 60s since per-player grace handles individual disconnects now. The room-level timer only matters when ALL humans are gone.
- **No grace timer cancellation on phase transition**: Grace timers are independent setTimeouts that honor their original duration regardless of phase changes.

## Deviations from Plan

None. All tasks executed as specified.

## Issues Encountered

None.

## Next Phase Readiness

Phase 29 is now complete (1 plan). Ready for Phase 30: Mid-Game Join Flow.
