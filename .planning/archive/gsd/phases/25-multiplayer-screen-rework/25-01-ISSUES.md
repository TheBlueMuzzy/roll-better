# UAT Issues: Phase 25 Plan 01

**Tested:** 2026-03-06
**Source:** .planning/phases/25-multiplayer-screen-rework/25-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-001: Room disappears from host menu after a while

**Discovered:** 2026-03-06
**Phase/Plan:** 25-01
**Severity:** Major
**Feature:** Create room inline flow
**Description:** After creating a room and waiting, the room code and player list disappear from the host's menu. Likely a WebSocket connection timeout.
**Expected:** Room stays visible until host explicitly leaves or starts a game
**Actual:** Room section vanishes after some time, possibly due to `room.isConnected` becoming false
**Repro:**
1. Tap CREATE on main menu
2. Wait ~30-60 seconds without anyone joining
3. Room code + player list disappear

## Resolved Issues

### UAT-002: JOIN button doesn't grey out when CREATE is active
**Resolved:** 2026-03-06 - Fixed in commit f858c41
**Details:** `onlineMode === 'creating' ? '' : ''` was a no-op instead of adding `' inactive'` class

---

*Phase: 25-multiplayer-screen-rework*
*Plan: 01*
*Tested: 2026-03-06*
