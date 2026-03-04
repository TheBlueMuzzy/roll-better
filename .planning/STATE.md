# Project State

## Current Status
Phase 17, Plan 4 (online roll/unlock rework) — Checkpoint verification pending. Per-player relay implemented for both rolling and unlocking. Buffered reveals for locks and unlocks. Ready for 2-player testing.

## Version
0.1.0.122

## Current Position

Phase: 17 of 21 (Dice Sync + Simultaneous Play)
Plan: 4 of 4 in current phase
Status: In progress — Task 4 checkpoint (human-verify)
Last activity: 2026-03-04 — Tasks 1-3 done + unlock relay rework + buffered unlock reveals

Progress: ██████████████████████████████████████████████████████░ 85%

## Last Session
2026-03-04 — Plan 17-04 execution:

### Tasks 1-3 (completed by subagent):
- **Task 1** (commit 95b8185): Server per-player roll processing — replaced handleRollRequest/executeRoll with handleRollResult, per-player relay via broadcastExcept
- **Task 2** (commit 96def5a): Client sends physics values, applies own locks locally — removed batch infrastructure
- **Task 3** (commit 829a75f): Client buffered lock reveals — addPendingLockReveal, flushPendingLockReveals, profile-emerge animations

### Bugs found during checkpoint, fixed:
- **Online unlock animation missing** (commit d3db664): Online path skipped mitosis animation. Fixed: online falls through to same animation code as offline.
- **UI reset after unlock** (commit d3db664): skipUnlock cleared selection, button came back. Fixed: hasSubmittedUnlock flag, HUD hides button + shows "Waiting for others..."
- **Server unlock batching** (commit 563d9ed): Server waited for all unlock responses before processing — should use per-player relay like rolling. Fixed: handleUnlockRequest now broadcasts immediately via broadcastExcept.
- **Client unlock buffering** (commit 563d9ed): addPendingUnlockReveal/flushPendingUnlockReveals implemented — same buffer/flush pattern as lock reveals. setHasSubmittedUnlock flushes pending reveals.
- **AFK auto-skip must-unlock** (commit 563d9ed): autoSkipUnresponsivePlayers now guards against skipping players with poolSize=0 who must unlock.

### Architecture confirmed:
- **Per-player relay** for BOTH rolling AND unlocking — server never batches
- **Client-side buffering** for BOTH lock AND unlock reveals — flush when local action completes
- **Same animations online/offline** — mitosis for self, profile-emerge for locks, AI-unlock-style shrink for unlocks
- Online = invisible plumbing — identical player experience

## Previous Sessions
- 17-03: Server wait-for-all rolling, disconnect safety, onlinePlayerIds mapping
- 17-02: Timing barrier, roll results merge, physics settle routing
- 17-01: Module-level socket, online mode flags, useOnlineGame hook

## RESOLVED: Shake-to-Roll on Phone
Shake-to-roll trigger works (confirmed 2026-03-03). Gravity-mapping idea deferred to VISION.md.
**Dev server**: `http://localhost:5174/` (PC) / `http://192.168.1.152:5174/` (phone)

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2, unlock flow updated)
- `.planning/research/dice-visuals.md` — 3D dice rendering research

## Key Decisions
- Auto-lock then choose to unlock
- Scoring: penalties [1,0,1,1], roundScore = max(0, 8 - penalty sum)
- Handicap every round (floor 1, ceiling 12)
- 2-8 players, 20-point sessions
- Phase 1: local AI, Phase 2: WebSocket rooms (##X## codes)
- Premium 3D dice: MeshPhysicalMaterial + clearcoat + HDRI + AccumulativeShadows
- Physics: Rapier, gravity -50, restitution 0.35 (die), face-up detection via dot product
- PhysicsDie: forwardRef + useImperativeHandle for roll API, settle detection via sleep events
- Settle detection: per-die boolean array with onUnsettled callback + 500ms fallback timer
- Pure physics determines roll results (no fake RNG) — online: client-authoritative values sent to server
- Vite v7 scaffold (latest stable)
- Camera locked top-down at [0, 12, 0.01], fov 50
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable, position:absolute inside game viewport
- DIE_SIZE = arena_width / 9.5 ≈ 0.589
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8, ROLLING_Z_MIN = -1.7, Placement zone floor #4a3020
- GoalRow Z = -4.67, PlayerRow Z = -3.77
- SLOT_SPACING = 0.62, getSlotX centering (i - 2.5), PROFILE_X_OFFSET = 0.10
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- SIMULTANEOUS PLAY — all players roll/lock/unlock in same phases together (NOT turn-based)
- Round ends when ANY player(s) complete the goal — multiple can win same roll
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function shared client/server
- Room server: Players Map keyed by connection ID, first player = host, host migration on disconnect
- Partykit dev port pinned to 1999 in partykit.json
- Protocol types standalone (no game.ts imports)
- Server-authoritative color assignment: PLAYER_COLORS[joinOrderIndex]
- Server-generated goalValues broadcast in game_starting
- Online game auto-fill: < 4 players → fill to 4 with AI; >= 4 → no AI
- Server unlock: per-player relay pattern (like rolling), 20s AFK timeout with must-unlock guard
- Multi-winner scoring: winners[] array in ScoringMessage
- Session end: highest score wins, ties are ties (client determines from player states)
- Starting dice = 2 (matches PRD/client)
- Disconnect-safe: removePlayer updates both room players and gameState players
- addEventListener('message') coexists with useRoom onmessage — no conflict
- Module-level socket singleton for cross-hook access (not React ref)
- onlinePlayerIds mapping: client index → server ID (connection IDs for humans, bot-N for bots)
- **Client-authoritative dice**: Each client rolls physics, reports settled values to server. Server computes locks via findAutoLocks and relays to others.
- **Per-player relay (no batching)**: Server processes each player's result individually and immediately broadcasts via broadcastExcept. Applies to BOTH rolling AND unlocking.
- **Client-side buffered reveals**: Other players' results stored in pendingLockReveals / pendingUnlockReveals. Flushed (with animation) after local player's own action. Same pattern for both.
- **Reveal animations**: Profile-emerge (scale 0→1, fly from profile to slot) for locks. AI-unlock-style (shrink, fly to profile) for unlocks. Always animated, never pop-in.

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

### Roadmap Evolution

- Milestone v1.1 Online Multiplayer created: real-time multiplayer via Partykit, 8 phases (Phase 14-21)

## Session Continuity
Last session: 2026-03-04
Stopped at: Plan 17-04, Task 4 checkpoint — waiting for user verification
Commits this session: 95b8185, 96def5a, 829a75f, d3db664, 563d9ed
Resume file: None
